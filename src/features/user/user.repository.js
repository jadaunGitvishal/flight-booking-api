import mongoose from "mongoose";
import { userSchema } from "./user.schema.js";
import { ApplicationError } from "../../error-handler/applicationError.js";

// creating model from schema.
const UserModel = mongoose.model("User", userSchema);

export default class UserRepository {
  async signUp(user) {
    try {
      // create instance of model.
      const newUser = new UserModel(user);
      await newUser.save();
      return newUser;
    } catch (err) {
      console.error("DB ERROR:", err);
      if (err instanceof mongoose.Error.ValidationError) {
        console.log("Validation issue:", err.errors);
        throw err;
      } else {
        console.log(err);
        throw new ApplicationError(
          err.message,
          "Something went wrong with database",
          500,
        );
      }
    }
  }

  async findByEmail(email) {
    try {
      return await UserModel.findOne({ email });
    } catch (err) {
      console.log(err);
      throw new ApplicationError("Something went wrong with database", 500);
    }
  }
  async getUserById(userId) {
    try {
      return await UserModel.findById(userId).select("-password");
    } catch (err) {
      throw new ApplicationError("Something went wrong with database", 500);
    }
  }
  async updateProfile(userId, data) {
    try {
      return await UserModel.findByIdAndUpdate(userId, data, {
        new: true,
      }).select("-password");
    } catch (err) {
      throw new ApplicationError("Something went wrong with database", 500);
    }
  }
}
