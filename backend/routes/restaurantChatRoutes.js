import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import { restaurantGeminiChat } from "../controllers/restaurantChatController.js";

const router = express.Router();

router.post("/api/restaurant/chat", authMiddleware, roleMiddleware("restaurant"), restaurantGeminiChat);

export default router;
