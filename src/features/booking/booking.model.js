import mongoose from "mongoose";
import bookingSchema from "./booking.schema.js";

const BookingModel = mongoose.model("Booking", bookingSchema);

export default BookingModel;
