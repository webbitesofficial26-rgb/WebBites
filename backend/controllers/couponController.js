
import couponModel from "../models/couponModel.js";

export const validateCoupon = async (req, res) => {
    try {
        const { code, orderAmount } = req.body;

        if (
            typeof code !== "string" ||
            !code.trim() ||
            !Number.isFinite(orderAmount) ||
            orderAmount <= 0
        ) {
            return res.status(400).json({
                status: 0,
                message: "Please provide a valid coupon code and order amount",
            });
        }

        const coupon = await couponModel.findOne({
            code: code.trim().toUpperCase(),
        });

        if (!coupon || !coupon.isActive) {
            return res.status(404).json({
                status: 0,
                message: "Invalid coupon code",
            });
        }

        if (coupon.expiryDate <= new Date()) {
            return res.status(400).json({
                status: 0,
                message: "This coupon has expired",
            });
        }

        if (
            coupon.usageLimit !== null &&
            coupon.usedCount >= coupon.usageLimit
        ) {
            return res.status(400).json({
                status: 0,
                message: "This coupon has reached its usage limit",
            });
        }

        if (orderAmount < coupon.minOrderAmount) {
            return res.status(400).json({
                status: 0,
                message: `Minimum order amount is ₹${coupon.minOrderAmount}`,
            });
        }

        let discount = 0;

        if (coupon.discountType === "percentage") {
            discount = (orderAmount * coupon.discountValue) / 100;

            if (coupon.maxDiscount !== null) {
                discount = Math.min(discount, coupon.maxDiscount);
            }
        } else {
            discount = coupon.discountValue;
        }

        // A coupon cannot discount more than the order amount.
        discount = Math.min(
            Math.round(discount * 100) / 100,
            orderAmount
        );

        return res.status(200).json({
            status: 1,
            message: "Coupon applied successfully",
            data: {
                code: coupon.code,
                discount,
                finalAmount: Math.round((orderAmount - discount) * 100) / 100,
            },
        });
    } catch (error) {
        console.error("Coupon validation error:", error.message);

        return res.status(500).json({
            status: 0,
            message: "Unable to validate coupon",
        });
    }
};



export const createCoupon = async (req, res) => {
    try {
        let {
            code,
            description,
            discountType,
            discountValue,
            minOrderAmount,
            maxDiscount,
            expiryDate,
            usageLimit,
        } = req.body;

        if (
            typeof code !== "string" ||
            !/^[A-Z0-9_-]{3,30}$/i.test(code.trim()) ||
            !["percentage", "fixed"].includes(discountType) ||
            !Number.isFinite(discountValue) ||
            discountValue <= 0 ||
            !expiryDate
        ) {
            return res.status(400).json({
                status: 0,
                message: "Please provide valid coupon details",
            });
        }

        if (
            discountType === "percentage" &&
            discountValue > 100
        ) {
            return res.status(400).json({
                status: 0,
                message: "Percentage discount cannot exceed 100%",
            });
        }

        minOrderAmount = minOrderAmount ?? 0;
        maxDiscount = maxDiscount ?? null;
        usageLimit = usageLimit ?? null;

        if (
            !Number.isFinite(minOrderAmount) ||
            minOrderAmount < 0 ||
            (maxDiscount !== null &&
                (!Number.isFinite(maxDiscount) || maxDiscount < 0)) ||
            (usageLimit !== null &&
                (!Number.isSafeInteger(usageLimit) || usageLimit < 1))
        ) {
            return res.status(400).json({
                status: 0,
                message: "Invalid minimum amount, maximum discount, or usage limit",
            });
        }

        const parsedExpiryDate = new Date(expiryDate);

        if (
            Number.isNaN(parsedExpiryDate.getTime()) ||
            parsedExpiryDate <= new Date()
        ) {
            return res.status(400).json({
                status: 0,
                message: "Expiry date must be in the future",
            });
        }

        const normalizedCode = code.trim().toUpperCase();

        const existingCoupon = await couponModel.findOne({
            code: normalizedCode,
        });

        if (existingCoupon) {
            return res.status(409).json({
                status: 0,
                message: "This coupon code already exists",
            });
        }

        const coupon = await couponModel.create({
            code: normalizedCode,
            description,
            discountType,
            discountValue,
            minOrderAmount,
            maxDiscount,
            expiryDate: parsedExpiryDate,
            usageLimit,
        });

        return res.status(201).json({
            status: 1,
            message: "Coupon created successfully",
            data: coupon,
        });
    } catch (error) {
        console.error("Create coupon error:", error.message);

        return res.status(500).json({
            status: 0,
            message: "Unable to create coupon",
        });
    }
};



export const getAllCoupons = async (req, res) => {
    try {
        const coupons = await couponModel.find().sort({ createdAt: -1 });

        return res.status(200).json({
            status: 1,
            message: "Coupons fetched successfully",
            data: coupons,
        });
    } catch (error) {
        console.error("Get coupons error:", error.message);

        return res.status(500).json({
            status: 0,
            message: "Unable to fetch coupons",
        });
    }
};



export const toggleCouponStatus = async (req, res) => {
    try {
        const { couponId } = req.params;

        const coupon = await couponModel.findById(couponId);

        if (!coupon) {
            return res.status(404).json({
                status: 0,
                message: "Coupon not found",
            });
        }

        coupon.isActive = !coupon.isActive;
        await coupon.save();

        return res.status(200).json({
            status: 1,
            message: `Coupon ${coupon.isActive ? "activated" : "deactivated"} successfully`,
            data: coupon,
        });
    } catch (error) {
        console.error("Toggle coupon status error:", error.message);

        return res.status(500).json({
            status: 0,
            message: "Unable to update coupon status",
        });
    }
};



// Customer: return coupons that are currently available to use.
export const getAvailableCoupons = async (req, res) => {
    try {
        const now = new Date();
        const coupons = await couponModel.find({
            isActive: true,
            expiryDate: { $gt: now },
            $or: [
                { usageLimit: null },
                { $expr: { $lt: ["$usedCount", "$usageLimit"] } },
            ],
        })
            .select("code description discountType discountValue minOrderAmount maxDiscount expiryDate")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            status: 1,
            message: "Available coupons fetched successfully",
            data: coupons,
        });
    } catch (error) {
        console.error("Get available coupons error:", error.message);
        return res.status(500).json({
            status: 0,
            message: "Unable to load available offers",
        });
    }
};
