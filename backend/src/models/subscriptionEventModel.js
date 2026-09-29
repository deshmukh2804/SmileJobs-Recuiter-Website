const mongoose = require("mongoose");

const subscriptionEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    eventType: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    processed: { type: Boolean, default: false },
    processedAt: { type: Date },
  },
  { timestamps: true, collection: "subscription_events" }
);

module.exports = mongoose.model("SubscriptionEvent", subscriptionEventSchema);