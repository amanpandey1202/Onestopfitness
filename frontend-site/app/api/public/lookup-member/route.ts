import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const query = url.searchParams.get("query")?.trim();

    if (!query || query.length < 3) {
      return NextResponse.json({ memberId: null });
    }

    const q = query.toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: q },
          { phone: q },
          { memberCode: query },
        ],
      },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ memberId: null });
    }

    // Only the member id is returned — never name/email/phone. The public pay
    // page only needs the id to create an order, so no PII is exposed here.
    return NextResponse.json({ memberId: user.id });
  } catch (error) {
    return NextResponse.json({ memberId: null });
  }
}
