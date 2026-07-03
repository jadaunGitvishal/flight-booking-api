# ✈️ Flight Booking App — REST API

A RESTful API built with **Node.js**, **Express**, and **MongoDB (Mongoose)** that supports user authentication, flight management (admin only), and flight bookings with real-time seat updates and email notifications.

---

## 📁 Project Structure

```
booking-app/
├── index.js                        # Entry point — Express + Socket.IO server setup
├── .env                            # Environment variables
├── package.json                    # Dependencies and scripts
├── uploads/                        # Uploaded avatar & flight images
└── src/
    ├── config/
    │   └── mongooseConfig.js       # Mongoose connection using DB_URL from .env
    ├── error-handler/
    │   └── applicationError.js     # Custom ApplicationError class
    ├── middlewares/
    │   ├── jwt.middleware.js       # JWT auth (jwtAuth) + isAdmin role check
    │   └── fileUpload.middleware.js# Multer file upload (avatar/flight image) middleware
    ├── services/
    │   └── email.service.js        # Nodemailer email templates and sender functions
    └── features/
        ├── auth/
        │   ├── auth.controller.js  # Register / login / logout handlers
        │   └── auth.routes.js      # Express routes for /api/auth (with rate limiting)
        ├── user/
        │   ├── user.schema.js      # Mongoose schema for User
        │   ├── user.model.js       # Plain JS model class
        │   ├── user.repository.js  # DB operations for User
        │   ├── user.controller.js  # Request handlers for User
        │   └── user.routes.js      # Express routes for /api/users
        ├── flight/
        │   ├── flight.schema.js    # Mongoose schema for Flight
        │   ├── flight.model.js     # Plain JS model class
        │   ├── flight.repository.js# DB operations for Flight (compiles FlightModel)
        │   ├── flight.controller.js# Request handlers for Flight
        │   └── flight.routes.js    # Express routes for /api/flights
        └── booking/
            ├── booking.schema.js   # Mongoose schema for Booking
            ├── booking.model.js    # Compiles BookingModel from schema
            ├── booking.repository.js# DB operations for Booking
            ├── booking.controller.js# Request handlers for Booking
            └── booking.routes.js   # Express routes for /api/bookings
```

---

## ⚙️ Dependencies

| Package              | Version | Purpose                                                     |
| -------------------- | ------- | ----------------------------------------------------------- |
| `express`            | ^5.2.1  | Web framework and routing                                   |
| `mongoose`           | ^9.7.2  | MongoDB ODM (schemas, models, queries)                      |
| `mongodb`            | ^7.3.0  | Native MongoDB driver (peer dep of mongoose)                |
| `dotenv`             | ^16.4.5 | Load environment variables from `.env`                      |
| `bcrypt`             | ^6.0.0  | Hash and compare user passwords                             |
| `jsonwebtoken`       | ^9.0.3  | Sign and verify JWT tokens                                  |
| `multer`             | ^2.2.0  | Handle file uploads (avatar & flight images)                |
| `socket.io`          | ^4.8.3  | Real-time seat availability via WebSockets                  |
| `cors`               | ^2.8.5  | Cross-Origin Resource Sharing for frontend access           |
| `nodemailer`         | ^6.x.x  | Email notifications for booking confirmation & cancellation |
| `express-rate-limit` | ^7.x.x  | Rate limiting on login route (brute-force protection)       |
| `nodemon` _(dev)_    | ^3.0.2  | Auto-restart server on file change                          |

---

## 🚀 Setup & Running

```bash
# 1. Install dependencies
npm install

# 2. Create .env file with the following variables
DB_URL=mongodb://127.0.0.1:27017/bookingDB
JWT_SECRET=your_jwt_secret_here
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16_char_app_password
EMAIL_FROM=FlightBooker <your_gmail@gmail.com>

# 3. Start MongoDB (in a separate terminal)
mongod

# 4. Start server (development with auto-reload)
npm run dev

# 5. Start server (production)
npm start
```

Server runs on **http://localhost:3000**

> **Email setup:** Generate a Gmail App Password at  
> Google Account → Security → 2-Step Verification → App Passwords  
> Use that 16-character password as `EMAIL_PASS` (not your real Gmail password).  
> If email credentials are not set, bookings still work — emails are non-blocking.

