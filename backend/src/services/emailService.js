const axios = require("axios");
const nodemailer = require("nodemailer");
const ApiError = require("../utils/apiError");

// ═══════════════════════════════════════════════════════
// UNIVERSAL EMAIL DELIVERY ENGINE
// Auto-detects: Brevo REST API → Brevo SMTP → Gmail SMTP
// ═══════════════════════════════════════════════════════

let smtpTransporter = null;

const getSmtpTransporter = () => {
  if (!smtpTransporter) {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || "587", 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      throw new ApiError(500, "SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS.");
    }

    smtpTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
      tls: {
        rejectUnauthorized: false,
      },
    });
  }
  return smtpTransporter;
};

class EmailService {
  async sendOtpEmail({ to, otp, userName, purpose = "login" }) {
    const appName = process.env.APP_NAME || "Smile Jobs";
    const senderEmail = process.env.EMAIL_FROM || "info.smilejobs@gmail.com";
    const senderName = process.env.EMAIL_FROM_NAME || appName;
    const replyToEmail = process.env.EMAIL_REPLY_TO || senderEmail;

    const brevoApiKey = (process.env.BREVO_API_KEY || "").trim();
    const smtpPass = (process.env.SMTP_PASS || "").trim();

    const purposeText =
      purpose === "login"
        ? "log in to your account"
        : purpose === "signup"
        ? "create your account"
        : "verify your email address";

    const htmlContent = this._buildOtpHtml({
      otp,
      userName: userName || to.split("@")[0],
      appName,
      purposeText,
    });

    const textContent = `${otp} is your ${appName} verification code. This code is valid for 5 minutes. Do not share it with anyone.`;

    // ═══ METHOD 1: BREVO REST API (only if valid xkeysib- key exists) ═══
    if (brevoApiKey && brevoApiKey.startsWith("xkeysib-")) {
      try {
        console.log(`📡 [Brevo REST API] Dispatching to: ${to} from: ${senderEmail}...`);

        const response = await axios.post(
          "https://api.brevo.com/v3/smtp/email",
          {
            sender: { name: senderName, email: senderEmail },
            to: [{ email: to.trim().toLowerCase(), name: userName || to.split("@")[0] }],
            replyTo: { email: replyToEmail, name: senderName },
            subject: `${otp} is your ${appName} verification code`,
            htmlContent,
            textContent,
            tags: ["otp-verification"],
          },
          {
            headers: {
              accept: "application/json",
              "api-key": brevoApiKey,
              "content-type": "application/json",
            },
            timeout: 12000,
          }
        );

        console.log(`✅ [Brevo API Delivered] Message ID: ${response.data?.messageId}`);
        return { success: true, messageId: response.data?.messageId };
      } catch (apiErr) {
        const errDetails = apiErr.response?.data;
        console.error("❌ [Brevo API Error]:", {
          status: apiErr.response?.status,
          message: errDetails?.message || apiErr.message,
        });
        // Fall through to SMTP
      }
    }

    // ═══ METHOD 2: SMTP FALLBACK (Gmail/Brevo SMTP/any provider) ═══
    try {
      console.log(`📡 [SMTP Relay] Dispatching to: ${to} from: ${senderEmail} via ${process.env.SMTP_HOST}...`);
      const transporter = getSmtpTransporter();

      const info = await transporter.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to: to.trim().toLowerCase(),
        replyTo: replyToEmail,
        subject: `${otp} is your ${appName} verification code`,
        text: textContent,
        html: htmlContent,
        headers: {
          "X-Priority": "1",
          Importance: "high",
        },
      });

