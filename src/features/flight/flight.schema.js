import mongoose from "mongoose";

export const flightSchema = new mongoose.Schema({
  flightNumber: {
    type: String,
    required: true,
  },
  airline: {
    type: String,
    required: true,
  },
  departureCity: {
    type: String,
    required: true,
  },
  arrivalCity: {
    type: String,
    required: true,
  },

  departureDate: {
    type: String,
    default: () => Date.now(),
  },
  arrivalDate: {
    type: String,
    default: () => Date.now(),
  },
  price: {
    type: Number,
    required: true,
  },
  availableSeats: {
    type: Number,
    required: true,
    min: 0,
  },
  flightClass: {
    type: String,
    enum: ["Economy", "Business", "First"],
    required: true,
  },
  image: {
    type: String,
    default: "",
  },
});
