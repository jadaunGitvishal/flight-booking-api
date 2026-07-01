import BookingRepository from "./booking.repository.js";

/**
 * BookingController
 * Handles HTTP request/response logic for booking operations.
 * Delegates data access to BookingRepository.
 */
export default class BookingController {
  constructor() {
    this.bookingRepository = new BookingRepository();
  }

  /**
   * POST /api/bookings — Authenticated users
   * @param {string} req.body.flightId - Flight to book
   * @param {Array}  req.body.passengerList - [{name, age, gender}]
   * @returns {Object} { success, message, booking }
   */

  // Create Booking
  async create(req, res, next) {
    try {
      const { flightId, passengerList } = req.body;

      const booking = await this.bookingRepository.create({
        flightId,
        passengerList,
        userId: req.userID,
      });

      return res.status(201).json({
        success: true,
        message: "Flight booked successfully",
        booking,
      });
    } catch (err) {
      next(err);
    }
  }
  // Update Booking
  async updateBooking(req, res, next) {
    try {
      const updated = await this.bookingRepository.updateBooking(
        req.params.id,
        req.body,
      );
      return res.status(200).json({
        success: true,
        message: "Booking updated successfully",
        booking: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  // Get Booking By Id
  async getBookingById(req, res, next) {
    try {
      const booking = await this.bookingRepository.getBookingById(
        req.params.id,
      );

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      return res.status(200).json({
        success: true,
        booking,
      });
    } catch (err) {
      next(err);
    }
  }

  // Cancel Booking
  // Add this method inside your BookingController class
  async cancelBookingAndRefund(req, res, next) {
    try {
      const result = await this.bookingRepository.cancelAndRefund(
        req.params.id,
      );

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Booking cancelled and refund processed successfully",
        booking: result.booking,
        refund: result.refundDetails,
      });
    } catch (err) {
      next(err);
    }
  }
}
