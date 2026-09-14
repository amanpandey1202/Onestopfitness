import { NextRequest, NextResponse } from "next/server";
import { site } from "@/data/site";
import { Role } from "@prisma/client";
import ExcelJS from "exceljs";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail } from "@/lib/api";
import { decryptField } from "@/lib/crypto";

/**
 * Exports all members to a real .xlsx file.
 *
 * Admin-only endpoint (goes through requireAdmin). Includes sensitive profile
 * fields (Aadhaar, address, parent/emergency contacts) DECRYPTED from at-rest
 * ciphertext, so the file can be used for backup / import round-trips. Treat
 * the downloaded file like the Aadhaar card itself.
 *
 * Requires ?confirm=1 so the full-PII download is an explicit deliberate action.
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const url = new URL(req.url);
    if (url.searchParams.get("confirm") !== "1") {
      return NextResponse.json(
        { error: "This download contains full Aadhaar numbers, addresses and contacts. Re-request with ?confirm=1 to download." },
        { status: 400 }
      );
    }

    const members = await prisma.user.findMany({
      where: { role: Role.MEMBER },
      orderBy: { memberCode: "asc" },
      include: {
        memberProfile: true,
        memberships: {
          orderBy: { endDate: "desc" },
          take: 1,
          include: { plan: true },
        },
      },
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = site.name;
    wb.created = new Date();

    const ws = wb.addWorksheet("Members");

    ws.columns = [
      { header: "Member ID", key: "code", width: 12 },
      { header: "Name", key: "name", width: 24 },
      { header: "Email", key: "email", width: 30 },
      { header: "Phone", key: "phone", width: 16 },
      { header: "Alternate Phone", key: "altPhone", width: 16 },
      { header: "Aadhaar", key: "aadhaar", width: 20 },
      { header: "Address", key: "address", width: 30 },
      { header: "Parent Name", key: "parentName", width: 20 },
      { header: "Parent Phone", key: "parentPhone", width: 16 },
      { header: "Emergency Contact", key: "emergencyContact", width: 16 },
      { header: "Date Joined", key: "joined", width: 14 },
      { header: "Membership Type", key: "plan", width: 22 },
      { header: "Membership Start", key: "start", width: 16 },
      { header: "Membership End", key: "end", width: 16 },
      { header: "Status", key: "status", width: 12 },
    ];

    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF9AD901" },
    };

    const now = new Date();
    for (const m of members) {
      const mem = m.memberships[0] ?? null;
      const end = mem?.endDate ?? null;
      let status = m.isActive ? "Active" : "Suspended";
      if (mem?.status === "ACTIVE" && end && new Date(end).getTime() < now.getTime()) {
        status = "Expired";
      } else if (mem) {
        status = "Active";
      } else {
        status = m.isActive ? "No Plan" : "Suspended";
      }

      ws.addRow({
        code: m.memberCode ?? "",
        name: m.name,
        email: m.email,
        phone: m.phone ?? "",
        altPhone: m.memberProfile?.alternatePhone ?? "",
        aadhaar: decryptField(m.memberProfile?.aadhaarNumber) ?? "",
        address: m.memberProfile?.address ?? "",
        parentName: m.memberProfile?.parentName ?? "",
        parentPhone: m.memberProfile?.parentPhone ?? "",
        emergencyContact: m.memberProfile?.emergencyContact ?? "",
        joined: m.memberProfile?.joiningDate
          ? new Date(m.memberProfile.joiningDate).toLocaleDateString("en-IN")
          : "",
        plan: mem?.plan?.name ?? "",
        start: mem?.startDate ? new Date(mem.startDate).toLocaleDateString("en-IN") : "",
        end: end ? new Date(end).toLocaleDateString("en-IN") : "",
        status,
      });
    }

    ws.autoFilter = { from: "A1", to: "O1" };

    const buf = await wb.xlsx.writeBuffer();

    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="members-${new Date()
          .toISOString()
          .slice(0, 10)}.xlsx"`,
      },
    });
  } catch (error) {
    return fail(error);
  }
}
