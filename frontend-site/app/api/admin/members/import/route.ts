import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import ExcelJS from "exceljs";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api";
import { hashPassword } from "@/lib/auth";
import { nextMemberCode } from "@/lib/memberCode";
import { logAudit } from "@/lib/audit";
import { computeMembershipEndDate } from "@/lib/format";
import { encryptField } from "@/lib/crypto";

// exceljs relies on Node APIs — pin the Node.js runtime for this handler.
export const runtime = "nodejs";

const HEADER_ALIASES: Record<string, string> = {
  id: "code",
  "member id": "code",
  "member code": "code",
  "member no": "code",
  name: "name",
  "full name": "name",
  "member name": "name",
  email: "email",
  "email address": "email",
  phone: "phone",
  mobile: "phone",
  "mobile number": "phone",
  "phone number": "phone",
  contact: "phone",
  "date joined": "joined",
  "joining date": "joined",
  "date of birth": "dob",
  dob: "dob",
  "birth date": "dob",
  birthday: "dob",
  "membership type": "plan",
  plan: "plan",
  "plan name": "plan",
  "membership start": "start",
  "start date": "start",
  "membership end": "end",
  "end date": "end",
  "expiry date": "end",
  status: "status",
  "alternate phone": "altPhone",
  "alternate mobile": "altPhone",
  aadhaar: "aadhaar",
  aadhar: "aadhaar",
  "aadhaar number": "aadhaar",
  "aadhaar card": "aadhaar",
  address: "address",
  "parent name": "parentName",
  "father name": "parentName",
  "guardian name": "parentName",
  "parent phone": "parentPhone",
  "parent mobile": "parentPhone",
  "guardian phone": "parentPhone",
  "emergency contact": "emergencyContact",
  "emergency phone": "emergencyContact",
  "emergency number": "emergencyContact",
};

function normalizeHeader(raw: unknown): string {
  if (raw == null) return "";
  const str = String(raw).trim().toLowerCase().replace(/\s+/g, " ");
  return HEADER_ALIASES[str] ?? "";
}

