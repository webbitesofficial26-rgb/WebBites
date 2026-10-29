import mongoose from "mongoose";

const restaurantOfferSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
  offerTemplateId: { type: mongoose.Schema.Types.ObjectId, ref: "OfferTemplate", required: true, index: true },
  isActive: { type: Boolean, default: true },
  activatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

restaurantOfferSchema.index({ restaurantId: 1, offerTemplateId: 1 }, { unique: true });
export default mongoose.model("RestaurantOffer", restaurantOfferSchema);
