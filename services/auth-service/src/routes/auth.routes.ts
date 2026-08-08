import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/authenticate";
import { loginLimiter, otpLimiter } from "../middleware/rateLimiter";
import {
  signupSchema,
  loginSchema,
  adminLoginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  acceptInviteSchema,
} from "../validators/auth.validators";

const router = Router();

// --- Public ---
router.post("/signup", otpLimiter, validate(signupSchema), authController.signup);
router.post("/verify-email", otpLimiter, validate(verifyOtpSchema), authController.verifyEmail);
router.post("/resend-otp", otpLimiter, validate(resendOtpSchema), authController.resendOtp);
router.post("/login", loginLimiter, validate(loginSchema), authController.login);
router.post("/admin/login", loginLimiter, validate(adminLoginSchema), authController.adminLogin);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.post("/forgot-password", otpLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post("/reset-password", otpLimiter, validate(resetPasswordSchema), authController.resetPassword);
router.post("/accept-invite", otpLimiter, validate(acceptInviteSchema), authController.acceptInvite);

// --- Authenticated ---
router.get("/me", authenticate, authController.getMe);
router.post("/change-password", authenticate, validate(changePasswordSchema), authController.changePassword);

export default router;
