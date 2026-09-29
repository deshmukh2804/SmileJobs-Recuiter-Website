const Razorpay = require("razorpay");
const crypto = require("crypto");
const ApiError = require("../../utils/apiError");

let razorpayInstance = null;

const getRazorpayInstance = () => {
  if (!razorpayInstance) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new ApiError(500, "Razorpay credentials not configured in environment variables.");
    }
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
};

class RazorpayService {
  /**
   * Creates a one-time Razorpay order for subscription payment
   */
  async createOrder(amount, currency, receipt, notes) {
    try {
      const razorpay = getRazorpayInstance();
      const order = await razorpay.orders.create({
        amount: Math.round(amount * 100), // Convert to paise
        currency: currency || "INR",
        receipt: receipt,
        notes: notes || {},
      });
      console.log(`✅ Razorpay Order Created: ${order.id} (${currency} ${amount})`);
      return order;
    } catch (err) {
      console.error("❌ Razorpay Order Error:", err.message);
      throw new ApiError(500, `Payment order creation failed: ${err.message}`);
    }
  }

  /**
   * Verifies Razorpay payment signature after checkout
   */
  verifyPaymentSignature(orderId, paymentId, signature) {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      throw new ApiError(500, "Razorpay secret not configured");
    }
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");
    return expectedSignature === signature;
  }

  /**
   * Verifies webhook signature from raw request body
   */
  verifyWebhookSignature(rawBody, signature, secret) {
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(rawBody);
    return hmac.digest("hex") === signature;
  }
}

module.exports = new RazorpayService();