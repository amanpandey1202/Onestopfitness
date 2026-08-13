import { NextRequest, NextResponse } from "next/server";
import { requireMember } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { getCompetitionById } from "@/lib/services/public";
import { created, fail } from "@/lib/api";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireMember();
    const { id } = await ctx.params;

    const competition = await getCompetitionById(id);
    if (!competition || competition.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Competition not found" }, { status: 404 });
    }
    if (competition.endDate && competition.endDate.getTime() < Date.now()) {
      return NextResponse.json({ error: "This competition has ended" }, { status: 409 });
    }
    if (
      competition.maxParticipants &&
      competition._count.participants >= competition.maxParticipants
    ) {
      return NextResponse.json({ error: "Competition is full" }, { status: 409 });
    }

    try {
      const entry = await prisma.competitionParticipant.create({
        data: { competitionId: id, memberId: user.id },
      });
      return created({ id: entry.id, joinedAt: entry.joinedAt });
    } catch {
      // unique(competitionId, memberId) → already joined
      return NextResponse.json({ error: "You've already joined this competition" }, { status: 409 });
    }
  } catch (error) {
    return fail(error);
  }
}
