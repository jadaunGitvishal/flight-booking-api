import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Avatar uploads go to uploads/
    // Flight image uploads go to uploads/flights/
    if (req.baseUrl.includes("flights")) {
      cb(null, "uploads/flights/");
    } else {
      cb(null, "uploads/");
    }
  },
  filename: (req, file, cb) => {
    // Unique filename — timestamp + original name (no spaces)
    const uniqueName =
      Date.now() + "-" + file.originalname.replace(/\s+/g, "-");
    cb(null, uniqueName);
  },
});

// File type filter — only images allowed
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // accept file
  } else {
    cb(
      new Error("Only image files are allowed. Use .jpg, .jpeg, .png or .webp"),
      false, // reject file
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

export default upload;
