import express from "express";

import {
  createReview,
  getRestaurantReviews,
} from "../controllers/reviewController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post(
  "/api/reviews",
  authMiddleware,
  roleMiddleware("customer"),
  createReview
);

router.get(
  "/api/reviews/restaurant/:restaurantId",
  getRestaurantReviews
);

export default router;