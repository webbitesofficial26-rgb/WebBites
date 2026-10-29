import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import { createOfferTemplate, getOfferTemplates, toggleOfferTemplate } from "../controllers/offerTemplateController.js";

const router = express.Router();
router.get("/api/admin/offer-templates", authMiddleware, roleMiddleware("admin"), getOfferTemplates);
router.post("/api/admin/offer-templates", authMiddleware, roleMiddleware("admin"), createOfferTemplate);
router.patch("/api/admin/offer-templates/:offerId/toggle", authMiddleware, roleMiddleware("admin"), toggleOfferTemplate);
export default router;
