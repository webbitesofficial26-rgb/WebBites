import express from "express";

import {
    createOrder, getRestaurantOrders, updateOrderStatus, getDeliveryOrders, getCustomerOrders, cancelCustomerOrder,
    adminDeleteOrder, adminUpdateOrderStatus, createRazorpayOrder, verifyRazorpayPayment, requestOrderReturn,
    reviewOrderReturn, getReturnRequests, processOrderRefund
} from "../controllers/orderController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";



const router = express.Router();

router.post(
    "/api/orders",
    authMiddleware,
    roleMiddleware("customer"),
    createOrder
);
router.get(
    "/api/restaurant/orders",
    authMiddleware,
    roleMiddleware("restaurant"),
    getRestaurantOrders
);
router.put(
    "/api/restaurant/orders/:orderId/status",
    authMiddleware,
    roleMiddleware("restaurant"),
    updateOrderStatus
);
router.get(
    "/api/delivery/orders",
    authMiddleware,
    roleMiddleware("delivery"),
    getDeliveryOrders
);
router.get(
    "/api/customer/orders",
    authMiddleware,
    roleMiddleware("customer"),
    getCustomerOrders
);
router.put(
  "/api/customer/orders/:orderId/cancel",
  authMiddleware,
  roleMiddleware("customer"),
  cancelCustomerOrder
);
router.put(
  "/api/admin/orders/:orderId/status",
  authMiddleware,
  roleMiddleware("admin"),
  adminUpdateOrderStatus
);

router.delete(
  "/api/admin/orders/:orderId",
  authMiddleware,
  roleMiddleware("admin"),
  adminDeleteOrder
);
router.post(
    "/api/payments/razorpay/order",
    authMiddleware,
    roleMiddleware("customer"),
    createRazorpayOrder
);

router.post(
    "/api/payments/razorpay/verify",
    authMiddleware,
    roleMiddleware("customer"),
    verifyRazorpayPayment
);
router.put(
    "/api/customer/orders/:orderId/return",
    authMiddleware,
    roleMiddleware("customer"),
    requestOrderReturn
);
router.get(
  "/api/admin/returns",
  authMiddleware,
  roleMiddleware("admin"),
  getReturnRequests
);

router.put(
  "/api/admin/orders/:orderId/return",
  authMiddleware,
  roleMiddleware("admin"),
  reviewOrderReturn
);
router.post(
    "/api/admin/orders/:orderId/refund",
    authMiddleware,
    roleMiddleware("admin"),
    processOrderRefund
);
export default router;