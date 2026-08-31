/**
 * Email Notification Service (using Resend or generic SMTP/fetch)
 * Set RESEND_API_KEY in .env to enable email sending.
 */

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
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
    console.log(`[email mockup] To: ${to} | Subject: ${subject}`);
    return true;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "ONE STOP FITNESS <noreply@onestopfit.in>",
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
      <h1 style="color: #9AD901; text-transform: uppercase; margin-bottom: 5px;">ONE STOP FITNESS</h1>
      <p style="color: #888; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin-top: 0;">Welcome to the Family</p>
      <hr style="border: 0; border-top: 1px solid #222; margin: 20px 0;" />
      <p>Hi <strong>${name}</strong>,</p>
      <p>Welcome to ONE STOP FITNESS! We are thrilled to have you join our community in Rajajipuram, Lucknow.</p>
      ${memberCode ? `<p style="background: #181818; padding: 12px; border-radius: 6px; border-left: 4px solid #9AD901;">Your Member Code: <strong>${memberCode}</strong></p>` : ''}
      <p>Log in to your member portal anytime to check in via QR code, view your custom workout and diet plans, and track your body measurements.</p>
      <p style="margin-top: 30px;"><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login" style="background: #9AD901; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">Go to Member Portal</a></p>
      <hr style="border: 0; border-top: 1px solid #222; margin: 30px 0 15px 0;" />
      <p style="color: #666; font-size: 11px; text-align: center;">ONE STOP FITNESS · Rajajipuram, Lucknow · Phone: +91 92369 58881</p>
    </div>
  `;
  return sendEmail({ to, subject: "Welcome to ONE STOP FITNESS! 💪", html });
}

export function baseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || `http://localhost:${process.env.PORT || 3000}`;
}

export async function sendVerificationEmail(to: string, token: string) {
  const link = `${baseUrl()}/verify-email?token=${token}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0c0c0c; color: #ffffff; padding: 30px; border-radius: 12px;">
      <h1 style="color: #9AD901; text-transform: uppercase; margin-bottom: 5px;">ONE STOP FITNESS</h1>
      <p style="color: #888; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin-top: 0;">Confirm Your Email</p>
      <hr style="border: 0; border-top: 1px solid #222; margin: 20px 0;" />
      <p>Hi there,</p>
      <p>Confirm that this email address belongs to you so you can activate your One Stop Fitness membership account. This link expires in <strong>24 hours</strong>.</p>
      <p style="margin-top: 30px;"><a href="${link}" style="background: #9AD901; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">Verify my email</a></p>
      <p style="color: #888; font-size: 12px;">If the button doesn't work, copy this link: ${link}</p>
    </div>
  `;
  return sendEmail({ to, subject: "Confirm your One Stop Fitness email ✉️", html });
}

export async function sendPasswordResetEmail(to: string, name: string, token: string) {
  const link = `${baseUrl()}/reset-password?token=${token}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0c0c0c; color: #ffffff; padding: 30px; border-radius: 12px;">
      <h1 style="color: #9AD901; text-transform: uppercase; margin-bottom: 5px;">ONE STOP FITNESS</h1>
      <p style="color: #888; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin-top: 0;">Password Reset</p>
      <hr style="border: 0; border-top: 1px solid #222; margin: 20px 0;" />
      <p>Hi <strong>${name}</strong>,</p>
      <p>We received a request to reset your password. Click below to choose a new one. This link expires in <strong>30 minutes</strong>.</p>
      <p style="margin-top: 30px;"><a href="${link}" style="background: #9AD901; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">Reset my password</a></p>
      <p style="color: #888; font-size: 12px;">If you didn't ask for this, you can safely ignore this email. Your password won't change.</p>
      <p style="color: #888; font-size: 12px;">Or copy this link: ${link}</p>
    </div>
  `;
  return sendEmail({ to, subject: "Reset your One Stop Fitness password 🔐", html });
}

export async function sendExpiryWarningEmail(to: string, name: string, planName: string, daysLeft: number) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0c0c0c; color: #ffffff; padding: 30px; border-radius: 12px;">
      <h1 style="color: #9AD901; text-transform: uppercase; margin-bottom: 5px;">ONE STOP FITNESS</h1>
      <p style="color: #eab308; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin-top: 0;">Membership Renewal Reminder</p>
      <hr style="border: 0; border-top: 1px solid #222; margin: 20px 0;" />
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your <strong>${planName}</strong> membership will expire in <strong>${daysLeft} day${daysLeft === 1 ? '' : 's'}</strong>.</p>
      <p>Don't break your streak! Renew online or at the front desk to keep training without interruption.</p>
      <p style="margin-top: 30px;"><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/member/pay" style="background: #9AD901; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">Renew Membership Now</a></p>
    </div>
  `;
  return sendEmail({ to, subject: `Reminder: Your membership expires in ${daysLeft} days ⏰`, html });
}
