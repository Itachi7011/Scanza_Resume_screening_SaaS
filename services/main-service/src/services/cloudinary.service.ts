import cloudinary from "../config/cloudinary";
import { Readable } from "stream";

interface UploadResult {
  url: string;
  publicId: string;
}

/**
 * Resumes are uploaded as Cloudinary "raw" resources (not images) since
 * they're PDFs/DOCX files, not something Cloudinary needs to transform.
 */
export function uploadResumeBuffer(buffer: Buffer, originalFileName: string): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "scanza/resumes",
        public_id: `${Date.now()}-${originalFileName.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`,
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Cloudinary upload failed with no result."));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    Readable.from(buffer).pipe(uploadStream);
  });
}

export async function deleteResumeFile(publicId: string) {
  await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
}
