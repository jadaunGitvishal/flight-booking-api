import dotenv from "dotenv";
dotenv.config(); // Must be first — loads env vars before any module uses them

import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { setIO } from "./src/socket.js";

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
server.use(express.static("public"));

// ── Request Logger Middleware ─────────────────────────────
server.use((req, res, next) => {
  console.log(
    `📥 [${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`,
  );
  next();
});

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

// ── 404 Handler — unmatched routes ───────────────────────
server.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.url}`,
  });
});

// ── Global Error Handler ──────────────────────
server.use((err, req, res, next) => {
  console.error(
    `❌ [${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`,
  );
  console.error(`   Message : ${err.message}`);
  console.error(`   Status  : ${err.statusCode || 500}`);
  console.error(`   Stack   : ${err.stack}`);

  let status = err.statusCode || err.code || 500;
  if (typeof status !== "number" || status < 100 || status > 599) {
    status = 500;
  }
  res.status(status).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ── HTTP Server + Socket.IO ───────────────────────────────
const httpServer = createServer(server);

const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://127.0.0.1:5500",
    ],
    methods: ["GET", "POST"],
  },
});

setIO(io);

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
