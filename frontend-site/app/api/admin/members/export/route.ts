import { Role } from "@prisma/client";
import ExcelJS from "exceljs";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { fail } from "@/lib/api";

/**
 * Exports all members to a real .xlsx file.
 *
 * SECURITY: only basic contact/membership fields are exported.
 * Sensitive fields (alternate phone, Aadhaar, address, parent info)
 * are stored in the app but NEVER included here.
 */
export async function GET() {
  try {
    await requireAdmin();

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
    wb.creator = "ONE STOP FITNESS";
    wb.created = new Date();

    const ws = wb.addWorksheet("Members");

    ws.columns = [
      { header: "Member ID", key: "code", width: 12 },
      { header: "Name", key: "name", width: 24 },
      { header: "Email", key: "email", width: 30 },
      { header: "Phone", key: "phone", width: 16 },
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
        joined: m.memberProfile?.joiningDate
          ? new Date(m.memberProfile.joiningDate).toLocaleDateString("en-IN")
          : "",
        plan: mem?.plan?.name ?? "",
        start: mem?.startDate ? new Date(mem.startDate).toLocaleDateString("en-IN") : "",
        end: end ? new Date(end).toLocaleDateString("en-IN") : "",
        status,
      });
    }

    ws.autoFilter = { from: "A1", to: "I1" };

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
