
import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true,
        },

        description: {
            type: String,
            default: "",
        },

        discountType: {
            type: String,
            enum: ["percentage", "fixed"],
            required: true,
        },

        discountValue: {
            type: Number,
            required: true,
            min: 1,
        },

        minOrderAmount: {
            type: Number,
            default: 0,
            min: 0,
        },

        maxDiscount: {
            type: Number,
            default: null,
            min: 0,
        },

        expiryDate: {
            type: Date,
            required: true,
        },

        usageLimit: {
            type: Number,
            default: null,
            min: 1,
        },

        usedCount: {
            type: Number,
            default: 0,
            min: 0,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

const couponModel = mongoose.model("Coupon", couponSchema);

export default couponModel;

