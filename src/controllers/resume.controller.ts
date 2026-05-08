import { Response } from "express";
import prisma from "../lib/prisma";
import { AuthRequest } from "../types";
import { logger } from "../lib/logger";
import { uploadToCloudinary } from "../lib/cloudinary";
import fs from "fs";

export const resumeController = {
  async upload(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated", data: null });
        return;
      }

      let fileUrl: string;
      let parsedData: any = null;

      // Handle file upload (from multer)
      if (req.file) {
        // Upload to Cloudinary
        const result = await uploadToCloudinary(req.file.path, "hireiq/resumes");
        fileUrl = result.url;
        
        // Clean up temp file
        fs.unlinkSync(req.file.path);
        
        // TODO: Add AI parsing here if needed
        // For now, we'll just store basic file info
        parsedData = {
          filename: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          uploadedAt: new Date().toISOString(),
        };
      } else {
        // Handle direct URL upload (backwards compatibility)
        const { fileUrl: bodyFileUrl, parsedData: bodyParsedData } = req.body;
        if (!bodyFileUrl) {
          res.status(400).json({ success: false, message: "File is required", data: null });
          return;
        }
        fileUrl = bodyFileUrl;
        parsedData = bodyParsedData || null;
      }

      const existing = await prisma.resume.findUnique({
        where: { userId: req.user.userId },
      });

      let resume;
      if (existing) {
        resume = await prisma.resume.update({
          where: { userId: req.user.userId },
          data: { fileUrl, parsedData: parsedData || existing.parsedData },
        });
      } else {
        resume = await prisma.resume.create({
          data: {
            fileUrl,
            parsedData,
            userId: req.user.userId,
          },
        });
      }

      res.status(existing ? 200 : 201).json({
        success: true,
        message: existing ? "Resume updated" : "Resume uploaded",
        data: resume,
      });
    } catch (error) {
      const err = error as Error;
      logger.error("Upload resume error:", err.message);
      res.status(500).json({ success: false, message: "Failed to upload resume", data: null });
    }
  },

  async getMyResume(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated", data: null });
        return;
      }

      const resume = await prisma.resume.findUnique({
        where: { userId: req.user.userId },
      });

      res.json({
        success: true,
        message: resume ? "Resume retrieved" : "No resume found",
        data: resume,
      });
    } catch (error) {
      const err = error as Error;
      logger.error("Get resume error:", err.message);
      res.status(500).json({ success: false, message: "Failed to retrieve resume", data: null });
    }
  },

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated", data: null });
        return;
      }

      const resume = await prisma.resume.findUnique({
        where: { userId: req.user.userId },
      });

      if (!resume) {
        res.status(404).json({ success: false, message: "No resume found", data: null });
        return;
      }

      await prisma.resume.delete({ where: { userId: req.user.userId } });

      res.json({ success: true, message: "Resume deleted", data: null });
    } catch (error) {
      const err = error as Error;
      logger.error("Delete resume error:", err.message);
      res.status(500).json({ success: false, message: "Failed to delete resume", data: null });
    }
  },
};