---

## 🔐 Authentication

The API uses **JWT (JSON Web Token)** for authentication, issued via `/api/auth` routes.

### How it works

1. Register via `POST /api/auth/register`
2. Login via `POST /api/auth/login` → receive a `token` in the response body, also set as an `httpOnly` cookie (`jwtToken`)
3. Pass the token in every protected request header:

```
Authorization: Bearer <your_token>
```

### Token payload

```json
{
  "userID": "<mongodb_object_id>",
  "email": "user@example.com",
  "role": "admin | user"
}
```

Tokens expire after **1 hour**.

### Admin-only routes

Routes requiring admin access go through **`isAdmin` middleware** (in `jwt.middleware.js`), applied after `jwtAuth`.
If `role !== "admin"` → `403 Access denied. Admins only.`

### Rate limiting

Login route is protected against brute-force attacks:

- Max **5 attempts** per IP per **15 minutes**
- Exceeding the limit returns `429 Too Many Requests`:

```json
{
  "success": false,
  "message": "Too many login attempts. Please try again after 15 minutes."
}
```

---

## 📌 API Endpoints

### 🔑 Auth Routes — `/api/auth`

| Method | Route       | Auth      | Description                                  |
| ------ | ----------- | --------- | -------------------------------------------- |
| `POST` | `/register` | ❌ Public | Register a new user                          |
| `POST` | `/login`    | ❌ Public | Login, issue JWT token, set cookie & session |
| `POST` | `/logout`   | ❌ Public | Clear auth cookie & destroy session          |

