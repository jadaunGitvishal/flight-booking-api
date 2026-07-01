import FlightModel from "./flight.model.js";
import FlightRepository from "./flight.repository.js";

/**
 * FlightController
 * Handles all HTTP request/response logic for flight operations.
 * Delegates data access to FlightRepository.
 */
export default class FlightController {
  constructor() {
    this.flightRepository = new FlightRepository();
  }

  /**
   * GET /api/flights — Public
   * @param {Object} req.query - filters: departureCity, arrivalCity, departureDate, flightClass, page, limit, sortBy, order
   * @returns {Object} { success, total, count, flights[] }
   */

  // 🔓 PUBLIC — GET /api/flights
  async getAll(req, res, next) {
    try {
      const flights = await this.flightRepository.getAll(req.query);

      return res.status(200).json({
        success: true,
        count: flights.length,
        flights,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  }

  // 🔓 PUBLIC — GET /api/flights/:id
  async getById(req, res, next) {
    try {
      const flight = await this.flightRepository.getById(req.params.id);
      if (!flight) {
        return res.status(404).json({
          success: false,
          message: "Flight not found",
        });
      }
      return res.status(200).json({
        success: true,
        flight,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  }

  // 🔐 ADMIN ONLY — POST /api/flights
  async create(req, res, next) {
    try {
      const {
        flightNumber,
        airline,
        departureCity,
        arrivalCity,
        departureDate,
        arrivalDate,
        price,
        availableSeats,
        flightClass,
      } = req.body;

      // Get uploaded image path
      const image = req.file ? req.file.path : "";

      const flight = new FlightModel(
        flightNumber,
        airline,
        departureCity,
        arrivalCity,
        departureDate,
        arrivalDate,
        price,
        availableSeats,
        flightClass,
        image,
      );

      const savedFlight = await this.flightRepository.create(flight);

      return res.status(201).json({
        success: true,
        message: "Flight created successfully",
        flight: savedFlight,
      });
    } catch (err) {
      next(err);
    }
  }

  // 🔐 ADMIN ONLY — PUT /api/flights/:id
  async update(req, res, next) {
    try {
      const updatedFlight = await this.flightRepository.update(
        req.params.id,
        req.body,
      );
      if (!updatedFlight) {
        return res.status(404).json({
          success: false,
          message: "Flight not found",
        });
      }
      return res.status(200).json({
        success: true,
        message: "Flight updated successfully",
        flight: updatedFlight,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }

  // 🔐 ADMIN ONLY — DELETE /api/flights/:id
  async delete(req, res, next) {
    try {
      const deleted = await this.flightRepository.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Flight not found",
        });
      }
      return res.status(200).json({
        success: true,
        message: "Flight deleted successfully",
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
}
