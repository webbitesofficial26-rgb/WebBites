
import express from "express";
import {
    validateCoupon,
    getAvailableCoupons,
    createCoupon,
    getAllCoupons,
    toggleCouponStatus,
} from "../controllers/couponController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

// Customer: list currently usable coupons for the Offers page
router.get("/api/coupons/available", getAvailableCoupons);

// Customer: Validate a coupon
router.post(
    "/api/coupons/validate",
    authMiddleware,
    roleMiddleware("customer"),
    validateCoupon
);

// Admin: Create a coupon
router.post(
    "/api/admin/coupons",
    authMiddleware,
    roleMiddleware("admin"),
    createCoupon
);

// Admin: Get all coupons
router.get(
    "/api/admin/coupons",
    authMiddleware,
    roleMiddleware("admin"),
    getAllCoupons
);

// Admin: Activate or deactivate a coupon
router.patch(
    "/api/admin/coupons/:couponId/toggle",
    authMiddleware,
    roleMiddleware("admin"),
    toggleCouponStatus
);

export default router;

