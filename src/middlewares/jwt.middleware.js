import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

const jwtAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "No token. Please Login",
    });
  }

  // Strip "Bearer " prefix if present
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userID = payload.userID;
    req.email = payload.email;
    req.role = payload.role;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// Inline admin check — no separate roleAuth middleware needed
export const isAdmin = (req, res, next) => {
  if (req.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admins only.",
    });
  }
  next();
};

export default jwtAuth;
