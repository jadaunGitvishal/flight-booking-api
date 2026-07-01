import UserRepository from "./user.repository.js";
import bcrypt from "bcrypt";

export default class UserController {
  constructor() {
    this.userRepository = new UserRepository();
  }

  // GET /api/users/ — Fetch user details based on JWT info
  async getUser(req, res) {
    try {
      const user = await this.userRepository.getUserById(req.userID);
      return res.status(200).json({ success: true, user });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // POST /api/users/profile — Update user profile (and avatar, if a file is sent)
  async updateProfile(req, res) {
    try {
      const updateData = { ...req.body };
      if (req.file) {
        updateData.avatar = req.file.path;
      }
      const updatedUser = await this.userRepository.updateProfile(
        req.userID,
        updateData,
      );
      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user: updatedUser,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // POST /api/users/avatar — Upload profile picture
  async uploadAvatar(req, res) {
    try {
      const avatarPath = req.file.path;
      const user = await this.userRepository.updateProfile(req.userID, {
        avatar: avatarPath,
      });
      return res.status(200).json({
        success: true,
        message: "Avatar uploaded successfully",
        user,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // PUT /api/users/resetPassword — Reset password
  async resetPassword(req, res, next) {
    try {
      const { newPassword } = req.body;
      if (!newPassword) {
        return res
          .status(400)
          .json({ success: false, message: "newPassword is required" });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await this.userRepository.updateProfile(req.userID, {
        password: hashedPassword,
      });
      return res
        .status(200)
        .json({ success: true, message: "Password reset successfully" });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}
