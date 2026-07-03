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
        // Handle duplicate key error
        if (err.code === 11000) {
          throw new ApplicationError(
            "Flight number already exists. Please use a different flight number.",
            400,
          );
        }
        console.log(err);
        throw new ApplicationError("Something went wrong with database", 500);
      }
    }
  }

  async getAll(filters = {}) {
    try {
      const query = {};

      // Case-insensitive regex filtering
      if (filters.departureCity) {
        query.departureCity = new RegExp(filters.departureCity, "i");
      }
      if (filters.arrivalCity) {
        query.arrivalCity = new RegExp(filters.arrivalCity, "i");
      }
      if (filters.departureDate) {
        query.departureDate = filters.departureDate;
      }
      if (filters.flightClass) {
        query.flightClass = filters.flightClass;
      }

      // Pagination
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 6;
      const skip = (page - 1) * limit;

      // Sorting
      const sortBy = filters.sortBy || "createdAt";
      const order = filters.order === "desc" ? -1 : 1;
      const sortObj = { [sortBy]: order };

      // Run both queries together
      const [flights, total] = await Promise.all([
        FlightModel.find(query).sort(sortObj).skip(skip).limit(limit),
        FlightModel.countDocuments(query),
      ]);

      return { flights, total };
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
