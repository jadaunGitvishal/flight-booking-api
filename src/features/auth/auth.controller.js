import UserModel from "../user/user.model.js";
import UserRepository from "../user/user.repository.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * AuthController
 * Handles user registration, login, and logout.
 * Uses bcrypt for password hashing and JWT for session tokens.
 */

export default class AuthController {
  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * POST /api/auth/register
   * @param {string} req.body.name
   * @param {string} req.body.email
   * @param {string} req.body.password - plain text, hashed before saving
   * @param {string} req.body.role - "user" | "admin"
   * @param {string} req.body.gender
   * @returns {Object} { success, message, user }
   */

  // POST /api/auth/register — Register a new user
  async register(req, res, next) {
    const { name, email, password, role, profilePicture, createdAt, gender } =
      req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 12);
      const user = new UserModel(
        name,
        email,
        hashedPassword,
        role,
        profilePicture,
        createdAt,
        gender,
      );
      await this.userRepository.signUp(user);
      return res.status(201).json({
        success: true,
        message: "User registered successfully",
        user,
      });
    } catch (err) {
      console.log("🔥 REGISTER ERROR:", err.message);
      next(err);
    }
  }

  // POST /api/auth/login — Login, issue JWT token, set cookie, set session
  async login(req, res, next) {
    try {
      const user = await this.userRepository.findByEmail(req.body.email);
      if (!user) {
        return res
          .status(400)
          .json({ success: false, message: "Incorrect Credentials" });
      }

      const result = await bcrypt.compare(req.body.password, user.password);
      if (!result) {
        return res
          .status(400)
          .json({ success: false, message: "Incorrect Credentials" });
      }

      // Sign JWT with userID, email and role
      const token = jwt.sign(
        { userID: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
      );

      // Set token in cookie
      res.cookie("jwtToken", token, {
        httpOnly: true,
        maxAge: 3600000, // 1 hour
      });

      // Set user in session if session middleware is present
      if (req.session) {
        req.session.userID = user._id;
        req.session.role = user.role;
      }

      return res.status(200).json({
        success: true,
        message: "Login successfully",
        token,
        role: user.role,
      });
    } catch (err) {
      console.log("🔥 LOGIN ERROR:", err.message);
      next(err);
    }
  }

  // POST /api/auth/logout — Clear session and remove token from cookies
  async logout(req, res, next) {
    try {
      // Clear JWT cookie
      res.clearCookie("jwtToken");

      // Destroy session if session middleware is present
      if (req.session) {
        req.session.destroy((err) => {
          if (err) console.log("Session destroy error:", err);
        });
      }

      return res.status(200).json({
        success: true,
        message: "Logout successfully",
      });
    } catch (err) {
      next(err);
    }
  }
}