      console.log(`✅ [SMTP Delivered] Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (smtpErr) {
      console.error("❌ [SMTP Delivery Error]:", smtpErr.message);

      // ═══ FINAL FALLBACK: Log OTP to console so developer/user can see it ═══
      console.log("\n═══════════════════════════════════════════");
      console.log(`⚠️  EMAIL DELIVERY FAILED - OTP LOG FALLBACK`);
      console.log(`📧 Email: ${to}`);
      console.log(`🔐 OTP: ${otp}`);
      console.log(`⏰ Valid for 5 minutes`);
      console.log("═══════════════════════════════════════════\n");

      throw new ApiError(
        500,
        `Email delivery failed: ${smtpErr.message}. Please check server logs for OTP or contact support.`
      );
    }
  }

  async sendWelcomeEmail({ to, userName }) {
    const appName = process.env.APP_NAME || "Smile Jobs";
    const senderEmail = process.env.EMAIL_FROM || "info.smilejobs@gmail.com";
    const senderName = process.env.EMAIL_FROM_NAME || appName;
    const frontendUrl = process.env.FRONTEND_URL || "https://smile-jobs-recuiter-website.vercel.app";
    const brevoApiKey = (process.env.BREVO_API_KEY || "").trim();

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color:#f4f1fa; padding:20px;">
        <table width="100%" style="max-width:600px; background:#fff; border-radius:12px; padding:30px; margin:0 auto; box-shadow:0 4px 20px rgba(0,0,0,0.05);">
          <tr>
            <td style="text-align:center;">
              <h1 style="color:#2C1B57; margin-bottom:10px;">Welcome to ${appName}! 🎉</h1>
              <p style="color:#49454F; font-size:15px; line-height:1.6;">
                Hello <strong>${userName || "Recruiter"}</strong>, your recruiter account is now active.
              </p>
              <div style="margin:25px 0;">
                <a href="${frontendUrl}" style="background:#42326E; color:#fff; padding:12px 28px; text-decoration:none; font-weight:bold; border-radius:8px; display:inline-block;">
                  Go to Dashboard →
                </a>
              </div>
              <p style="color:#6F687A; font-size:12px; margin-top:20px;">
                © ${new Date().getFullYear()} ${appName}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    try {
      if (brevoApiKey && brevoApiKey.startsWith("xkeysib-")) {
        await axios.post(
          "https://api.brevo.com/v3/smtp/email",
          {
            sender: { name: senderName, email: senderEmail },
            to: [{ email: to.trim().toLowerCase(), name: userName || to.split("@")[0] }],
            subject: `Welcome to ${appName}! 🎉`,
            htmlContent: html,
          },
          {
            headers: {
              accept: "application/json",
              "api-key": brevoApiKey,
              "content-type": "application/json",
            },
            timeout: 8000,
          }
        );
        return { success: true };
      }

      // Fallback to SMTP
      const transporter = getSmtpTransporter();
      await transporter.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to: to.trim().toLowerCase(),
        subject: `Welcome to ${appName}! 🎉`,
        html,
      });
      return { success: true };
    } catch (e) {
      console.warn("⚠️ Welcome email skipped:", e.message);
      return { success: false };
    }
  }

  _buildOtpHtml({ otp, userName, appName, purposeText }) {
    const frontendUrl = process.env.FRONTEND_URL || "https://smile-jobs-recuiter-website.vercel.app";

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${otp} is your ${appName} verification code</title>
      </head>
      <body style="margin:0; padding:0; background-color:#f4f1fa; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f1fa; padding:30px 15px;">
          <tr>
            <td align="center">
              <table width="100%" style="max-width:560px; background-color:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 8px 30px rgba(44,27,87,0.08);">
                <tr>
                  <td style="background:linear-gradient(135deg, #2C1B57 0%, #42326E 100%); padding:32px 24px; text-align:center;">
                    <div style="display:inline-block; width:48px; height:48px; background:rgba(255,255,255,0.15); border-radius:12px; line-height:48px; font-size:22px; margin-bottom:10px;">
                      🔐
                    </div>
                    <h1 style="color:#ffffff; margin:0; font-size:22px; font-weight:800; letter-spacing:-0.5px;">
                      ${appName}
                    </h1>
                    <p style="color:rgba(255,255,255,0.75); margin:6px 0 0; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:1px;">
                      Recruiter Verification
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:32px 28px;">
                    <p style="color:#29233A; font-size:15px; font-weight:600; margin:0 0 8px;">
                      Hello ${userName},
                    </p>
                    <p style="color:#49454F; font-size:14px; line-height:1.6; margin:0 0 24px;">
                      Please use the verification code below to ${purposeText}. This code is valid for <strong>5 minutes</strong>.
                    </p>

                    <div style="background:#F7F4FA; border:2px dashed #B29CFE; border-radius:16px; padding:20px; text-align:center; margin:0 0 24px;">
                      <span style="display:block; color:#6F687A; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:2px; margin-bottom:6px;">
                        One-Time Passcode
                      </span>
                      <span style="display:inline-block; color:#2C1B57; font-size:38px; font-weight:900; letter-spacing:8px; font-family:'Courier New', monospace;">
                        ${otp}
                      </span>
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
                    <p style="color:#6F687A; font-size:11px; margin:0;">
                      © ${new Date().getFullYear()} ${appName}. Protected by SSL Encryption.
                    </p>
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