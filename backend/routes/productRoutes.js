
import express from "express";

import {
    addProduct,
    getMyProducts,
    updateProduct,
    deleteProduct,
    getRestaurantProducts,
    toggleProductAvailability,
} from "../controllers/productController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post(
    "/api/add-product",
    authMiddleware,
    roleMiddleware("restaurant"),
    upload.single("image"),
    addProduct
);

router.get(
    "/api/my-products",
    authMiddleware,
    roleMiddleware("restaurant"),
    getMyProducts
);


router.put(
    "/api/update-product/:id",
    authMiddleware,
    roleMiddleware("restaurant"),
    upload.single("image"),
    updateProduct
);



router.delete(
    "/api/delete-product/:id",
    authMiddleware,
    roleMiddleware("restaurant"),
    deleteProduct
);

router.get(
    "/api/products/restaurant/:restaurantId",
    getRestaurantProducts
);

router.put(
    "/api/update-product-availability/:id",
    authMiddleware,
    roleMiddleware("restaurant"),
    toggleProductAvailability
);

export default router;

