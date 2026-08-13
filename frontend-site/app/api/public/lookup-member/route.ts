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
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ memberId: null });
    }

    return NextResponse.json({ memberId: user.id, name: user.name, email: user.email });
  } catch (error) {
    return NextResponse.json({ memberId: null });
  }
}
