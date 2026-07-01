// 1. Import express.
import express from "express";
import FlightController from "./flight.controller.js";
import jwtAuth, { isAdmin } from "../../middlewares/jwt.middleware.js";
import upload from "../../middlewares/fileUpload.middleware.js";

// 2. Initialize Express router.
const flightRouter = express.Router();

const flightController = new FlightController();

// All the paths to controller methods.

// 🔓 PUBLIC ROUTES
flightRouter.get("/", flightController.getAll.bind(flightController));

flightRouter.get("/:id", (req, res, next) => {
  flightController.getById(req, res, next);
});

// 🔐 ADMIN ROUTES
flightRouter.post(
  "/",
  jwtAuth,
  isAdmin,
  upload.single("image"),
  flightController.create.bind(flightController),
);
flightRouter.put(
  "/:id",
  jwtAuth,
  isAdmin,
  flightController.update.bind(flightController),
);
flightRouter.delete(
  "/:id",
  jwtAuth,
  isAdmin,
  flightController.delete.bind(flightController),
);

export default flightRouter;
