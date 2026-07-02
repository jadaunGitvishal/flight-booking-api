import dotenv from "dotenv";
dotenv.config(); // Must be first — loads env vars before any module uses them

import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

import authRouter from "./src/features/auth/auth.routes.js";
import userRouter from "./src/features/user/user.routes.js";
import flightRouter from "./src/features/flight/flight.routes.js";
import bookingRoutes from "./src/features/booking/booking.routes.js";
import { connectUsingMongoose } from "./src/config/mongooseConfig.js";

const server = express();

// ── CORS ──────────────────────────────────────────────────
server.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  }),
);

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

// ── HTTP Server + Socket.IO ───────────────────────────────
const httpServer = createServer(server);

export const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"],
  },
});
io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  // Client joins a room for a specific flight
  socket.on("join-flight", (flightId) => {
    socket.join(flightId);
    console.log(`Socket ${socket.id} joined flight room: ${flightId}`);
  });

  socket.on("leave-flight", (flightId) => {
    socket.leave(flightId);
  });

  socket.on("disconnect", () => {
    console.log("🔌 Client disconnected:", socket.id);
  });
});

// ── Start ─────────────────────────────────────────────────

await connectUsingMongoose();
httpServer.listen(3000, () => {
  console.log("Server is running at 3000");
});
