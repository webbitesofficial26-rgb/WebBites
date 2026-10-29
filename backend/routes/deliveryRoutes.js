import express from "express";

import {
    addDelivery,
    deliveryLogin,
    getMyDeliveries,
    acceptDelivery,
    completeDelivery,
    getDeliveryProfile,
    updateDeliveryProfile,
    getDeliveryEarnings,
    getDeliveryInfo,
    updateDeliveryProfilePicture,
} from "../controllers/deliveryController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post("/api/add-delivery", addDelivery);

router.post("/api/delivery-login", deliveryLogin);
router.put(
    "/api/delivery/orders/:orderId/accept",
    authMiddleware,
    roleMiddleware("delivery"),
    acceptDelivery
);

router.put(
    "/api/delivery/orders/:orderId/delivered",
    authMiddleware,
    roleMiddleware("delivery"),
    completeDelivery
);
router.get(
    "/api/delivery/my-orders",
    authMiddleware,
    roleMiddleware("delivery"),
    getMyDeliveries
);
router.get(
  "/api/delivery/profile",
  authMiddleware,
  roleMiddleware("delivery"),
  getDeliveryProfile
);

router.put(
  "/api/delivery/profile",
  authMiddleware,
  roleMiddleware("delivery"),
  updateDeliveryProfile
);

router.put(
  "/api/delivery/profile-picture",
  authMiddleware,
  roleMiddleware("delivery"),
  upload.single("image"),
  updateDeliveryProfilePicture
);

router.get(
  "/api/delivery/earnings",
  authMiddleware,
  roleMiddleware("delivery"),
  getDeliveryEarnings
);
router.get(
  "/api/delivery/info",
  authMiddleware,
  roleMiddleware("delivery"),
  getDeliveryInfo
);
export default router;