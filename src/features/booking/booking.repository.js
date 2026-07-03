import BookingModel from "./booking.model.js";
import { FlightModel } from "../flight/flight.repository.js";
import { ApplicationError } from "../../error-handler/applicationError.js";
import { getIO } from "../../socket.js";
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
      // Validate passenger list before anything else
      if (!data.flightId) {
        throw new ApplicationError("Flight ID is required", 400);
      }

      if (
        !data.passengerList ||
        !Array.isArray(data.passengerList) ||
        data.passengerList.length === 0
      ) {
        throw new ApplicationError(
          "Passenger list is required and must have at least one passenger",
          400,
        );
      }

      // Validate each passenger has required fields
      for (const passenger of data.passengerList) {
        if (!passenger.name || !passenger.age || !passenger.gender) {
          throw new ApplicationError(
            "Each passenger must have name, age and gender",
            400,
          );
        }
      }

      // Validate flightId is a valid MongoDB ObjectId format
      if (!mongoose.Types.ObjectId.isValid(data.flightId)) {
        throw new ApplicationError("Invalid flight ID format", 400);
      }

      const flight = await FlightModel.findById(data.flightId);

      if (!flight) {
        throw new ApplicationError("Flight not found", 404);
      }

      const passengerCount = data.passengerList.length;

      if (flight.availableSeats < passengerCount) {
        throw new ApplicationError("Not enough seats available", 400);
      }

      // Reduce seats
      flight.availableSeats -= passengerCount;
      await flight.save();

      // Emit real-time seat update
      console.log("🔊 Emitting seats-updated, seats:", flight.availableSeats);
      const io = getIO();
      if (io) {
        io.to(flight._id.toString()).emit("seats-updated", {
          flightId: flight._id.toString(),
          availableSeats: flight.availableSeats,
        });
      } else {
        console.log("❌ io is null — socket not initialized");
      }

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

  // Get Booking By Id
  async getBookingById(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApplicationError("Invalid booking ID format", 400);
      }

      const booking = await BookingModel.findById(id)
        .populate("flight")
        .populate("user");

      if (!booking) {
        throw new ApplicationError("Booking not found", 404);
      }

      return booking;
    } catch (err) {
      throw err;
    }
  }

  // Update booking
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
      const booking = await BookingModel.findById(id);
      if (!booking) return null;

      if (booking.bookingStatus === "Cancelled") {
        throw new ApplicationError("Booking is already cancelled", 400);
      }

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
        const updatedFlight = await FlightModel.findByIdAndUpdate(
          booking.flight,
          { $inc: { availableSeats: totalSeatsToRefund } },
          { new: true },
        );

        // Emit real-time seat restore
        console.log(
          "🔊 Emitting seats-updated after cancel, seats:",
          updatedFlight?.availableSeats,
        );
        const io = getIO();
        if (io && updatedFlight) {
          io.to(updatedFlight._id.toString()).emit("seats-updated", {
            flightId: updatedFlight._id.toString(),
            availableSeats: updatedFlight.availableSeats,
          });
        }
      }

      booking.bookingStatus = "Cancelled";

      if (
        booking.totalPassengers === undefined ||
        booking.totalPassengers === null
      ) {
        booking.totalPassengers = totalSeatsToRefund;
      }

      await booking.save();

      const refundDetails = {
        bookingId: booking._id,
        refundStatus: "Processed",
        refundAmount: booking.totalPrice || "100% Initiated",
        processedAt: new Date(),
      };

      const flight = await FlightModel.findById(booking.flight);
      const user = await UserModel.findById(booking.user).select("name email");
      sendCancellationEmail({ booking, flight, user, refundDetails });

      return { booking, refundDetails };
    } catch (err) {
      throw err;
    }
  }
}
