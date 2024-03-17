import { Router } from "express";

import {
    registerUser, 
    loginUser, 
    logoutUser, 
    regenerateAccessAndRefreshToken, 
    changeCurrentPassword, 
    getCurrentUser,
    updateAccountDetails,
} from "../controllers/user.controllers.js";

import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/register").post(registerUser);

router.route("/login").post(loginUser);

// secured routes
router.route("/logout").post(verifyJWT, logoutUser);

router.route("/refresh-token").post(regenerateAccessAndRefreshToken);

router.route("/update-password").post(verifyJWT, changeCurrentPassword);

router.route("/current-user").get(verifyJWT, getCurrentUser);

router.route("/update-user").post(verifyJWT, updateAccountDetails);

export default router;