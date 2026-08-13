import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Validates that the request carries the shared webhook secret. */
function validateWebhookSecret(request: Request): boolean {
  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (!secret) return false; // fail closed — must be configured in production
  const header = request.headers.get("x-webhook-secret");
  return header === secret;
}

/**
 * N8N Webhook Endpoints for One Stop Fitness
 * 
 * These endpoints allow N8N to trigger automated workflows based on
 * gym events like member absenteeism and membership expiry.
 * 
 * N8N can call these webhooks with JSON payloads to:
 * - Send automated WhatsApp messages
 * - Update member records
 * - Trigger follow-up actions
 */

// Helper function to send message (placeholder for actual integration)
async function triggerMessage(type: string, memberId: string, customMessage?: string) {
  // This would integrate with Twilio/WA Cloud API in production
  // For now, we just log and return success
  console.log(`N8N Webhook: ${type} message triggered for member ${memberId}`);
  
  if (customMessage) {
    console.log(`Custom message: ${customMessage}`);
  }
  
  return { success: true, message: "Message queued for sending" };
}

/**
 * N8N Webhook: Absentee Member Alert
 * 
 * Triggered when a member hasn't checked in for 14+ days.
 * N8N payload example:
 * {
 *   "memberId": "user-member-id",
 *   "customMessage": "Hey John! We miss you come back soon!"
 * }
 */
export async function POST(request: Request) {
  try {
    if (!validateWebhookSecret(request)) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const { memberId, customMessage } = body;

    if (!memberId) {
      return new NextResponse(
        JSON.stringify({ error: "memberId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate member exists and fetch real attendance data
    const now = new Date();
    const [member, latestAttendance] = await Promise.all([
      prisma.user.findUnique({
        where: { id: memberId },
        include: {
          memberProfile: true,
          memberships: { include: { plan: true }, orderBy: { endDate: "desc" }, take: 1 },
        },
      }),
      prisma.attendance.findFirst({
        where: { memberId },
        orderBy: { checkIn: "desc" },
      }),
    ]);

    if (!member) {
      return new NextResponse(
        JSON.stringify({ error: "Member not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Real days-since-last-check-in from actual attendance data
    const daysSinceLastCheckIn = latestAttendance
      ? Math.ceil((now.getTime() - new Date(latestAttendance.checkIn).getTime()) / 86_400_000)
      : 999;

    let messageType = "absentee";
    const latestMembership = member.memberships[0];

    if (latestMembership) {
      const daysUntilExpiry = Math.ceil(
        (new Date(latestMembership.endDate).getTime() - now.getTime()) / 86_400_000
      );

      if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
        messageType = "expiry-soon";
      } else if (daysUntilExpiry < 0) {
        messageType = "expiry-crossed";
      }
    }

    const result = await triggerMessage(messageType, memberId, customMessage);

    return new NextResponse(
      JSON.stringify({ ...result, daysSinceLastCheckIn, messageType }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("N8N webhook error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * N8N Webhook: Membership Expiry Alert
 * 
 * Triggered when a membership is expiring soon or has crossed.
 * N8N payload example:
 * {
 *   "memberId": "user-member-id",
 *   "customMessage": "Renew now and save 20%",
 *   "daysUntilExpiry": 5
 * }
 */
export async function GET(request: Request) {
  try {
    if (!validateWebhookSecret(request)) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return new NextResponse(
        JSON.stringify({ error: "memberId query parameter required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get member data
    const member = await prisma.user.findUnique({
      where: { id: memberId },
      include: {
        memberProfile: true,
        memberships: {
          include: { plan: true },
          orderBy: { endDate: "desc" },
          take: 1,
        },
      },
    });

    if (!member) {
      return new NextResponse(
        JSON.stringify({ error: "Member not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const latestMembership = member.memberships[0];
    const now = new Date();

    if (!latestMembership) {
      return new NextResponse(
        JSON.stringify({ error: "No active membership found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const daysUntilExpiry = Math.ceil(
      (new Date(latestMembership.endDate).getTime() - now.getTime()) / 86_400_000
    );

    let messageType = "expiry-soon";
    if (daysUntilExpiry < 0) {
      messageType = "expiry-crossed";
    }

    // Get custom message if provided in query
    const customMessage = searchParams.get("customMessage");

    // Trigger message
    const result = await triggerMessage(
      messageType,
      memberId,
      customMessage || undefined
    );

    // Add additional context
    const response = {
      ...result,
      memberId: member.id,
      name: member.name,
      daysUntilExpiry,
      planName: latestMembership.plan.name,
      messageType,
    };

    return new NextResponse(
      JSON.stringify(response),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("N8N membership webhook error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}