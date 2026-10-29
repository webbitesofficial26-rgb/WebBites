import express from "express";
import { adminLogin } from "../controllers/adminAuthController.js";

const router = express.Router();

router.post("/api/admin/login", adminLogin);

export default router;