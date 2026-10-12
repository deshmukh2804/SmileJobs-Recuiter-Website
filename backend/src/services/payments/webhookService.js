const crypto = require("crypto");
const profilePurchaseService = require("../profilePurchase/profilePurchaseService");

/**
 * WebhookService
 * Handles inbound Razorpay webhooks for both:
 * 1. Subscription / Plan payments
 * 2. Candidate Profile Unlock direct purchases
 */
class WebhookService {
  /**
   * Verify Razorpay HMAC-SHA256 Webhook Signature
   * @param {Buffer|string} rawBody - Raw unparsed request body buffer or string
   * @param {string} signature - Value from 'x-razorpay-signature' header
   * @param {string} [secret] - Webhook secret override
   * @returns {boolean}
   */
  verifySignature(rawBody, signature, secret) {
    try {
      const webhookSecret = secret || process.env.RAZORPAY_WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.warn(
          "[WebhookService] RAZORPAY_WEBHOOK_SECRET not configured in environment."
        );
        return false;
      }

      if (!signature) {
        console.warn("[WebhookService] Missing x-razorpay-signature header.");
        return false;
      }

      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      const signatureBuffer = Buffer.from(signature, "utf8");
      const expectedBuffer = Buffer.from(expectedSignature, "utf8");

      if (signatureBuffer.length !== expectedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
    } catch (err) {
      console.error("[WebhookService] Error verifying webhook signature:", err);
      return false;
    }
  }

  /**
   * Main router for processing incoming webhook events
   * @param {Object} eventPayload - Parsed JSON webhook payload
   * @param {Object} [options] - Additional metadata or raw body
   */
  async processEvent(eventPayload, options = {}) {
    if (!eventPayload || !eventPayload.event) {
      throw new Error("Invalid webhook payload: missing event type");
    }

    const eventName = eventPayload.event;
    console.log(`[WebhookService] Received webhook event: ${eventName}`);

    switch (eventName) {
      case "payment.captured":
        return await this._handlePaymentCaptured(eventPayload);

      case "payment.failed":
        return await this._handlePaymentFailed(eventPayload);

      case "order.paid":
        return await this._handleOrderPaid(eventPayload);

      case "subscription.charged":
      case "subscription.activated":
      case "subscription.halted":
      case "subscription.cancelled":
        return await this._handleSubscriptionEvent(eventPayload);

      default:
        console.log(
          `[WebhookService] Unhandled event "${eventName}" acknowledged.`
        );
        return { handled: false, event: eventName };
    }
  }

  /**
   * Handle 'payment.captured' events
   * Routes profile purchase orders to profilePurchaseService
   */
  async _handlePaymentCaptured(payload) {
    try {
      const payment = payload?.payload?.payment?.entity;
      const notes = payment?.notes || {};

      // ----------------------------------------------------------------------
      // ROUTING BLOCK: Profile Purchase Flow
      // ----------------------------------------------------------------------
      if (notes.purchaseType === "profile_purchase") {
        console.log(
          `[WebhookService] Routing payment.captured (${payment.id}) to ProfilePurchaseService`
        );

        const result = await profilePurchaseService.handleWebhookPaymentCaptured({
          paymentId: payment.id,
          orderId: payment.order_id,
          amountInPaise: payment.amount,
          currency: payment.currency,
          status: payment.status,
          notes: notes,
          rawPayload: payload
        });

        return {
          handled: true,
          type: "profile_purchase",
          paymentId: payment.id,
          result
        };
      }

      // ----------------------------------------------------------------------
      // DEFAULT: Subscription / Core platform payment handling
      // ----------------------------------------------------------------------
      console.log(
        `[WebhookService] Processing standard subscription payment.captured (${payment?.id})`
      );

      // Add existing subscription capture logic if present in your environment
      return {
        handled: true,
        type: "subscription_or_standard",
        paymentId: payment?.id
      };
    } catch (err) {
      console.error("[WebhookService] Error in _handlePaymentCaptured:", err);
      throw err;
    }
  }

  /**
   * Handle 'payment.failed' events
   */
  async _handlePaymentFailed(payload) {
    try {
      const payment = payload?.payload?.payment?.entity;
      const notes = payment?.notes || {};

      // ----------------------------------------------------------------------
      // ROUTING BLOCK: Profile Purchase Failure
      // ----------------------------------------------------------------------
      if (notes.purchaseType === "profile_purchase") {
        console.log(
          `[WebhookService] Routing payment.failed (${payment.id}) to ProfilePurchaseService`
        );

        const result = await profilePurchaseService.handleWebhookPaymentFailed({
          paymentId: payment.id,
          orderId: payment.order_id,
          failureReason:
            payment.error_description ||
            payment.error_reason ||
            "Payment failed",
          rawPayload: payload
        });

        return {
          handled: true,
          type: "profile_purchase_failed",
          paymentId: payment.id,
          result
        };
      }

      console.warn(
        `[WebhookService] Standard payment failed: ${payment?.id} (${payment?.error_description})`
      );

      return {
        handled: true,
        type: "standard_failed",
        paymentId: payment?.id
      };
    } catch (err) {
      console.error("[WebhookService] Error in _handlePaymentFailed:", err);
      throw err;
    }
  }

  /**
   * Handle 'order.paid' events
   */
  async _handleOrderPaid(payload) {
    const order = payload?.payload?.order?.entity;
    console.log(`[WebhookService] order.paid received for order: ${order?.id}`);
    return { handled: true, orderId: order?.id };
  }

  /**
   * Handle recurring subscription lifecycle events
   */
  async _handleSubscriptionEvent(payload) {
    const subscription = payload?.payload?.subscription?.entity;
    const event = payload?.event;
    console.log(
      `[WebhookService] Subscription event "${event}" received for: ${subscription?.id}`
    );
    return { handled: true, event, subscriptionId: subscription?.id };
  }
}

module.exports = new WebhookService();