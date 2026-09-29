const nodemailer = require("nodemailer");
const ApiError = require("../utils/apiError");

// ═══════════════════════════════════════════════════════
// PRODUCTION-GRADE EMAIL ENGINE
// Based on admin panel mailer.js pattern
// Auto-detects Render hosting and switches to Port 2525
// ═══════════════════════════════════════════════════════

const FROM_NAME = process.env.EMAIL_FROM_NAME || "Smile Jobs";
const FROM_EMAIL = process.env.EMAIL_FROM || "info.smilejobs@gmail.com";
const REPLY_TO = process.env.EMAIL_REPLY_TO || FROM_EMAIL;
const APP_NAME = process.env.APP_NAME || "Smile Jobs";
const FRONTEND_URL = process.env.FRONTEND_URL || "https://smile-jobs-recuiter-website.vercel.app";

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || "smtp-relay.brevo.com";
  let port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new ApiError(500, "SMTP credentials missing. Set SMTP_USER and SMTP_PASS.");
  }

  // ✅ CRITICAL: Auto-switch to Port 2525 on Render/Production
  // Port 587 is BLOCKED on Render. Port 2525 is OPEN and supported by Brevo.
  if (port === 587 && (process.env.RENDER || process.env.NODE_ENV === "production")) {
    console.log("ℹ️ Render/Production detected: Auto-switching SMTP Port 587 → 2525");
    port = 2525;
  }

  console.log(`📡 SMTP Config: Host=${host}, Port=${port}, User=${user}`);

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  });

  return transporter;
};

/**
 * Validate email is real and deliverable
 */
const isValidEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  const clean = email.trim().toLowerCase();
  if (clean.endsWith("@phone.verihire.local") || clean.includes("test.local")) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean);
};

class EmailService {
  /**
   * Send OTP verification email
   */
  async sendOtpEmail({ to, otp, userName, purpose = "login" }) {
    if (!isValidEmail(to)) {
      console.log(`⏩ Skipped invalid email: ${to}`);
      throw new ApiError(400, "Invalid email address");
    }

    const purposeText =
      purpose === "login"
        ? "log in to your account"
        : purpose === "signup"
        ? "create your account"
        : "verify your email address";

    const html = this._buildOtpHtml({
      otp,
      userName: userName || to.split("@")[0],
      purposeText,
    });

    const text = `${otp} is your ${APP_NAME} verification code. Valid for 5 minutes.`;

    try {
      console.log(`📡 [SMTP Relay] Dispatching OTP to: ${to} from: ${FROM_EMAIL}...`);
      const transport = getTransporter();

      const info = await transport.sendMail({
        from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
        to: to.trim().toLowerCase(),
        replyTo: REPLY_TO,
        subject: `${otp} is your ${APP_NAME} verification code`,
        text,
        html,
        headers: {
          "X-Priority": "1",
          Importance: "high",
        },
      });

      console.log(`✅ [SMTP Delivered] Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("❌ [SMTP Delivery Error]:", error.message);

      // Log OTP to console as fallback so user is never blocked
      console.log("\n═══════════════════════════════════════════");
      console.log(`⚠️  EMAIL FAILED - OTP FALLBACK`);
      console.log(`📧 To: ${to}`);
      console.log(`🔐 OTP: ${otp}`);
      console.log(`⏰ Valid: 5 minutes`);
      console.log("═══════════════════════════════════════════\n");

      throw new ApiError(500, `Email delivery failed: ${error.message}`);
    }
  }

  /**
   * Welcome email for new recruiters
   */
  async sendWelcomeEmail({ to, userName }) {
    if (!isValidEmail(to)) return { success: false };

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color:#f4f1fa; padding:20px;">
        <table width="100%" style="max-width:600px; background:#fff; border-radius:12px; padding:30px; margin:0 auto; box-shadow:0 4px 20px rgba(0,0,0,0.05);">
          <tr>
            <td style="text-align:center;">
              <h1 style="color:#2C1B57; margin-bottom:10px;">Welcome to ${APP_NAME}! 🎉</h1>
              <p style="color:#49454F; font-size:15px; line-height:1.6;">
                Hello <strong>${userName || "Recruiter"}</strong>, your recruiter account is now active.
              </p>
              <div style="margin:25px 0;">
                <a href="${FRONTEND_URL}" style="background:#42326E; color:#fff; padding:12px 28px; text-decoration:none; font-weight:bold; border-radius:8px; display:inline-block;">
                  Go to Dashboard →
                </a>
              </div>
              <p style="color:#6F687A; font-size:12px; margin-top:20px;">
                © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    try {
      const transport = getTransporter();
      await transport.sendMail({
        from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
        to: to.trim().toLowerCase(),
        subject: `Welcome to ${APP_NAME}! 🎉`,
        html,
      });
      return { success: true };
    } catch (e) {
      console.warn("⚠️ Welcome email skipped:", e.message);
      return { success: false };
    }
  }

  _buildOtpHtml({ otp, userName, purposeText }) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${otp} is your ${APP_NAME} verification code</title>
      </head>
      <body style="margin:0; padding:0; background-color:#f4f1fa; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f1fa; padding:30px 15px;">
          <tr>
            <td align="center">
              <table width="100%" style="max-width:560px; background-color:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 8px 30px rgba(44,27,87,0.08);">
                <tr>
                  <td style="background:linear-gradient(135deg, #2C1B57 0%, #42326E 100%); padding:32px 24px; text-align:center;">
                    <div style="display:inline-block; width:48px; height:48px; background:rgba(255,255,255,0.15); border-radius:12px; line-height:48px; font-size:22px; margin-bottom:10px;">🔐</div>
                    <h1 style="color:#ffffff; margin:0; font-size:22px; font-weight:800; letter-spacing:-0.5px;">${APP_NAME}</h1>
                    <p style="color:rgba(255,255,255,0.75); margin:6px 0 0; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:1px;">Recruiter Verification</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px 28px;">
                    <p style="color:#29233A; font-size:15px; font-weight:600; margin:0 0 8px;">Hello ${userName},</p>
                    <p style="color:#49454F; font-size:14px; line-height:1.6; margin:0 0 24px;">
                      Please use the verification code below to ${purposeText}. This code is valid for <strong>5 minutes</strong>.
                    </p>
                    <div style="background:#F7F4FA; border:2px dashed #B29CFE; border-radius:16px; padding:20px; text-align:center; margin:0 0 24px;">
                      <span style="display:block; color:#6F687A; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:2px; margin-bottom:6px;">One-Time Passcode</span>
                      <span style="display:inline-block; color:#2C1B57; font-size:38px; font-weight:900; letter-spacing:8px; font-family:'Courier New', monospace;">${otp}</span>
                    </div>
                    <div style="background:#FFF9F2; border-left:4px solid #C58A3A; padding:12px 16px; border-radius:8px; margin:0 0 20px;">
                      <p style="color:#8A5314; font-size:12px; line-height:1.5; margin:0;">
                        <strong>Security Tip:</strong> Never share your verification code with anyone.
                      </p>
                    </div>
                    <p style="color:#9C94A7; font-size:11px; line-height:1.5; margin:0;">
                      If you did not request this login code, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#FAF8FC; padding:18px 24px; text-align:center; border-top:1px solid #EFEAF6;">
                    <p style="color:#6F687A; font-size:11px; margin:0;">© ${new Date().getFullYear()} ${APP_NAME}. Protected by SSL Encryption.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();