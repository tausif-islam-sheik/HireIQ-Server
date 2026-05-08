import { Response } from "express";
import { jobService } from "../services/job.service";
import { AuthRequest } from "../types";
import { logger } from "../lib/logger";

export const jobController = {
  async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        page = "1",
        limit = "10",
        search,
        category,
        type,
        location,
        salary,
        experience,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query as Record<string, string>;

      const result = await jobService.list({
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        search,
        category,
        type,
        location,
        salary,
        experience,
        sortBy,
        sortOrder: sortOrder as "asc" | "desc",
      });

      res.json({
        success: true,
        message: "Jobs retrieved successfully",
        data: result,
      });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      logger.error("List jobs error:", err.message);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Failed to retrieve jobs",
        data: null,
      });
    }
  },

  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const job = await jobService.getById(id);

      res.json({
        success: true,
        message: "Job retrieved successfully",
        data: job,
      });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      logger.error("Get job error:", err.message);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Failed to retrieve job",
        data: null,
      });
    }
  },

  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated", data: null });
        return;
      }

      const { title, description, requirements, skills, salary, location, type, category, experience, companyId } = req.body;

      if (!title || !description || !location || !category || !experience || !companyId) {
        res.status(400).json({
          success: false,
          message: "Title, description, location, category, experience, and companyId are required",
          data: null,
        });
        return;
      }

      const job = await jobService.create({
        title,
        description,
        requirements: requirements || [],
        skills: skills || [],
        salary,
        location,
        type: type || "FULL_TIME",
        category,
        experience,
        companyId,
      });

      res.status(201).json({
        success: true,
        message: "Job created successfully",
        data: job,
      });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      logger.error("Create job error:", err.message);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Failed to create job",
        data: null,
      });
    }
  },

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated", data: null });
        return;
      }

      const { id } = req.params;
      const updated = await jobService.update(id, req.user.userId, req.body);

      res.json({
        success: true,
        message: "Job updated successfully",
        data: updated,
      });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      logger.error("Update job error:", err.message);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Failed to update job",
        data: null,
      });
    }
  },

  async remove(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated", data: null });
        return;
      }

      const { id } = req.params;
      await jobService.remove(id, req.user.userId);

      res.json({
        success: true,
        message: "Job deleted successfully",
        data: null,
      });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      logger.error("Delete job error:", err.message);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Failed to delete job",
        data: null,
      });
    }
  },

  async getCategories(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const categories = await jobService.getCategories();

      res.json({
        success: true,
        message: "Categories retrieved successfully",
        data: categories,
      });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      logger.error("Get categories error:", err.message);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Failed to retrieve categories",
        data: null,
      });
    }
  },

  async getStats(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const stats = await jobService.getStats();

      res.json({
        success: true,
        message: "Stats retrieved successfully",
        data: stats,
      });
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

  async getMyJobs(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated", data: null });
        return;
      }

      const jobs = await jobService.getMyJobs(req.user.userId);

      res.json({
        success: true,
        message: "Jobs retrieved successfully",
        data: jobs,
      });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      logger.error("Get my jobs error:", err.message);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Failed to retrieve jobs",
        data: null,
      });
    }
  },
};
