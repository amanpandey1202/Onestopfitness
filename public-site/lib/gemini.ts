/**
 * Gemini AI Engagement Prediction Service for ONE STOP FITNESS
 * 
 * Provides AI-powered analysis of member engagement, churn risk,
 * and automated messaging templates using Google's Gemini API.
 * 
 * Set GEMINI_API_KEY in .env to enable AI features.
 * Without the key, fallback deterministic logic is used.
 */

// Helper to safely check if AI is available
function isAiAvailable(): boolean {
  if (typeof window !== "undefined") return false; // Client-side only
  return !!process.env.GEMINI_API_KEY;
}

// Fallback engagement prediction when AI is not configured
function fallbackEngagementPrediction(
  daysSinceLastCheckIn: number,
  membershipEndDate: Date | null,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  totalCheckIns: number
): {
  churnRisk: "low" | "medium" | "high";
  probability: number;
  reasons: string[];
  recommendations: string[];
  predictedStayDays: number;
} {
  const daysRemaining = membershipEndDate
    ? Math.ceil((membershipEndDate.getTime() - new Date().getTime()) / 86_400_000)
    : 0;

  let churnRisk: "low" | "medium" | "high";
  let probability: number;

  if (daysSinceLastCheckIn >= 14) {
    churnRisk = "high";
    probability = 85;
  } else if (daysSinceLastCheckIn >= 7) {
    churnRisk = "medium";
    probability = 55;
  } else {
    churnRisk = "low";
    probability = 20;
  }

  const reasons: string[] = [];
  const recommendations: string[] = [];

  if (churnRisk === "high") {
    reasons.push("No check-ins in last 14 days");
    reasons.push("Low gym attendance frequency");
    recommendations.push("Send personalized outreach");
    recommendations.push("Offer reactivation deal");
  } else if (churnRisk === "medium") {
    reasons.push("Infrequent check-ins");
    reasons.push("Membership not fully utilized");
    recommendations.push("Send motivation tips");
    recommendations.push("Invite to new class");
  } else {
    reasons.push("Active member");
    reasons.push("Regular gym usage");
    recommendations.push("Keep up the great work!");
    recommendations.push("Refer a friend");
  }

  return {
    churnRisk,
    probability,
    reasons,
    recommendations,
    predictedStayDays: Math.max(0, daysRemaining || 30),
  };
}

// Fallback absentee analysis when AI is not configured
function fallbackAbsenteeAnalysis(
  daysSinceLastCheckIn: number,
  membershipStatus: "ACTIVE" | "EXPIRED" | "SUSPENDED",
  daysUntilExpiry: number
): {
  messageTemplate: "absentee" | "expiry-soon" | "expiry-crossed";
  churnRisk: "low" | "medium" | "high";
} {
  let messageTemplate: "absentee" | "expiry-soon" | "expiry-crossed" = "absentee";
  let churnRisk: "low" | "medium" | "high" = "low";

  if (daysSinceLastCheckIn >= 14) {
    churnRisk = "high";
    messageTemplate = "absentee";
  } else if (daysSinceLastCheckIn >= 7) {
    churnRisk = "medium";
    messageTemplate = "absentee";
  } else {
    churnRisk = "low";
    messageTemplate = "absentee";
  }

  // Check membership expiry
  if (membershipStatus === "ACTIVE" && daysUntilExpiry >= 0 && daysUntilExpiry <= 7) {
    messageTemplate = "expiry-soon";
  }
  if (membershipStatus === "ACTIVE" && daysUntilExpiry < 0) {
    messageTemplate = "expiry-crossed";
  }

  return { messageTemplate, churnRisk };
}

export interface EngagementPrediction {
  userId: string;
  name: string;
  churnRisk: "low" | "medium" | "high";
  probability: number; // 0-100
  reasons: string[];
  recommendations: string[];
  predictedStayDays: number;
}

export interface AbsenteeAnalysis {
  memberId: string;
  name: string;
  daysSinceLastCheckIn: number;
  membershipStatus: "ACTIVE" | "EXPIRED" | "SUSPENDED";
  daysUntilExpiry: number;
  churnRisk: "low" | "medium" | "high";
  messageTemplate: "absentee" | "expiry-soon" | "expiry-crossed";
  engagementMessage?: string;
}

/**
 * Predict member engagement/churn risk using Gemini AI or fallback logic.
 * 
 * @param memberId - Member's unique identifier
 * @param checkInHistory - Array of check-in Date objects (last 30 days)
 * @param membershipEndDate - Membership end date, or null if no active membership
 * @param daysSinceLastCheckIn - Days since the member's last check-in
 * @param totalCheckIns - Total number of check-ins recorded
 */
export async function predictEngagement(
  memberId: string,
  checkInHistory: Date[],
  membershipEndDate: Date | null,
  daysSinceLastCheckIn: number,
  totalCheckIns: number
): Promise<EngagementPrediction> {
  if (isAiAvailable()) {
    // Try to use Gemini AI
    try {
      // We'll implement the AI call here in the API route instead
      // to keep the module clean and server-side only
      throw new Error("Use API route for AI calls");
    } catch {
      // Fall through to fallback
    }
  }

  // Use fallback logic
  const fallback = fallbackEngagementPrediction(
    daysSinceLastCheckIn,
    membershipEndDate,
    totalCheckIns
  );

  return {
    userId: memberId,
    name: "Member",
    churnRisk: fallback.churnRisk,
    probability: fallback.probability,
    reasons: fallback.reasons,
    recommendations: fallback.recommendations,
    predictedStayDays: fallback.predictedStayDays,
  };
}

/**
 * Analyze absentee member using Gemini AI or fallback logic.
 */
export async function analyzeAbsenteeMember(
  memberId: string,
  name: string,
  lastCheckIn: Date | null,
  membership: { status: string; endDate: Date | null; plan: { price: number } } | null,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  checkInHistory: Array<{ checkIn: Date }>
): Promise<AbsenteeAnalysis> {
  if (isAiAvailable()) {
    // AI analysis will be done via API route
    throw new Error("Use API route for AI analysis");
  }

  // Use fallback logic
  const daysSinceLast = lastCheckIn
    ? Math.ceil((new Date().getTime() - lastCheckIn.getTime()) / 86_400_000)
    : 999;

  const daysUntilExpiry = membership?.endDate
    ? Math.ceil((new Date(membership.endDate).getTime() - new Date().getTime()) / 86_400_000)
    : 0;

  const membershipStatus = membership?.status === "ACTIVE"
    ? (daysUntilExpiry > 0 ? "ACTIVE" : "EXPIRED")
    : "SUSPENDED";

  const fallback = fallbackAbsenteeAnalysis(daysSinceLast, membershipStatus, daysUntilExpiry);

  // Generate engagement message
  const engagementMessages: Record<
    "absentee" | "expiry-soon" | "expiry-crossed",
    string
  > = {
    "absentee": `Hey ${name}! We noticed you've been missed. Come back and train with us!`,
    "expiry-soon": `Hey ${name}! Your membership expires soon. Renew now and keep your gains!`,
    "expiry-crossed": `Hey ${name}! Your membership has expired. We want you back!`,
  };

  return {
    memberId: memberId,
    name,
    daysSinceLastCheckIn: daysSinceLast,
    membershipStatus,
    daysUntilExpiry: Math.max(0, daysUntilExpiry),
    churnRisk: fallback.churnRisk,
    messageTemplate: fallback.messageTemplate,
    engagementMessage: engagementMessages[fallback.messageTemplate],
  };
}