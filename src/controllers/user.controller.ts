import { Response } from "express";
import prisma from "../lib/prisma";
import { AuthRequest } from "../types";
import { logger } from "../lib/logger";
import bcrypt from "bcryptjs";

export const userController = {
  async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = "1", limit = "10", search, role } = req.query as Record<string, string>;

      const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const take = parseInt(limit, 10);

      const where: Record<string, unknown> = {};
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ];
      }
      if (role) {
        where.role = role;
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
            isVerified: true,
            createdAt: true,
            _count: { select: { applications: true } },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take,
        }),
        prisma.user.count({ where }),
      ]);

      res.json({
        success: true,
        message: "Users retrieved",
        data: {
          users,
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
      logger.error("List users error:", err.message);
      res.status(500).json({ success: false, message: "Failed to retrieve users", data: null });
    }
  },

  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          isVerified: true,
          createdAt: true,
          company: { select: { id: true, name: true, logo: true } },
          _count: { select: { applications: true } },
        },
      });

      if (!user) {
        res.status(404).json({ success: false, message: "User not found", data: null });
        return;
      }

      res.json({ success: true, message: "User retrieved", data: user });
    } catch (error) {
      const err = error as Error;
      logger.error("Get user error:", err.message);
      res.status(500).json({ success: false, message: "Failed to retrieve user", data: null });
    }
  },

  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated", data: null });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          isVerified: true,
          phone: true,
          location: true,
          dateOfBirth: true,
          bio: true,
          jobTitle: true,
          experienceLevel: true,
          availability: true,
          expectedSalary: true,
          skills: true,
          linkedin: true,
          github: true,
          portfolio: true,
          createdAt: true,
          updatedAt: true,
          company: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
        },
      });

      if (!user) {
        res.status(404).json({ success: false, message: "User not found", data: null });
        return;
      }

      res.json({ success: true, message: "Profile retrieved", data: user });
    } catch (error) {
      const err = error as Error;
      logger.error("Get profile error:", err.message);
      res.status(500).json({ success: false, message: "Failed to get profile", data: null });
    }
  },

  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated", data: null });
        return;
      }

      const {
        name,
        avatar,
        phone,
        location,
        dateOfBirth,
        bio,
        jobTitle,
        experienceLevel,
        availability,
        expectedSalary,
        skills,
        linkedin,
        github,
        portfolio,
      } = req.body;

      const updated = await prisma.user.update({
        where: { id: req.user.userId },
        data: {
          ...(name !== undefined && { name }),
          ...(avatar !== undefined && { avatar }),
          ...(phone !== undefined && { phone }),
          ...(location !== undefined && { location }),
          ...(dateOfBirth !== undefined && { dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null }),
          ...(bio !== undefined && { bio }),
          ...(jobTitle !== undefined && { jobTitle }),
          ...(experienceLevel !== undefined && { experienceLevel }),
          ...(availability !== undefined && { availability }),
          ...(expectedSalary !== undefined && { expectedSalary }),
          ...(skills !== undefined && { skills }),
          ...(linkedin !== undefined && { linkedin }),
          ...(github !== undefined && { github }),
          ...(portfolio !== undefined && { portfolio }),
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          isVerified: true,
          phone: true,
          location: true,
          dateOfBirth: true,
          bio: true,
          jobTitle: true,
          experienceLevel: true,
          availability: true,
          expectedSalary: true,
          skills: true,
          linkedin: true,
          github: true,
          portfolio: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.json({ success: true, message: "Profile updated", data: updated });
    } catch (error) {
      const err = error as Error;
      logger.error("Update profile error:", err.message);
      logger.error("Full error:", error);
      res.status(500).json({ success: false, message: `Failed to update profile: ${err.message}`, data: null });
    }
  },

  async changePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated", data: null });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          message: "Current and new password are required",
          data: null,
        });
        return;
      }

      const user = await prisma.user.findUnique({ where: { id: req.user.userId } });

      if (!user || !user.password) {
        res.status(400).json({ success: false, message: "Password change not available", data: null });
        return;
      }

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        res.status(400).json({ success: false, message: "Current password is incorrect", data: null });
        return;
      }

      const hashed = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: { id: req.user.userId },
        data: { password: hashed },
      });

      res.json({ success: true, message: "Password changed successfully", data: null });
    } catch (error) {
      const err = error as Error;
      logger.error("Change password error:", err.message);
      res.status(500).json({ success: false, message: "Failed to change password", data: null });
    }
  },

  async getNotifications(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated", data: null });
        return;
      }

      const notifications = await prisma.notification.findMany({
        where: { userId: req.user.userId },
        orderBy: { createdAt: "desc" },
        take: 20,
      });

      const unreadCount = await prisma.notification.count({
        where: { userId: req.user.userId, isRead: false },
      });

      res.json({
        success: true,
        message: "Notifications retrieved",
        data: { notifications, unreadCount },
      });
    } catch (error) {
      const err = error as Error;
      logger.error("Get notifications error:", err.message);
      res.status(500).json({ success: false, message: "Failed to get notifications", data: null });
    }
  },

  async markNotificationsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated", data: null });
        return;
      }

      await prisma.notification.updateMany({
        where: { userId: req.user.userId, isRead: false },
        data: { isRead: true },
      });

      res.json({ success: true, message: "Notifications marked as read", data: null });
    } catch (error) {
      const err = error as Error;
      logger.error("Mark notifications error:", err.message);
      res.status(500).json({ success: false, message: "Failed to mark notifications", data: null });
    }
  },

  async getDashboardStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated", data: null });
        return;
      }

      const [totalUsers, totalJobs, totalApplications, totalCompanies] = await Promise.all([
        prisma.user.count(),
        prisma.job.count({ where: { isActive: true } }),
        prisma.application.count(),
        prisma.company.count(),
      ]);

      const totalHires = await prisma.application.count({ where: { status: "HIRED" } });

      const recentApplications = await prisma.application.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          candidate: { select: { name: true, avatar: true } },
          job: { select: { title: true, company: { select: { name: true } } } },
        },
      });

      const applications = await prisma.application.findMany({
        select: { createdAt: true, status: true },
        orderBy: { createdAt: "asc" }
      });
      const jobs = await prisma.job.findMany({
        select: { createdAt: true },
        orderBy: { createdAt: "asc" }
      });

      const appsByDateMap = new Map<string, number>();
      applications.forEach(app => {
        const date = app.createdAt.toISOString().split('T')[0];
        appsByDateMap.set(date, (appsByDateMap.get(date) || 0) + 1);
      });
      const applicationsByDate = Array.from(appsByDateMap.entries()).map(([date, count]) => ({ date, count }));

      const statusMap = new Map<string, number>();
      applications.forEach(app => {
        statusMap.set(app.status, (statusMap.get(app.status) || 0) + 1);
      });
      const statusDistribution = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }));

      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthlyStatsMap = new Map<string, { jobs: number, applications: number }>();
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = months[d.getMonth()];
        monthlyStatsMap.set(monthName, { jobs: 0, applications: 0 });
      }

      jobs.forEach(job => {
        const monthName = months[job.createdAt.getMonth()];
        if (monthlyStatsMap.has(monthName)) {
           monthlyStatsMap.get(monthName)!.jobs++;
        }
      });
      applications.forEach(app => {
        const monthName = months[app.createdAt.getMonth()];
        if (monthlyStatsMap.has(monthName)) {
           monthlyStatsMap.get(monthName)!.applications++;
        }
      });
      const monthlyStats = Array.from(monthlyStatsMap.entries()).map(([month, stats]) => ({
        month,
        jobs: stats.jobs,
        applications: stats.applications
      }));

      res.json({
        success: true,
        message: "Dashboard stats retrieved",
        data: {
          totalUsers,
          totalJobs,
          totalApplications,
          totalCompanies,
          totalHires,
          recentApplications,
          applicationsByDate,
          statusDistribution,
          monthlyStats
        },
      });
    } catch (error) {
      const err = error as Error;
      logger.error("Dashboard stats error:", err.message);
      res.status(500).json({ success: false, message: "Failed to get stats", data: null });
    }
  },

  async toggleStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated", data: null });
        return;
      }

      const id = req.params.id as string;
      const { isActive } = req.body;

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        res.status(404).json({ success: false, message: "User not found", data: null });
        return;
      }

      const updated = await prisma.user.update({
        where: { id },
        data: { isActive: isActive ?? !(user as { isActive?: boolean }).isActive },
        select: { id: true, name: true, email: true, isActive: true },
      });

      res.json({ success: true, message: "User status updated", data: updated });
    } catch (error) {
      const err = error as Error;
      logger.error("Toggle user status error:", err.message);
      res.status(500).json({ success: false, message: "Failed to update status", data: null });
    }
  },
};
