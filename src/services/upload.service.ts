import multer from "multer";
import path from "path";
import { uploadToCloudinary, deleteFromCloudinary, UploadResult } from "../lib/cloudinary";
import { logger } from "../lib/logger";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(process.cwd(), "uploads"));
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const uploadService = {
  async uploadFile(filePath: string, folder: string = "hireiq"): Promise<UploadResult> {
    const result = await uploadToCloudinary(filePath, folder);
    logger.info(`File uploaded: ${result.url}`);
    return result;
  },
  async deleteFile(publicId: string): Promise<void> {
    await deleteFromCloudinary(publicId);
    logger.info(`File deleted: ${publicId}`);
  },
};
