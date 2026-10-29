import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { forgotAccountPassword, resetAccountPassword, changeAccountPassword } from "../controllers/accountPasswordController.js";

const router = express.Router();
router.post("/api/account-password/forgot/:accountType", forgotAccountPassword);
router.put("/api/account-password/reset/:accountType/:token", resetAccountPassword);
router.put("/api/account-password/change", authMiddleware, changeAccountPassword);
export default router;
