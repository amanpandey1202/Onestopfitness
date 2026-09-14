import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MEMBER_CODE_RE = /^[A-Za-z0-9_-]{3,20}$/;

function tenDigitPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  return digits.length === 10 ? digits : null;
}

export async function GET(req: NextRequest) {
  try {
    // Per-IP gate so member ids can't be scraped en masse.
    if (!rateLimit(`lookup:${clientIp(req)}`, 10, 60_000)) {
      return NextResponse.json({ error: "Too many lookups. Try again later." }, { status: 429 });
    }

    const url = new URL(req.url);
    const query = url.searchParams.get("query")?.trim();

    if (!query || query.length < 3) {
      return NextResponse.json({ memberId: null });
    }

    const q = query.toLowerCase();

    // Strict input shaping: only a well-formed email, a 10-digit phone, or a
    // member-code style token ever reaches the query. Covers the public pay
    // page (which only submits those three forms) without an enumeration oracle.
    let where: { email: string } | { phone: string } | { memberCode: string } | null = null;
    if (q.includes("@")) {
      where = EMAIL_RE.test(q) ? { email: q } : null;
    } else {
      const phone = tenDigitPhone(q);
      where = phone ? { phone } : MEMBER_CODE_RE.test(query) ? { memberCode: query } : null;
    }

    if (!where) {
      return NextResponse.json({ memberId: null });
    }

    const user = await prisma.user.findFirst({ where, select: { id: true } });

    if (!user) {
      return NextResponse.json({ memberId: null });
    }

    // Only the member id is returned — never name/email/phone. The public pay
    // page only needs the id to create an order, so no PII is exposed here.
    return NextResponse.json({ memberId: user.id });
  } catch {
    return NextResponse.json({ memberId: null });
  }
}
