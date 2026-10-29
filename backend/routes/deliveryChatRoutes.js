import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import { deliveryGeminiChat } from "../controllers/deliveryChatController.js";

const router = express.Router();

router.post("/api/delivery/chat", authMiddleware, roleMiddleware("delivery"), deliveryGeminiChat);

export default router;
