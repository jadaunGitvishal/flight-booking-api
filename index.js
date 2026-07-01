import dotenv from "dotenv";
dotenv.config(); // Must be first — loads env vars before any module uses them

import express from "express";
import authRouter from "./src/features/auth/auth.routes.js";
import userRouter from "./src/features/user/user.routes.js";
import flightRouter from "./src/features/flight/flight.routes.js";
import bookingRoutes from "./src/features/booking/booking.routes.js";
import { connectUsingMongoose } from "./src/config/mongooseConfig.js";

const server = express();

server.use(express.json());

// ── Authentication Routes ──────────────────────
server.use("/api/auth", authRouter); // POST /api/auth/register
// POST /api/auth/login
// POST /api/auth/logout

// ── User Routes ───────────────────────────────
server.use("/api/users", userRouter); // GET  /api/users/
// POST /api/users/profile

// ── Flight Routes ─────────────────────────────
server.use("/api/flights", flightRouter);

// ── Booking Routes ────────────────────────────
server.use("/api/bookings", bookingRoutes);

// ── Global Error Handler ──────────────────────
server.use((err, req, res, next) => {
  console.error("❌ Error stack trace:", err.stack);

  // 1. Prioritize your custom ApplicationError statusCode, then look at err.code
  let status = err.statusCode || err.code || 500;
  // 2. Validate status code range. If it's a MongoDB internal code (like 14 or 11000),
  //    fallback safely to 500 instead of crashing Express with a RangeError.
  if (typeof status !== "number" || status < 100 || status > 599) {
    status = 500;
  }
  // 3. Send a clean, structured JSON response with a guaranteed valid status code
  res.status(status).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

await connectUsingMongoose();
server.listen(3000, () => {
  console.log("Server is running at 3000");
});
