import mongoose from "mongoose";
import { flightSchema } from "./flight.schema.js";
import { ApplicationError } from "../../error-handler/applicationError.js";

// creating model from schema.
export const FlightModel = mongoose.model("Flight", flightSchema);

export default class FlightRepository {
  async create(flight) {
    try {
      // create instance of model.
      const newFlight = new FlightModel(flight);
      await newFlight.save();
      return newFlight;
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

  async getAll(filters = {}) {
    try {
      const query = {};

      if (filters.departureCity) {
        query.departureCity = filters.departureCity;
      }

      if (filters.arrivalCity) {
        query.arrivalCity = filters.arrivalCity;
      }

      if (filters.departureDate) {
        query.departureDate = filters.departureDate;
      }

      if (filters.flightClass) {
        query.flightClass = filters.flightClass;
      }

      return await FlightModel.find(query);
    } catch (err) {
      console.log(err);
      throw new ApplicationError("Something went wrong with database", 500);
    }
  }

  async getById(id) {
    try {
      return await FlightModel.findById(id);
    } catch (err) {
      console.log(err);
      throw new ApplicationError("Something went wrong with database", 500);
    }
  }

  async update(id, data) {
    try {
      return await FlightModel.findByIdAndUpdate(id, data, { new: true });
    } catch (err) {
      console.log(err);
      throw new ApplicationError("Something went wrong with database", 500);
    }
  }

  async delete(id) {
    try {
      return await FlightModel.findByIdAndDelete(id);
    } catch (err) {
      console.log(err);
      throw new ApplicationError("Something went wrong with database", 500);
    }
  }
}
