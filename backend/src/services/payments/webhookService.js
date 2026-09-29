const SubscriptionEvent = require("../../models/subscriptionEventModel");
const RecruiterSubscription = require("../../models/recruiterSubscriptionModel");
const PaymentTransaction = require("../../models/paymentTransactionModel");
const usageService = require("../subscription/usageService");

class WebhookService {
  async processEvent(eventId, eventType, payload) {
    // Idempotency: skip if already processed
    const existing = await SubscriptionEvent.findOne({ eventId });
    if (existing && existing.processed) {
      console.log(`ℹ️ Webhook ${eventId} already processed. Skipping.`);
      return { success: true, cached: true };
    }

    const eventDoc = await SubscriptionEvent.findOneAndUpdate(
      { eventId },
      { eventType, payload, processed: false },
      { upsert: true, new: true }
    );

    console.log(`📡 Processing webhook: ${eventType} [${eventId}]`);

    try {
      switch (eventType) {
        case "payment.captured":
          await this._handlePaymentCaptured(payload);
          break;
        case "payment.failed":
          await this._handlePaymentFailed(payload);
          break;
        case "subscription.activated":
        case "subscription.charged":
          await this._handleSubscriptionActivated(payload);
          break;
        case "subscription.halted":
        case "subscription.pending":
          await this._handleSubscriptionHalted(payload, eventType);
          break;
        case "subscription.cancelled":
          await this._handleSubscriptionCancelled(payload);
          break;
        default:
          console.log(`ℹ️ Unhandled event type: ${eventType}`);
      }

      eventDoc.processed = true;
      eventDoc.processedAt = new Date();
      await eventDoc.save();

      return { success: true };
    } catch (err) {
      console.error(`❌ Webhook processing error [${eventId}]:`, err.message);
      throw err;
    }
  }

  async _handlePaymentCaptured(payload) {
    const data = payload.payment?.entity;
    if (!data) return;

    const paymentTxn = await PaymentTransaction.findOne({
      razorpayOrderId: data.order_id,
    });

    if (paymentTxn && paymentTxn.status !== "captured") {
      paymentTxn.razorpayPaymentId = data.id;
      paymentTxn.status = "captured";
      paymentTxn.paidAt = new Date();
      paymentTxn.rawWebhookPayload = data;
      await paymentTxn.save();

      if (paymentTxn.subscriptionId) {
        const sub = await RecruiterSubscription.findById(paymentTxn.subscriptionId);
        if (sub && sub.status !== "active") {
          sub.status = "active";
          sub.paymentStatus = "paid";
          sub.lastPaymentId = data.id;
          sub.activatedAt = new Date();
          await sub.save();
          await usageService.syncUsageMetadata(sub.recruiterId);
        }
      }
    }
  }

  async _handlePaymentFailed(payload) {
    const data = payload.payment?.entity;
    if (!data) return;

    const paymentTxn = await PaymentTransaction.findOne({
      razorpayOrderId: data.order_id,
    });

    if (paymentTxn) {
      paymentTxn.status = "failed";
      paymentTxn.failureReason = data.error_description || "Payment declined";
      paymentTxn.rawWebhookPayload = data;
      await paymentTxn.save();

      if (paymentTxn.subscriptionId) {
        await RecruiterSubscription.findByIdAndUpdate(
          paymentTxn.subscriptionId,
          { status: "payment_failed", paymentStatus: "failed" }
        );
      }
    }
  }

  async _handleSubscriptionActivated(payload) {
    const data = payload.subscription?.entity;
    if (!data) return;
    const sub = await RecruiterSubscription.findOne({ razorpaySubscriptionId: data.id });
    if (sub) {
      sub.status = "active";
      sub.paymentStatus = "paid";
      sub.activatedAt = new Date();
      await sub.save();
      await usageService.syncUsageMetadata(sub.recruiterId);
    }
  }

  async _handleSubscriptionHalted(payload, eventType) {
    const data = payload.subscription?.entity;
    if (!data) return;
    const sub = await RecruiterSubscription.findOne({ razorpaySubscriptionId: data.id });
    if (sub) {
      sub.status = eventType === "subscription.halted" ? "halted" : "pending";
      await sub.save();
    }
  }

  async _handleSubscriptionCancelled(payload) {
    const data = payload.subscription?.entity;
    if (!data) return;
    const sub = await RecruiterSubscription.findOne({ razorpaySubscriptionId: data.id });
    if (sub) {
      sub.status = "cancelled";
      sub.cancelledAt = new Date();
      await sub.save();
    }
  }
}

module.exports = new WebhookService();