function parseDateCell(value: unknown): Date | null {
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === "number") {
    // Excel serial date
    const ms = Math.round((value - 25569) * 86400 * 1000);
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }
  if (value && typeof value === "object" && "result" in value) {
    return parseDateCell((value as { result: unknown }).result);
  }
  return null;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  row.push(field);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return ok({ error: "No file provided" }, { status: 400 });
    }

    const fileName = (file.name || "").toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    let rows: string[][] = [];
    if (fileName.endsWith(".csv")) {
      rows = parseCsv(buffer.toString("utf-8"));
    } else if (fileName.endsWith(".xlsx")) {
      try {
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(buffer as unknown as Parameters<typeof wb.xlsx.load>[0]);
        const ws = wb.worksheets[0];
        if (!ws) {
          return ok({ error: "Excel sheet is empty" }, { status: 400 });
        }

        ws.eachRow({ includeEmpty: false }, (r) => {
          const rowValues: string[] = [];
          // ExcelJS row values can be accessed by column index or mapped values
          const rawValues = Array.isArray(r.values) ? (r.values as unknown[]) : [];
          for (let colIdx = 1; colIdx < rawValues.length; colIdx++) {
            const rawVal = rawValues[colIdx];
            let val = rawVal;
            if (val && typeof val === "object") {
              if ("result" in val) val = (val as { result: unknown }).result;
              else if ("text" in val) val = (val as { text: unknown }).text;
              else if ("richText" in val) {
                val = ((val as { richText: { text: string }[] }).richText || [])
                  .map((rt) => rt.text)
                  .join("");
              }
            }
            rowValues.push(val == null ? "" : String(val).trim());
          }
          if (rowValues.some((c) => c !== "")) {
            rows.push(rowValues);
          }
        });
      } catch (excelErr) {
        console.error("[excel import read error]", excelErr);
        return ok(
          {
            error:
              "Could not read the .xlsx file. Make sure it is a valid, uncorrupted Excel workbook.",
          },
          { status: 400 }
        );
      }
    } else if (fileName.endsWith(".xls")) {
      return ok(
        {
          error:
            "Legacy .xls files are not supported. In Excel choose 'Save As' → .xlsx (or export as .csv), then re-import.",
        },
        { status: 400 }
      );
    } else {
      return ok({ error: "Unsupported file type. Upload .xlsx or .csv" }, { status: 400 });
    }

    if (rows.length < 2) {
      return ok({ error: "File has no data rows" }, { status: 400 });
    }

    const headers = rows[0].map(normalizeHeader);
    const col = (row: string[], key: string): string => {
      const idx = headers.indexOf(key);
      if (idx < 0 || idx >= row.length || row[idx] == null) return "";
      return String(row[idx]).trim();
    };

    if (!headers.includes("name") || !headers.includes("email")) {
      return ok(
        { error: "File must have 'Name' and 'Email' columns (others optional)" },
        { status: 400 }
      );
    }

    const plans = await prisma.membershipPlan.findMany();
    const planByName = new Map(plans.map((p) => [p.name.toLowerCase(), p]));

    const created: string[] = [];
    const updated: string[] = [];
    const errors: string[] = [];
    const duplicateCodes: string[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row.some((c) => c && String(c).trim() !== "")) continue;

      const line = i + 1;
      const nameValue = col(row, "name");
      const rawEmail = col(row, "email");
      if (!nameValue || !rawEmail) {
        errors.push(`Row ${line}: missing name or email`);
        continue;
      }
      const emailValue = rawEmail.toLowerCase();

      const phone = col(row, "phone") || null;
      const altPhone = col(row, "altPhone") || null;
      const aadhaar = col(row, "aadhaar") || null;
      const address = col(row, "address") || null;
      const parentName = col(row, "parentName") || null;
      const parentPhone = col(row, "parentPhone") || null;
      const emergencyContact = col(row, "emergencyContact") || null;
      const dob = parseDateCell(col(row, "dob"));
      const joined = parseDateCell(col(row, "joined"));
      const start = parseDateCell(col(row, "start"));
      const end = parseDateCell(col(row, "end"));
      const planName = col(row, "plan");
      const plan = planName ? planByName.get(planName.toLowerCase()) ?? null : null;

      try {
        const existing = await prisma.user.findUnique({ where: { email: emailValue } });

        if (existing) {
          // Never touch admin/trainer accounts via a member import — that would
          // overwrite staff names and attach member PII to their account.
          if (existing.role !== Role.MEMBER) {
            errors.push(`Row ${line}: ${nameValue} — email belongs to a ${existing.role.toLowerCase()} account; skipped`);
            continue;
          }
          await prisma.user.update({
            where: { id: existing.id },
            data: {
              name: nameValue,
              phone: phone ?? existing.phone,
              memberProfile: {
                upsert: {
                  create: {
                    alternatePhone: altPhone,
                    aadhaarNumber: aadhaar ? encryptField(aadhaar) : undefined,
                    address,
                    parentName,
                    parentPhone,
                    emergencyContact,
                    dateOfBirth: dob ?? undefined,
                    joiningDate: joined ?? undefined,
                  },
                  update: {
                    alternatePhone: altPhone ?? undefined,
                    aadhaarNumber: aadhaar ? encryptField(aadhaar) : undefined,
                    address: address ?? undefined,
                    parentName: parentName ?? undefined,
                    parentPhone: parentPhone ?? undefined,
                    emergencyContact: emergencyContact ?? undefined,
                    dateOfBirth: dob ?? undefined,
                    joiningDate: joined ?? undefined,
                  },
                },
              },
            },
          });
          updated.push(nameValue);
        } else {
          // Imported members get a secure random password
          const code = await nextMemberCode(prisma);
          const user = await prisma.user.create({
            data: {
              name: nameValue,
              email: emailValue,
              phone,
              memberCode: code,
              passwordHash: await hashPassword(Math.random().toString(36).slice(2) + Date.now()),
              role: Role.MEMBER,
              memberProfile: {
                create: {
                  alternatePhone: altPhone,
                  aadhaarNumber: aadhaar ? encryptField(aadhaar) : undefined,
                  address,
                  parentName,
                  parentPhone,
                  emergencyContact,
                  dateOfBirth: dob ?? undefined,
                  joiningDate: joined ?? undefined,
                },
              },
            },
          });
          created.push(nameValue);

          // Grant membership when a plan + dates are provided (uses calendar-month date arithmetic)
          if (plan) {
            const s = start ?? new Date();
            const e = end ?? computeMembershipEndDate(s, plan.durationDays);
            const ms = await prisma.membership.create({
              data: {
                memberId: user.id,
                planId: plan.id,
                startDate: s,
                endDate: e,
              },
            });

            await prisma.payment.create({
              data: {
                orderId: `excel_${user.id.slice(-6)}_${ms.id.slice(-6)}`,
                paymentId: `pay_excel_${ms.id.slice(-6)}`,
                amount: plan.price,
                currency: "INR",
                status: "PAID",
                method: "EXCEL_IMPORT",
                memberId: user.id,
                planId: plan.id,
                membershipId: ms.id,
                paidAt: s,
              },
            }).catch(() => {});
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "unknown error";
        if (msg.includes("Unique constraint") && msg.includes("User_memberCode")) {
          duplicateCodes.push(`Row ${line}: duplicate member code, retry import`);
        } else {
          errors.push(`Row ${line}: ${nameValue} — ${msg}`);
        }
      }
    }

    try {
      await logAudit(admin.id, "IMPORT_MEMBERS", "User", null, {
        created: created.length,
        updated: updated.length,
        failed: errors.length,
        file: file.name,
      });
    } catch (auditErr) {
      console.error("[api][members-import] audit log failed", auditErr);
    }

    return ok({
      summary: {
        created: created.length,
        updated: updated.length,
        failed: errors.length,
        createdNames: created,
        updatedNames: updated,
      },
      errors: errors.slice(0, 20),
      note:
        duplicateCodes.length > 0
          ? "Some rows collided on member code — please retry the import."
          : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[api][members-import]", error);
    return ok({ error: message }, { status: 500 });
  }
}
