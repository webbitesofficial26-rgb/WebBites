import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import { getAdminDashboard, getAllRestaurants, deleteRestaurant, getAllCustomers, getAllDeliveryPartners,
         getAllOrders,  adminToggleRestaurantStatus, adminSetRestaurantApproval, adminUpdateRestaurant,adminDeleteCustomer, 
         adminUpdateCustomer,adminDeleteDelivery, adminToggleDeliveryStatus, adminUpdateDelivery, adminDeleteProduct,
         adminUpdateProduct, getAllProducts, getAdminAnalytics
 } from "../controllers/adminController.js";

const router = express.Router();

router.get(
    "/api/admin/dashboard",
    authMiddleware,
    roleMiddleware("admin"),
    getAdminDashboard
);
router.get(
    "/api/admin/restaurants",
    authMiddleware,
    roleMiddleware("admin"),
    getAllRestaurants
);

router.delete(
    "/api/admin/restaurants/:restaurantId",
    authMiddleware,
    roleMiddleware("admin"),
    deleteRestaurant
);
router.get(
  "/api/admin/customers",
  authMiddleware,
  roleMiddleware("admin"),
  getAllCustomers
);
router.get(
  "/api/admin/delivery",
  authMiddleware,
  roleMiddleware("admin"),
  getAllDeliveryPartners
);
router.get(
  "/api/admin/orders",
  authMiddleware,
  roleMiddleware("admin"),
  getAllOrders
);
router.put(
  "/api/admin/restaurants/:id",
  authMiddleware,
  roleMiddleware("admin"),
  adminUpdateRestaurant
);



router.put(
  "/api/admin/restaurants/:id/approval",
  authMiddleware,
  roleMiddleware("admin"),
  adminSetRestaurantApproval
);

router.put(
  "/api/admin/restaurants/:id/status",
  authMiddleware,
  roleMiddleware("admin"),
  adminToggleRestaurantStatus
);
router.put(
  "/api/admin/customers/:id",
  authMiddleware,
  roleMiddleware("admin"),
  adminUpdateCustomer
);

router.delete(
  "/api/admin/customers/:id",
  authMiddleware,
  roleMiddleware("admin"),
  adminDeleteCustomer
);

router.put(
  "/api/admin/delivery/:id",
  authMiddleware,
  roleMiddleware("admin"),
  adminUpdateDelivery
);

router.delete(
  "/api/admin/delivery/:id",
  authMiddleware,
  roleMiddleware("admin"),
  adminDeleteDelivery
);

router.put(
  "/api/admin/delivery/:id/status",
  authMiddleware,
  roleMiddleware("admin"),
  adminToggleDeliveryStatus
);
// Admin: Get all products
router.get(
    "/api/admin/products",
    authMiddleware,
    roleMiddleware("admin"),
    getAllProducts
);

// Admin: Update any product
router.put(
    "/api/admin/products/:id",
    authMiddleware,
    roleMiddleware("admin"),
    adminUpdateProduct
);

// Admin: Delete any product
router.delete(
    "/api/admin/products/:id",
    authMiddleware,
    roleMiddleware("admin"),
    adminDeleteProduct
);

router.get(
    "/api/admin/analytics",
    authMiddleware,
    roleMiddleware("admin"),
    getAdminAnalytics
);


export default router;