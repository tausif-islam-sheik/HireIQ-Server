import { Response } from "express";
import { applicationService } from "../services/application.service";
import { AuthRequest } from "../types";
import { logger } from "../lib/logger";
import { ApplicationStatus } from "@prisma/client";

export const applicationController = {
  async apply(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated", data: null });
        return;
      }

      const { jobId, coverLetter } = req.body;

      if (!jobId) {
        res.status(400).json({ success: false, message: "Job ID is required", data: null });
        return;
      }

      const application = await applicationService.apply({
        jobId,
        candidateId: req.user.userId,
        coverLetter,
      });

      res.status(201).json({
        success: true,
        message: "Application submitted successfully",
        data: application,
      });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      logger.error("Apply error:", err.message);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Failed to submit application",
        data: null,
      });
    }
  },

  async getMyApplications(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated", data: null });
        return;
      }

      const { page = "1", limit = "10", status, sortBy, sortOrder } = req.query as Record<string, string>;

      const result = await applicationService.getMyApplications(req.user.userId, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        status,
        sortBy,
        sortOrder: sortOrder as "asc" | "desc",
      });

      res.json({ success: true, message: "Applications retrieved", data: result });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      logger.error("Get my applications error:", err.message);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Failed to retrieve applications",
        data: null,
      });
    }
  },

  async getJobApplicants(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated", data: null });
        return;
      }

      const { jobId } = req.params;
      const { page = "1", limit = "10", status, sortBy, sortOrder } = req.query as Record<string, string>;

      const result = await applicationService.getJobApplicants(jobId as string, req.user.userId, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        status,
        sortBy,
        sortOrder: sortOrder as "asc" | "desc",
      });

      res.json({ success: true, message: "Applicants retrieved", data: result });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      logger.error("Get job applicants error:", err.message);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Failed to retrieve applicants",
        data: null,
      });
    }
  },

  async updateStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated", data: null });
        return;
      }

      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = Object.values(ApplicationStatus);
      if (!status || !validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
          data: null,
        });
        return;
      }

      const updated = await applicationService.updateStatus(id as string, req.user.userId, status);

      res.json({
        success: true,
        message: "Application status updated",
        data: updated,
      });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      logger.error("Update status error:", err.message);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Failed to update status",
        data: null,
      });
    }
  },

  async withdraw(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated", data: null });
        return;
      }

      const { id } = req.params;
      await applicationService.withdraw(id as string, req.user.userId);

      res.json({ success: true, message: "Application withdrawn", data: null });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      logger.error("Withdraw error:", err.message);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Failed to withdraw application",
        data: null,
      });
    }
  },

  async getStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated", data: null });
        return;
      }

      const stats = await applicationService.getStats(req.user.userId, req.user.role);

      res.json({ success: true, message: "Stats retrieved", data: stats });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      logger.error("Get stats error:", err.message);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Failed to retrieve stats",
        data: null,
      });
    }
  },

  async getRecruiterApplications(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated", data: null });
        return;
      }

      const { jobId } = req.query as { jobId?: string };
      const result = await applicationService.getRecruiterApplications(req.user.userId, jobId);

      res.json({ success: true, message: "Applications retrieved", data: result });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      logger.error("Get recruiter applications error:", err.message);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Failed to retrieve applications",
        data: null,
      });
    }
  },
};
