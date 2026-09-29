const express = require("express");
const router = express.Router();
const razorpayService = require("../services/payments/razorpayService");
const webhookService = require("../services/payments/webhookService");

// ═══ IMPORTANT: This route uses express.raw() for signature verification ═══
// The raw body is needed to verify Razorpay's HMAC signature
router.post(
  "/razorpay/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const signature = req.headers["x-razorpay-signature"];
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

      // Validate presence of required headers
      if (!signature) {
        console.error("❌ Webhook: Missing x-razorpay-signature header");
        return res.status(400).json({ error: "Missing signature" });
      }

      if (!secret) {
        console.error("❌ Webhook: RAZORPAY_WEBHOOK_SECRET not set in .env");
        // Still return 200 to prevent Razorpay from retrying endlessly
        return res.status(200).json({ error: "Webhook secret not configured" });
      }

      // Verify signature
      const rawBody =
        typeof req.body === "string"
          ? req.body
          : Buffer.isBuffer(req.body)
            ? req.body
            : JSON.stringify(req.body);

      const verified = razorpayService.verifyWebhookSignature(
        rawBody,
        signature,
        secret
      );

      if (!verified) {
        console.error("❌ Webhook: Signature verification failed");
        return res.status(400).json({ error: "Invalid signature" });
      }

      // Parse body
      let parsedBody;
      try {
        parsedBody =
          typeof req.body === "string"
            ? JSON.parse(req.body)
            : Buffer.isBuffer(req.body)
              ? JSON.parse(req.body.toString("utf8"))
              : req.body;
      } catch (parseErr) {
        console.error("❌ Webhook: Failed to parse body:", parseErr.message);
        return res.status(400).json({ error: "Invalid JSON body" });
      }

      const eventId = parsedBody.id || `evt_${Date.now()}`;
      const eventType = parsedBody.event;

      console.log(`📡 Webhook received: ${eventType} [${eventId}]`);

      // Process asynchronously - respond immediately to Razorpay
      await webhookService.processEvent(eventId, eventType, parsedBody.payload);

      return res.status(200).json({ status: "ok" });
    } catch (err) {
      console.error("❌ Webhook processing error:", err.message);
      // Always return 200 to prevent Razorpay from retrying on server errors
      return res.status(200).json({ status: "error_logged" });
    }
  }
);

module.exports = router;