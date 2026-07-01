import express from "express";
import rateLimit from "express-rate-limit";
import AuthController from "./auth.controller.js";

const authRouter = express.Router();
const authController = new AuthController();

// Rate limiter — max 5 login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

authRouter.post("/register", (req, res, next) =>
  authController.register(req, res, next),
);
authRouter.post("/login", loginLimiter, (req, res, next) =>
  authController.login(req, res, next),
);
authRouter.post("/logout", (req, res, next) =>
  authController.logout(req, res, next),
);

export default authRouter;
