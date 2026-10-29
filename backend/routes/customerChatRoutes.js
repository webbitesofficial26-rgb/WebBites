import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import { customerGeminiChat } from "../controllers/customerChatController.js";

const router = express.Router();

router.post("/api/customer/chat", authMiddleware, roleMiddleware("customer"), customerGeminiChat);

export default router;
