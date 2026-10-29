import mongoose from "mongoose";

const offerTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  description: { type: String, default: "", trim: true, maxlength: 300 },
  discountType: { type: String, enum: ["percentage", "fixed", "free_delivery"], required: true },
  discountValue: { type: Number, default: 0, min: 0 },
  maxDiscount: { type: Number, default: null, min: 0 },
  minOrderAmount: { type: Number, default: 0, min: 0 },
  startDate: { type: Date, default: Date.now },
  expiryDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

offerTemplateSchema.index({ isActive: 1, startDate: 1, expiryDate: 1 });
export default mongoose.model("OfferTemplate", offerTemplateSchema);
