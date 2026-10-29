import express from 'express';
import { addUser,login,forgetPassword, resetPassword } from '../controllers/authController.js'; 
import { updateUser,getUserById} from '../controllers/userDataController.js'
import authMiddleware from "../middleware/authMiddleware.js";
import { profile} from "../controllers/authController.js";
import roleMiddleware from '../middleware/roleMiddleware.js';
import { getCustomerProfile, updateCustomerProfile, updateCustomerProfilePicture } from '../controllers/userDataController.js';
import upload from "../middleware/upload.js";
const router = express.Router();


router.post('/api/add-user', addUser);
router.post('/api/login', login);
router.post("/api/forget-password", forgetPassword);

router.put("/api/reset-password/:token", resetPassword);
router.put(
    "/api/update-user/:uid",
    authMiddleware,
    roleMiddleware("customer"),
    updateUser
);

router.get(
    "/api/get-user/:uid",
    authMiddleware,
    roleMiddleware("customer"),
    getUserById
);

router.get(
    "/api/profile",
    authMiddleware,
    roleMiddleware("customer"),
    profile
);
router.get(
  "/api/customer/profile",
  authMiddleware,
  roleMiddleware("customer"),
  getCustomerProfile
);

router.put(
  "/api/customer/profile",
  authMiddleware,
  roleMiddleware("customer"),
  updateCustomerProfile
);

router.put(
  "/api/customer/profile-picture",
  authMiddleware,
  roleMiddleware("customer"),
  upload.single("image"),
  updateCustomerProfilePicture
);

export default router;