import express from "express";
import BookingController from "./booking.controller.js";
import jwtAuth from "../../middlewares/jwt.middleware.js";

const bookingRouter = express.Router();

const bookingController = new BookingController();

// Create Booking
bookingRouter.post(
  "/",
  jwtAuth,
  bookingController.create.bind(bookingController),
);
// Get Booking By ID
bookingRouter.get(
  "/:id",
  jwtAuth,
  bookingController.getBookingById.bind(bookingController),
);
bookingRouter.put(
  "/:id",
  jwtAuth,
  bookingController.updateBooking.bind(bookingController),
);

// Target Route: PUT http://localhost:3000/api/bookings/:id/cancel
bookingRouter.put("/:id/cancel", jwtAuth, (req, res, next) =>
  bookingController.cancelBookingAndRefund(req, res, next),
);

export default bookingRouter;