#### Register request body

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123",
  "role": "user",
  "profilePicture": "https://i.pravatar.cc/150",
  "gender": "male"
}
```

#### Login response

```json
{
  "success": true,
  "message": "Login successfully",
  "token": "eyJhbGci...",
  "role": "user"
}
```

---

### 👤 User Routes — `/api/users`

| Method | Route      | Auth   | Description                                                      |
| ------ | ---------- | ------ | ---------------------------------------------------------------- |
| `GET`  | `/`        | ✅ JWT | Fetch the logged-in user's details (from JWT info)               |
| `POST` | `/profile` | ✅ JWT | Update profile fields and/or upload avatar (multipart/form-data) |

#### Update profile request

`Content-Type: multipart/form-data`

- Text fields: `name`, `email`, `gender`, etc.
- Optional file field: `avatar`

---

### ✈️ Flight Routes — `/api/flights`

| Method   | Route  | Auth      | Description                                                        |
| -------- | ------ | --------- | ------------------------------------------------------------------ |
| `GET`    | `/`    | ❌ Public | Get all flights (supports filtering, pagination, sorting)          |
| `GET`    | `/:id` | ❌ Public | Get flight by ID                                                   |
| `POST`   | `/`    | 🔐 Admin  | Create a new flight (accepts `image` file via multipart/form-data) |
| `PUT`    | `/:id` | 🔐 Admin  | Update a flight                                                    |
| `DELETE` | `/:id` | 🔐 Admin  | Delete a flight                                                    |

#### GET `/api/flights` query parameters

| Param           | Type   | Description                                                  |
| --------------- | ------ | ------------------------------------------------------------ |
| `departureCity` | String | Filter by departure city (case-insensitive)                  |
| `arrivalCity`   | String | Filter by arrival city (case-insensitive)                    |
| `departureDate` | String | Filter by departure date                                     |
| `flightClass`   | String | Filter by class: `Economy`, `Business`, `First`              |
| `page`          | Number | Page number (default: 1)                                     |
| `limit`         | Number | Results per page (default: 6)                                |
| `sortBy`        | String | Field to sort by: `price`, `availableSeats`, `departureDate` |
| `order`         | String | Sort direction: `asc` or `desc`                              |

#### Create flight request body

`Content-Type: multipart/form-data`

```json
{
  "flightNumber": "AI-202",
  "airline": "Air India",
  "departureCity": "Delhi",
  "arrivalCity": "Mumbai",
  "departureDate": "2026-07-10",
  "arrivalDate": "2026-07-10",
  "price": 4500,
  "availableSeats": 180,
  "flightClass": "Economy"
}
```

Plus an optional `image` file field (flight/airline logo).
`flightClass` must be one of `"Economy"`, `"Business"`, `"First"`.

---

### 🎫 Booking Routes — `/api/bookings`

All booking routes require JWT authentication.

| Method | Route         | Auth     | Description                                                     |
| ------ | ------------- | -------- | --------------------------------------------------------------- |
| `POST` | `/`           | ✅ JWT   | Create a new booking (decrements available seats on the flight) |
| `GET`  | `/:id`        | ✅ JWT   | Get booking by ID                                               |
| `PUT`  | `/:id`        | ✅ JWT   | Update booking details (passenger info or flight changes)       |
| `PUT`  | `/:id/cancel` | 🔐 Admin | Cancel booking, restore seats, and process refund               |

#### Create booking request body

```json
{
  "flightId": "<flight_object_id>",
  "passengerList": [
    { "name": "Jane Doe", "age": 29, "gender": "female" },
    { "name": "John Doe", "age": 31, "gender": "male" }
  ]
}
```

`totalPassengers` is derived server-side from `passengerList` length.

#### Booking status values

- `"Booked"` — default on creation
- `"Cancelled"` — after an admin calls `PUT /:id/cancel`

#### Email notifications

- **Booking confirmation** email is sent automatically to the user on successful booking
- **Cancellation + refund** email is sent automatically when admin cancels a booking

---

## 🗄️ Database Schemas

### User Schema

| Field            | Type   | Notes                            |
| ---------------- | ------ | -------------------------------- |
| `name`           | String | Max 25 chars                     |
| `email`          | String | Unique, required, validated      |
| `password`       | String | Hashed with bcrypt               |
| `role`           | String | `"user"` (default) or `"admin"`  |
| `profilePicture` | String | Required                         |
| `gender`         | String | Required                         |
| `avatar`         | String | Uploaded file path, default `""` |
| `createdAt`      | String | Auto timestamp                   |

### Flight Schema

| Field            | Type   | Notes                                   |
| ---------------- | ------ | --------------------------------------- |
| `flightNumber`   | String | Required                                |
| `airline`        | String | Required                                |
| `departureCity`  | String | Required                                |
| `arrivalCity`    | String | Required                                |
| `departureDate`  | String | Defaults to current date                |
| `arrivalDate`    | String | Defaults to current date                |
| `price`          | Number | Required                                |
| `availableSeats` | Number | Required, min 0                         |
| `flightClass`    | String | `"Economy"`, `"Business"`, or `"First"` |
| `image`          | String | Uploaded flight/airline logo path       |

### Booking Schema

| Field             | Type     | Notes                                 |
| ----------------- | -------- | ------------------------------------- |
| `flight`          | ObjectId | Ref → Flight, required                |
| `user`            | ObjectId | Ref → User, required                  |
| `passengerList`   | Array    | `{ name, age, gender }` per passenger |
| `totalPassengers` | Number   | Required                              |
| `bookingStatus`   | String   | `"Booked"` (default) or `"Cancelled"` |
| `createdAt`       | Date     | Auto (Mongoose timestamps)            |
| `updatedAt`       | Date     | Auto (Mongoose timestamps)            |

---

## 🏗️ Code Organization Pattern

Every feature follows the same **5-layer pattern**:

```
schema.js       → Mongoose schema (DB structure + validation rules)
model.js        → Plain JS class (data shape for controller layer)
repository.js   → All DB queries (create, find, update, delete)
controller.js   → HTTP logic (req/res handling, calls repository)
routes.js       → Route definitions (URL → middleware → controller)
```

This separation ensures:

- **Schema** owns validation rules
- **Repository** owns all database access — easy to swap DB later
- **Controller** owns HTTP concerns only — no raw DB calls
- **Routes** own URL structure and middleware chain

---

## 🛡️ Error Handling

- `ApplicationError` (custom class) is thrown from repositories with a status code
- Global error handler in `index.js` catches all `next(err)` calls and returns:

```json
{
  "success": false,
  "message": "Error description"
}
```

| Status | Meaning                                 |
| ------ | --------------------------------------- |
| `201`  | Resource created                        |
| `200`  | Success                                 |
| `400`  | Bad request / wrong credentials         |
| `401`  | No token / invalid token                |
| `403`  | Forbidden (not admin)                   |
| `404`  | Resource not found                      |
| `429`  | Too many requests (rate limit exceeded) |
| `500`  | Server / database error                 |

---

## 🔌 Real-time Seat Availability — Socket.IO

The server uses Socket.IO to push live seat availability updates to all connected clients instantly — no page refresh needed.

### How it works

When a booking is created or cancelled, the server emits a `seats-updated` event to all clients watching that specific flight room. Clients receive the new seat count in real time.

### Events

| Event           | Direction       | Payload                        | Description                                          |
| --------------- | --------------- | ------------------------------ | ---------------------------------------------------- |
| `join-flight`   | Client → Server | `flightId`                     | Subscribe to seat updates for a specific flight      |
| `leave-flight`  | Client → Server | `flightId`                     | Unsubscribe from a flight room                       |
| `seats-updated` | Server → Client | `{ flightId, availableSeats }` | Emitted when seats change on booking or cancellation |

### When `seats-updated` is emitted

- ✅ After a successful **booking** — available seats decrease by passenger count
- ✅ After a successful **cancellation** — available seats restore back to original

### How to Test

**Step 1 — Start the server**

```
npm run dev
```

**Step 2 — Open test page in two browser tabs**

```
Tab 1 → http://localhost:3000/test.html
Tab 2 → http://localhost:3000/test.html
```

Both tabs should show:

```
Status: Connected ✅ — <socket_id>
```

**Step 3 — Get a flight ID**

```
GET http://localhost:3000/api/flights
```

Copy any `_id` from the response.

**Step 4 — Join the flight room in both tabs**

```
Paste the flight ID into the input box
Click "Watch This Flight"
```

Both tabs show:

```
Joined room: <flight_id>
```

**Step 5 — Make a booking via Postman**

```json
POST http://localhost:3000/api/bookings
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "flightId": "<flight_id>",
  "passengerList": [
    { "name": "Vishal", "age": 25, "gender": "male" }
  ]
}
```

**Step 6 — Watch both tabs update instantly**

Both tabs show without any page refresh:

```
🔴 SEATS UPDATED to: 99
Available Seats: 99
```

**Step 7 — Cancel booking via Postman (admin token)**

```
PUT http://localhost:3000/api/bookings/<booking_id>/cancel
Authorization: Bearer <admin_token>
```

Both tabs instantly show:

```
🔴 SEATS UPDATED to: 100
Available Seats: 100
```

Seats restored in real time ✅

---

## 🧪 Testing with Postman

| Method   | URL                                                  | Auth         | Body                                          |
| -------- | ---------------------------------------------------- | ------------ | --------------------------------------------- |
| `POST`   | `/api/auth/register`                                 | None         | `{name, email, password, role, gender}`       |
| `POST`   | `/api/auth/login`                                    | None         | `{email, password}`                           |
| `GET`    | `/api/users/`                                        | Bearer token | —                                             |
| `POST`   | `/api/users/profile`                                 | Bearer token | form-data `{name, avatar file}`               |
| `GET`    | `/api/flights?page=1&limit=6&sortBy=price&order=asc` | None         | —                                             |
| `POST`   | `/api/flights`                                       | Admin token  | `{flightNumber, airline, departureCity, ...}` |
| `PUT`    | `/api/flights/:id`                                   | Admin token  | any flight fields                             |
| `DELETE` | `/api/flights/:id`                                   | Admin token  | —                                             |
| `POST`   | `/api/bookings`                                      | Bearer token | `{flightId, passengerList}`                   |
| `GET`    | `/api/bookings/:id`                                  | Bearer token | —                                             |
| `PUT`    | `/api/bookings/:id`                                  | Bearer token | `{passengerList}`                             |
| `PUT`    | `/api/bookings/:id/cancel`                           | Admin token  | —                                             |

## API Testing

Import the Postman collection:

postman/Flight-Booking-API.postman_collection.json

Set the `base_url` and `token` variables before testing.
