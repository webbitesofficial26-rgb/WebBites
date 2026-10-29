import express from "express";
import { addRestaurant, restaurantLogin, getRestaurants, updateRestaurantProfile, getRestaurantProfile,
         getRestaurantEarnings, toggleRestaurantStatus, searchRestaurants, searchRestaurantsAndProducts, getRestaurantInfo, updateRestaurantProfilePicture, updateRestaurantCoverImage
} from "../controllers/restaurantController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post("/api/add-restaurant", addRestaurant);
router.post("/api/restaurant-login", restaurantLogin);
router.get("/api/restaurants",getRestaurants);
router.get("/api/restaurants/search", searchRestaurants);
router.get("/api/search", searchRestaurantsAndProducts);
router.get(
    "/api/restaurant/profile",
    authMiddleware,
    roleMiddleware("restaurant"),
    getRestaurantProfile
);

router.put(
    "/api/restaurant/profile",
    authMiddleware,
    roleMiddleware("restaurant"),
    updateRestaurantProfile
);

router.put(
  "/api/restaurant/profile-picture",
  authMiddleware,
  roleMiddleware("restaurant"),
  upload.single("image"),
  updateRestaurantProfilePicture
);

router.put(
  "/api/restaurant/cover-image",
  authMiddleware,
  roleMiddleware("restaurant"),
  upload.single("image"),
  updateRestaurantCoverImage
);

router.get(
  "/api/restaurant/earnings",
  authMiddleware,
  roleMiddleware("restaurant"),
  getRestaurantEarnings
);
router.put(
  "/api/restaurant/status",
  authMiddleware,
  roleMiddleware("restaurant"),
  toggleRestaurantStatus
);
router.get(
  "/api/restaurant/info",
  authMiddleware,
  roleMiddleware("restaurant"),
  getRestaurantInfo
);
export default router;