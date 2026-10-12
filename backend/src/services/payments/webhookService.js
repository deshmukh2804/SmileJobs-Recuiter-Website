const crypto = require('crypto');

// ✅ FIX: subscriptionService lives in ../subscription/, NOT in ./ (same folder)
let subscriptionService = null;
try {
  subscriptionService = require('../subscription/subscriptionService');
} catch (e1) {
  try {
    subscriptionService = require('../subscriptionService');
  } catch (e2) {
    console.warn('[WebhookService] subscriptionService not found — subscription webhooks will be skipped');
  }
}

// Profile Purchase service for credit-based unlocks
let profilePurchaseService = null;
try {
  profilePurchaseService = require('../profilePurchase/profilePurchaseService');
} catch (e) {
  console.warn('[WebhookService] profilePurchaseService not found — profile purchase webhooks will be skipped');
}

class WebhookService {
  // ─── Signature Verification ───
  verifyWebhookSignature(rawBody, signature) {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('Razorpay webhook secret not configured in environment');
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    return expectedSignature === signature;
  }

  // ─── Method 1: Called by paymentWebhookRoutes.js (your existing route) ───
  // Signature: processEvent(eventId, eventType, payload)
  async processEvent(eventId, eventType, payload) {
    console.log(`[RazorpayWebhook] processEvent → ${eventType} [${eventId}]`);

    try {
      switch (eventType) {
        case 'payment.captured':
          return await this._handlePaymentCaptured({ payload });
        case 'payment.failed':
          return await this._handlePaymentFailed({ payload });
        case 'order.paid':
          return await this._handleOrderPaid({ payload });
        case 'subscription.activated':
        case 'subscription.charged':
          return await this._handleSubscriptionEvent(eventType, payload);
        default:
          console.log(`[RazorpayWebhook] Unhandled event type: ${eventType}`);
          return { handled: false, reason: 'Event type not tracked' };
      }
    } catch (err) {
      console.error(`[RazorpayWebhook] Error processing ${eventType}:`, err.message);
      throw err;
    }
  }

  // ─── Method 2: Full raw-body verification (alternative entry point) ───
  // Signature: processWebhookEvent(rawBody, signature)
  async processWebhookEvent(rawBody, signature) {
    const isValid = this.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      throw new Error('Invalid Razorpay webhook signature');
    }

    const event = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    const eventType = event.event;
    const eventId = event.id || `evt_${Date.now()}`;

    console.log(`[RazorpayWebhook] processWebhookEvent → ${eventType} [${eventId}]`);

    return await this.processEvent(eventId, eventType, event.payload);
  }

  // ─── Internal Handlers ───

  async _handlePaymentCaptured(event) {
    const payment = event.payload?.payment?.entity;
    if (!payment) return { handled: false, reason: 'No payment entity in payload' };

    const notes = payment.notes || {};
    const purchaseType = notes.purchaseType;

    // 1. Profile Purchase Credits Handler
    if (
      profilePurchaseService &&
      (purchaseType === 'profile_purchase_credits' || purchaseType === 'profile_purchase')
    ) {
      const razorpayOrderId = payment.order_id;
      const razorpayPaymentId = payment.id;
      const result = await profilePurchaseService.handleWebhookPaymentCaptured({
        razorpayOrderId,
        razorpayPaymentId,
        rawPayload: event,
      });
      return { handled: true, type: 'profile_purchase', result };
    }

    // 2. Recruiter Subscription Plan Handler
    if (subscriptionService && payment.order_id) {
      try {
        if (typeof subscriptionService.handleWebhookPaymentSuccess === 'function') {
          const subResult = await subscriptionService.handleWebhookPaymentSuccess({
            razorpayOrderId: payment.order_id,
            razorpayPaymentId: payment.id,
            rawPayload: event,
          });
          return { handled: true, type: 'subscription', result: subResult };
        }
      } catch (subErr) {
        console.warn(`[RazorpayWebhook] Subscription handler warning: ${subErr.message}`);
      }
    }

    return { handled: true, type: 'generic_payment', paymentId: payment.id };
  }

  async _handlePaymentFailed(event) {
    const payment = event.payload?.payment?.entity;
    if (!payment) return { handled: false };

    const razorpayOrderId = payment.order_id;
    const failureReason = payment.error_description || payment.error_reason || 'Payment failed';

    if (profilePurchaseService && razorpayOrderId) {
      try {
        await profilePurchaseService.handleWebhookPaymentFailed({
          razorpayOrderId,
          failureReason,
          rawPayload: event,
        });
      } catch (err) {
        console.warn(`[RazorpayWebhook] Profile purchase failure handler warning: ${err.message}`);
      }
    }

    return { handled: true, type: 'payment_failed', paymentId: payment.id };
  }

  async _handleOrderPaid(event) {
    const order = event.payload?.order?.entity;
    if (!order) return { handled: false };
    return { handled: true, type: 'order_paid', orderId: order.id };
  }

  async _handleSubscriptionEvent(eventType, payload) {
    if (!subscriptionService) {
      return { handled: false, reason: 'subscriptionService not available' };
    }

    try {
      if (typeof subscriptionService.handleWebhookSubscriptionEvent === 'function') {
        const result = await subscriptionService.handleWebhookSubscriptionEvent(eventType, payload);
        return { handled: true, type: 'subscription', result };
      }
    } catch (err) {
      console.warn(`[RazorpayWebhook] Subscription event handler warning: ${err.message}`);
    }

    return { handled: false, reason: 'No handler for subscription event' };
  }
}

module.exports = new WebhookService();