import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    flight: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Flight",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    passengerList: [
      {
        name: String,
        age: Number,
        gender: String,
      },
    ],

    totalPassengers: {
      type: Number,
      required: true,
    },

    bookingStatus: {
      type: String,
      default: "Booked",
    },
  },
  { timestamps: true },
);

export default bookingSchema;
