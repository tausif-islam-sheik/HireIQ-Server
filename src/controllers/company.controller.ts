import { Response } from "express";
import prisma from "../lib/prisma";
import { AuthRequest } from "../types";
import { logger } from "../lib/logger";

export const companyController = {
  async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = "1", limit = "10", search, industry } = req.query as Record<string, string>;

      const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const take = parseInt(limit, 10);

      const where: Record<string, unknown> = {};
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { industry: { contains: search, mode: "insensitive" } },
          { location: { contains: search, mode: "insensitive" } },
        ];
      }
      if (industry) {
        where.industry = { contains: industry, mode: "insensitive" };
      }

      const [companies, total] = await Promise.all([
        prisma.company.findMany({
          where,
          include: {
            _count: { select: { jobs: true } },
            recruiter: { select: { name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take,
        }),
        prisma.company.count({ where }),
      ]);

      res.json({
        success: true,
        message: "Companies retrieved",
        data: {
          companies,
          pagination: {
            page: parseInt(page, 10),
            limit: take,
            total,
            totalPages: Math.ceil(total / take),
          },
        },
      });
    } catch (error) {
      const err = error as Error;
      logger.error("List companies error:", err.message);
      res.status(500).json({ success: false, message: "Failed to retrieve companies", data: null });
    }
  },

  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      const company = await prisma.company.findUnique({
        where: { id },
        include: {
          jobs: {
            where: { isActive: true },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          _count: { select: { jobs: true } },
        },
      });

      if (!company) {
        res.status(404).json({ success: false, message: "Company not found", data: null });
        return;
      }

      res.json({ success: true, message: "Company retrieved", data: company });
    } catch (error) {
      const err = error as Error;
      logger.error("Get company error:", err.message);
      res.status(500).json({ success: false, message: "Failed to retrieve company", data: null });
    }
  },

  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated", data: null });
        return;
      }

      const existing = await prisma.company.findUnique({
        where: { recruiterId: req.user.userId },
      });

      if (existing) {
        res.status(409).json({ success: false, message: "You already have a company profile", data: null });
        return;
      }

      const { name, logo, website, description, location, industry, size } = req.body;

      if (!name) {
        res.status(400).json({ success: false, message: "Company name is required", data: null });
        return;
      }

      const company = await prisma.company.create({
        data: {
          name,
          logo,
          website,
          description,
          location,
          industry,
          size,
          recruiterId: req.user.userId,
        },
      });

      res.status(201).json({ success: true, message: "Company created", data: company });
    } catch (error) {
      const err = error as Error;
      logger.error("Create company error:", err.message);
      res.status(500).json({ success: false, message: "Failed to create company", data: null });
    }
  },

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated", data: null });
        return;
      }

      const id = req.params.id as string;

      const company = await prisma.company.findUnique({ where: { id } });
      if (!company) {
        res.status(404).json({ success: false, message: "Company not found", data: null });
        return;
      }

      if (company.recruiterId !== req.user.userId) {
        res.status(403).json({ success: false, message: "Not authorized", data: null });
        return;
      }

      const { name, logo, website, description, location, industry, size } = req.body;

      const updated = await prisma.company.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(logo !== undefined && { logo }),
          ...(website !== undefined && { website }),
          ...(description !== undefined && { description }),
          ...(location !== undefined && { location }),
          ...(industry !== undefined && { industry }),
          ...(size !== undefined && { size }),
        },
      });

      res.json({ success: true, message: "Company updated", data: updated });
    } catch (error) {
      const err = error as Error;
      logger.error("Update company error:", err.message);
      res.status(500).json({ success: false, message: "Failed to update company", data: null });
    }
  },

  async getMyCompany(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated", data: null });
        return;
      }

      const company = await prisma.company.findUnique({
        where: { recruiterId: req.user.userId },
        include: {
          _count: { select: { jobs: true } },
        },
      });

      res.json({
        success: true,
        message: company ? "Company retrieved" : "No company found",
        data: company,
      });
    } catch (error) {
      const err = error as Error;
      logger.error("Get my company error:", err.message);
      res.status(500).json({ success: false, message: "Failed to retrieve company", data: null });
    }
  },

  async verify(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated", data: null });
        return;
      }

      const id = req.params.id as string;
      const { isVerified } = req.body;

      const company = await prisma.company.findUnique({ where: { id } });
      if (!company) {
        res.status(404).json({ success: false, message: "Company not found", data: null });
        return;
      }

      const updated = await prisma.company.update({
        where: { id },
        data: { isVerified: isVerified ?? (company as { isVerified?: boolean }).isVerified },
        select: { id: true, name: true, isVerified: true },
      });

      res.json({ success: true, message: "Company verification updated", data: updated });
    } catch (error) {
      const err = error as Error;
      logger.error("Verify company error:", err.message);
      res.status(500).json({ success: false, message: "Failed to update verification", data: null });
    }
  },
};
