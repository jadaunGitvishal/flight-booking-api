import BookingModel from "./booking.model.js";
import { FlightModel } from "../flight/flight.repository.js";
import { ApplicationError } from "../../error-handler/applicationError.js";
import { io } from "../../../index.js";
import {
  sendBookingConfirmation,
  sendCancellationEmail,
} from "../../services/email.service.js";
import mongoose from "mongoose";
import { userSchema } from "../user/user.schema.js";

const UserModel = mongoose.models.User || mongoose.model("User", userSchema);

export default class BookingRepository {
  async create(data) {
    try {
      // Find flight
      const flight = await FlightModel.findById(data.flightId);

      if (!flight) {
        throw new ApplicationError("Flight not found", 404);
      }

      const passengerCount = data.passengerList?.length || 0;

      if (flight.availableSeats < passengerCount) {
        throw new ApplicationError("Not enough seats available", 400);
      }

      // Reduce seats
      flight.availableSeats -= passengerCount;
      await flight.save();

      // Create booking
      const booking = new BookingModel({
        flight: data.flightId,
        user: data.userId,
        passengerList: data.passengerList,
        totalPassengers: passengerCount,
        bookingStatus: "Booked",
      });

      await booking.save();
      // Send confirmation email (non-blocking)
      const user = await UserModel.findById(data.userId).select("name email");
      sendBookingConfirmation({ booking, flight, user });
      return booking;
    } catch (err) {
      throw err;
    }
  }

  // 2. Get Booking By Id
  async getBookingById(id) {
    try {
      return await BookingModel.findById(id)
        .populate("flight")
        .populate("user");
    } catch (err) {
      throw err;
    }
  }

  // Update booking (passenger info or flight changes)
  async updateBooking(id, data) {
    try {
      const booking = await BookingModel.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      });
      if (!booking) throw new ApplicationError("Booking not found", 404);
      return booking;
    } catch (err) {
      throw err;
    }
  }

  // Cancel and Refund
  async cancelAndRefund(id) {
    try {
      // 1. Find the booking
      const booking = await BookingModel.findById(id);
      if (!booking) return null;

      // 2. Prevent processing if already cancelled
      if (booking.bookingStatus === "Cancelled") {
        throw new ApplicationError("Booking is already cancelled", 400);
      }

      // 3. Return the seats back to the flight inventory safely
      const passengerCount = booking.passengerList
        ? booking.passengerList.length
        : 0;
      const backupCount =
        typeof booking.totalPassengers === "number"
          ? booking.totalPassengers
          : parseInt(booking.totalPassengers, 10);

      let totalSeatsToRefund = passengerCount || backupCount || 0;
      totalSeatsToRefund = Math.max(0, Number(totalSeatsToRefund));

      if (totalSeatsToRefund > 0) {
        await FlightModel.findByIdAndUpdate(booking.flight, {
          $inc: { availableSeats: totalSeatsToRefund },
        });
      }

      // 4. Update booking status to Cancelled
      booking.bookingStatus = "Cancelled";

      // CRITICAL FIX: Explicitly populate totalPassengers so Mongoose validation passes
      if (
        booking.totalPassengers === undefined ||
        booking.totalPassengers === null
      ) {
        booking.totalPassengers = totalSeatsToRefund;
      }

      await booking.save(); // Line 97 won't fail anymore!

      // 5. Simulate refund process
      const refundDetails = {
        bookingId: booking._id,
        refundStatus: "Processed",
        refundAmount: booking.totalPrice || "100% Initiated",
        processedAt: new Date(),
      };

      // Send cancellation email (non-blocking)
      const flight = await FlightModel.findById(booking.flight);
      const user = await UserModel.findById(booking.user).select("name email");
      sendCancellationEmail({ booking, flight, user, refundDetails });
      return { booking, refundDetails };
    } catch (err) {
      throw err;
    }
  }
}
