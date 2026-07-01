import express from "express";
import UserController from "./user.controller.js";
import jwtAuth from "../../middlewares/jwt.middleware.js";
import upload from "../../middlewares/fileUpload.middleware.js";

const userRouter = express.Router();
const userController = new UserController();

// GET  /api/users/         — Fetch user details based on JWT info
userRouter.get("/", jwtAuth, userController.getUser.bind(userController));

// POST /api/users/profile  — Update profile AND upload avatar in one request
//   Accepts both: JSON body fields (name, email, gender...)
//                 AND optional file field "avatar" (multipart/form-data)
userRouter.post(
  "/profile",
  jwtAuth,
  upload.single("avatar"), // handles avatar upload if provided
  userController.updateProfile.bind(userController),
);

export default userRouter;
