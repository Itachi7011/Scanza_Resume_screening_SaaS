import multer from "multer";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
]);

export const resumeUpload = multer({
  storage: multer.memoryStorage(), // we forward the buffer to Cloudinary + resume-worker, never touch disk
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new AppError("Only PDF and DOCX files are supported.", 415));
    }
    cb(null, true);
  },
});
