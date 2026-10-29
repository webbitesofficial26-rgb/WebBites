import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import { adminGeminiChat } from "../controllers/adminChatController.js";

const router = express.Router();

router.post("/api/admin/chat", authMiddleware, roleMiddleware("admin"), adminGeminiChat);

export default router;
