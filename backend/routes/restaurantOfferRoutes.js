import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import { getRestaurantOfferTemplates, toggleRestaurantOffer, getAvailableCustomerOffers } from "../controllers/restaurantOfferController.js";

const router = express.Router();
router.get("/api/restaurant-offers/available", getAvailableCustomerOffers);
router.get("/api/restaurant/offers", authMiddleware, roleMiddleware("restaurant"), getRestaurantOfferTemplates);
router.patch("/api/restaurant/offers/:offerId/toggle", authMiddleware, roleMiddleware("restaurant"), toggleRestaurantOffer);
export default router;
