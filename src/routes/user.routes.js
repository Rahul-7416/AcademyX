import { Router } from "express";
import { registerUser, loginUser, logoutUser, regenerateAccessAndRefreshToken } from "../controllers/user.controllers.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/register").post(registerUser);

router.route("/login").post(loginUser);

// secured routes
router.route("/logout").post(verifyJWT, logoutUser);

router.route("/refresh-token").post(regenerateAccessAndRefreshToken);

export default router;