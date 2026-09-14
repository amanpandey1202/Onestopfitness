import { site } from "@/data/site";

/**
 * Email Notification Service (provider-agnostic).
 *
 * Provider is chosen with EMAIL_PROVIDER:
 *   - "brevo"   → Brevo transactional API (no domain needed; sender email is
 *                 verified by clicking a link in its inbox). Needs BREVO_API_KEY.
 *   - "resend"  → Resend API (requires a verified domain). Needs RESEND_API_KEY.
 * Defaults to "resend" for backward compatibility.
 *
* Switching providers later only changes EMAIL_PROVIDER + the matching API key.
  */

/** Minimal HTML-escape for dynamic user values interpolated into templates. */
function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function emailProvider(): "brevo" | "resend" {
  const p = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
  return p === "brevo" ? "brevo" : "resend";
}

function parseFrom(from: string): { name: string; email: string } {
  const match = from.match(/^(.*?)\s*<([^>]+)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { name: "", email: from.trim() };
}

export function emailConfigured(): boolean {
  return emailProvider() === "brevo"
    ? Boolean(process.env.BREVO_API_KEY)
    : Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  if (!emailConfigured()) {
    if (process.env.NODE_ENV === "production") {
      const missing = emailProvider() === "brevo" ? "BREVO_API_KEY" : "RESEND_API_KEY";
      throw new Error(
        `[email] ${missing} is not set (EMAIL_PROVIDER="${emailProvider()}") in production — ` +
          `refusing to silently drop email to "${to}" (subject: "${subject}")`
      );
    }
    console.log(`[email mockup] To: ${to} | Subject: ${subject}`);
    return true;
  }

  try {
    if (emailProvider() === "brevo") {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": process.env.BREVO_API_KEY as string,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: parseFrom(process.env.EMAIL_FROM || `${site.name} <noreply@${site.domain}>`),
          to: [{ email: to }],
          subject,
          htmlContent: html,
        }),
      });

      if (!res.ok) {
        console.error("[email] Brevo error:", res.status, await res.text());
        return false;
      }
      return true;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || `${site.name} <noreply@${site.domain}>`,
        to,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      console.error("[email] Resend error:", res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] Send failed:", err);
    return false;
  }
}

export async function sendWelcomeEmail(to: string, name: string, memberCode?: string | null) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0c0c0c; color: #ffffff; padding: 30px; border-radius: 12px;">
      <h1 style="color: #9AD901; text-transform: uppercase; margin-bottom: 5px;">${esc(site.name)}</h1>
      <p style="color: #888; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin-top: 0;">Welcome to the Family</p>
      <hr style="border: 0; border-top: 1px solid #222; margin: 20px 0;" />
      <p>Hi <strong>${esc(name)}</strong>,</p>
      <p>Welcome to ${esc(site.name)}! We are thrilled to have you join our community in ${esc(site.addressShort)}.</p>
      ${memberCode ? `<p style="background: #181818; padding: 12px; border-radius: 6px; border-left: 4px solid #9AD901;">Your Member Code: <strong>${esc(memberCode)}</strong></p>` : ''}
      <p>Log in to your member portal anytime to check in via QR code, view your custom workout and diet plans, and track your body measurements.</p>
      <p style="margin-top: 30px;"><a href="${baseUrl()}/login" style="background: #9AD901; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">Go to Member Portal</a></p>
      <hr style="border: 0; border-top: 1px solid #222; margin: 30px 0 15px 0;" />
      <p style="color: #666; font-size: 11px; text-align: center;">${esc(site.name)} · ${esc(site.addressShort)} · Phone: ${esc(site.phoneDisplay)}</p>
    </div>
  `;
  return sendEmail({ to, subject: `Welcome to ${site.name}! 💪`, html });
}

export function baseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || `https://${site.domain}`;
}

export async function sendVerificationEmail(to: string, token: string) {
  const link = `${baseUrl()}/verify-email?token=${token}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0c0c0c; color: #ffffff; padding: 30px; border-radius: 12px;">
      <h1 style="color: #9AD901; text-transform: uppercase; margin-bottom: 5px;">${esc(site.name)}</h1>
      <p style="color: #888; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin-top: 0;">Confirm Your Email</p>
      <hr style="border: 0; border-top: 1px solid #222; margin: 20px 0;" />
      <p>Hi there,</p>
      <p>Confirm that this email address belongs to you so you can activate your ${esc(site.name)} membership account. This link expires in <strong>24 hours</strong>.</p>
      <p style="margin-top: 30px;"><a href="${esc(link)}" style="background: #9AD901; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">Verify my email</a></p>
      <p style="color: #888; font-size: 12px;">If the button doesn't work, copy this link: ${esc(link)}</p>
    </div>
  `;
  return sendEmail({ to, subject: `Confirm your ${site.name} email ✉️`, html });
}

export async function sendPasswordResetEmail(to: string, name: string, token: string) {
  const link = `${baseUrl()}/reset-password?token=${token}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0c0c0c; color: #ffffff; padding: 30px; border-radius: 12px;">
      <h1 style="color: #9AD901; text-transform: uppercase; margin-bottom: 5px;">${esc(site.name)}</h1>
      <p style="color: #888; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin-top: 0;">Password Reset</p>
      <hr style="border: 0; border-top: 1px solid #222; margin: 20px 0;" />
      <p>Hi <strong>${esc(name)}</strong>,</p>
      <p>We received a request to reset your password. Click below to choose a new one. This link expires in <strong>30 minutes</strong>.</p>
      <p style="margin-top: 30px;"><a href="${esc(link)}" style="background: #9AD901; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">Reset my password</a></p>
      <p style="color: #888; font-size: 12px;">If you didn't ask for this, you can safely ignore this email. Your password won't change.</p>
      <p style="color: #888; font-size: 12px;">Or copy this link: ${esc(link)}</p>
    </div>
  `;
  return sendEmail({ to, subject: `Reset your ${site.name} password 🔐`, html });
}

export async function sendExpiryWarningEmail(to: string, name: string, planName: string, daysLeft: number) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0c0c0c; color: #ffffff; padding: 30px; border-radius: 12px;">
      <h1 style="color: #9AD901; text-transform: uppercase; margin-bottom: 5px;">${esc(site.name)}</h1>
      <p style="color: #eab308; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin-top: 0;">Membership Renewal Reminder</p>
      <hr style="border: 0; border-top: 1px solid #222; margin: 20px 0;" />
      <p>Hi <strong>${esc(name)}</strong>,</p>
      <p>Your <strong>${esc(planName)}</strong> membership will expire in <strong>${daysLeft} day${daysLeft === 1 ? '' : 's'}</strong>.</p>
      <p>Don't break your streak! Renew online or at the front desk to keep training without interruption.</p>
      <p style="margin-top: 30px;"><a href="${baseUrl()}/member/pay" style="background: #9AD901; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">Renew Membership Now</a></p>
    </div>
  `;
  return sendEmail({ to, subject: `Reminder: Your membership expires in ${daysLeft} days ⏰`, html });
}
