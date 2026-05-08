import { Response } from "express";
import { AuthRequest } from "../types";
import { savedJobService } from "../services/savedJob.service";
import { logger } from "../lib/logger";

export const savedJobController = {
  async saveJob(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated", data: null });
        return;
      }

      const jobId = req.params.jobId as string;
      if (!jobId) {
        res.status(400).json({ success: false, message: "Job ID is required", data: null });
        return;
      }

      const savedJob = await savedJobService.saveJob(req.user.userId, jobId);

      res.status(201).json({
        success: true,
        message: "Job saved successfully",
        data: savedJob,
      });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      logger.error("Save job error:", err.message);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Failed to save job",
        data: null,
      });
    }
  },

  async unsaveJob(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated", data: null });
        return;
      }

      const jobId = req.params.jobId as string;
      if (!jobId) {
        res.status(400).json({ success: false, message: "Job ID is required", data: null });
        return;
      }

      await savedJobService.unsaveJob(req.user.userId, jobId);

      res.json({
        success: true,
        message: "Job unsaved successfully",
        data: null,
      });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      logger.error("Unsave job error:", err.message);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Failed to unsave job",
        data: null,
      });
    }
  },

  async getSavedJobs(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated", data: null });
        return;
      }

      const savedJobs = await savedJobService.getSavedJobs(req.user.userId);

      res.json({
        success: true,
        message: "Saved jobs retrieved successfully",
        data: savedJobs,
      });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      logger.error("Get saved jobs error:", err.message);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Failed to get saved jobs",
        data: null,
      });
    }
  },

  async checkSavedJob(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated", data: null });
        return;
      }

      const jobId = req.params.jobId as string;
      if (!jobId) {
        res.status(400).json({ success: false, message: "Job ID is required", data: null });
        return;
      }

      const isSaved = await savedJobService.isJobSaved(req.user.userId, jobId);

      res.json({
        success: true,
        message: "Saved job status retrieved",
        data: { isSaved },
      });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      logger.error("Check saved job error:", err.message);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Failed to check saved job",
        data: null,
      });
    }
  },
};
