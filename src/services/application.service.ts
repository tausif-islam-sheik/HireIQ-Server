import prisma from "../lib/prisma";
import { ApplicationStatus, Prisma } from "@prisma/client";
import { logger } from "../lib/logger";
import { emitToUser } from "../socket/socket";

interface ApplyInput {
  jobId: string;
  candidateId: string;
  coverLetter?: string;
}

interface ListQuery {
  page: number;
  limit: number;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const applicationService = {
  async apply(input: ApplyInput) {
    const { jobId, candidateId, coverLetter } = input;

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job || !job.isActive) {
      throw Object.assign(new Error("Job not found or no longer active"), {
        statusCode: 404,
      });
    }

    const existing = await prisma.application.findUnique({
      where: { jobId_candidateId: { jobId, candidateId } },
    });

    if (existing) {
      throw Object.assign(new Error("You have already applied to this job"), {
        statusCode: 409,
      });
    }

    const application = await prisma.application.create({
      data: { jobId, candidateId, coverLetter },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: { select: { id: true, name: true, recruiterId: true } },
          },
        },
        candidate: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    // Notify recruiter
    try {
      const recruiterId = application.job.company.recruiterId;
      await prisma.notification.create({
        data: {
          type: "NEW_APPLICATION",
          title: "New Application Received",
          message: `${application.candidate.name} applied for ${application.job.title}`,
          userId: recruiterId,
        },
      });
      emitToUser(recruiterId, "notification", {
        type: "NEW_APPLICATION",
        title: "New Application Received",
        message: `${application.candidate.name} applied for ${application.job.title}`,
      });
    } catch (err) {
      logger.warn("Failed to send notification:", err);
    }

    logger.info(`Application created: ${application.id}`);
    return application;
  },

  async getMyApplications(candidateId: string, query: ListQuery) {
    const { page = 1, limit = 10, status, sortBy = "createdAt", sortOrder = "desc" } = query;

    const where: Prisma.ApplicationWhereInput = { candidateId };
    if (status) {
      where.status = status as ApplicationStatus;
    }

    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          job: {
            select: {
              id: true,
              title: true,
              location: true,
              type: true,
              salary: true,
              company: { select: { id: true, name: true, logo: true } },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.application.count({ where }),
    ]);

    return {
      applications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + applications.length < total,
      },
    };
  },

  async getJobApplicants(jobId: string, recruiterId: string, query: ListQuery) {
    const { page = 1, limit = 10, status, sortBy = "createdAt", sortOrder = "desc" } = query;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { company: { select: { recruiterId: true } } },
    });

    if (!job) {
      throw Object.assign(new Error("Job not found"), { statusCode: 404 });
    }

    if (job.company.recruiterId !== recruiterId) {
      throw Object.assign(new Error("Not authorized"), { statusCode: 403 });
    }

    const where: Prisma.ApplicationWhereInput = { jobId };
    if (status) {
      where.status = status as ApplicationStatus;
    }

    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          candidate: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              resume: { select: { id: true, fileUrl: true, aiAnalysis: true } },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.application.count({ where }),
    ]);

    return {
      applications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + applications.length < total,
      },
    };
  },

  async updateStatus(id: string, recruiterId: string, status: ApplicationStatus) {
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: {
          select: {
            title: true,
            company: { select: { recruiterId: true } },
          },
        },
      },
    });

    if (!application) {
      throw Object.assign(new Error("Application not found"), { statusCode: 404 });
    }

    if (application.job.company.recruiterId !== recruiterId) {
      throw Object.assign(new Error("Not authorized"), { statusCode: 403 });
    }

    const updated = await prisma.application.update({
      where: { id },
      data: { status },
      include: {
        candidate: { select: { id: true, name: true } },
        job: { select: { id: true, title: true } },
      },
    });

    // Notify candidate
    try {
      await prisma.notification.create({
        data: {
          type: "APPLICATION_STATUS",
          title: "Application Status Updated",
          message: `Your application for ${updated.job.title} is now ${status.toLowerCase().replace("_", " ")}`,
          userId: updated.candidate.id,
        },
      });
      emitToUser(updated.candidate.id, "notification", {
        type: "APPLICATION_STATUS",
        title: "Application Status Updated",
        message: `Your application for ${updated.job.title} is now ${status.toLowerCase().replace("_", " ")}`,
      });
    } catch (err) {
      logger.warn("Failed to send notification:", err);
    }

    return updated;
  },

  async withdraw(id: string, candidateId: string) {
    const application = await prisma.application.findUnique({
      where: { id },
    });

    if (!application) {
      throw Object.assign(new Error("Application not found"), { statusCode: 404 });
    }

    if (application.candidateId !== candidateId) {
      throw Object.assign(new Error("Not authorized"), { statusCode: 403 });
    }

    await prisma.application.delete({ where: { id } });
    logger.info(`Application withdrawn: ${id}`);
  },

  async getRecruiterApplications(recruiterId: string, jobId?: string) {
    // Get the recruiter's company
    const company = await prisma.company.findUnique({
      where: { recruiterId },
    });

    if (!company) {
      return { applications: [] };
    }

    const where: Prisma.ApplicationWhereInput = {
      job: { companyId: company.id },
    };

    if (jobId) {
      where.jobId = jobId;
    }

    const applications = await prisma.application.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            resume: { select: { id: true, fileUrl: true, aiAnalysis: true } },
          },
        },
        job: {
          select: {
            id: true,
            title: true,
            company: { select: { id: true, name: true } },
          },
        },
      },
    });

    return { applications };
  },

  async getStats(userId: string, role: string) {
    // Candidate dashboard stats
    if (role === "CANDIDATE") {
      const [
        myApplications,
        interviewCount,
        applicationsByDateRaw,
        recentApplications,
        statusStats,
      ] = await Promise.all([
        // Total applications count
        prisma.application.count({
          where: { candidateId: userId },
        }),
        // Interview count (applications with INTERVIEW status)
        prisma.application.count({
          where: { candidateId: userId, status: "INTERVIEW" },
        }),
        // Applications grouped by date (last 30 days)
        prisma.application.groupBy({
          by: ["createdAt"],
          where: { candidateId: userId },
          _count: { id: true },
          orderBy: { createdAt: "asc" },
          take: 30,
        }),
        // Recent applications (last 10)
        prisma.application.findMany({
          where: { candidateId: userId },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            job: {
              select: {
                title: true,
                company: { select: { name: true } },
              },
            },
          },
        }),
        // Status breakdown
        prisma.application.groupBy({
          by: ["status"],
          where: { candidateId: userId },
          _count: { status: true },
        }),
      ]);

      // Format applicationsByDate to group by month
      const monthMap = new Map<string, number>();
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      applicationsByDateRaw.forEach((item) => {
        const date = new Date(item.createdAt);
        const monthKey = months[date.getMonth()];
        monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + item._count.id);
      });

      const applicationsByDate = months.map((month) => ({
        date: month,
        count: monthMap.get(month) || 0,
      }));

      // Format recentApplications to match expected structure
      const formattedRecentApplications = recentApplications.map((app) => ({
        id: app.id,
        status: app.status,
        createdAt: app.createdAt.toISOString(),
        candidate: { name: "You", email: "" },
        job: app.job,
      }));

      return {
        myApplications,
        interviewCount,
        savedJobs: 0, // No saved jobs model exists yet
        applicationsByDate,
        recentApplications: formattedRecentApplications,
        statusBreakdown: statusStats.map((s) => ({ status: s.status, count: s._count.status })),
      };
    }

    // Recruiter dashboard stats
    if (role === "RECRUITER") {
      const company = await prisma.company.findUnique({
        where: { recruiterId: userId },
      });

      if (!company) {
        return {
          myJobs: 0,
          myApplications: 0,
          pendingReviews: 0,
          interviewCount: 0,
          applicationsByDate: [],
          recentApplications: [],
          statusBreakdown: [],
        };
      }

      const [
        myJobs,
        myApplications,
        pendingReviews,
        interviewCount,
        applicationsByDateRaw,
        recentApplications,
        statusStats,
      ] = await Promise.all([
        prisma.job.count({ where: { companyId: company.id, isActive: true } }),
        prisma.application.count({
          where: { job: { companyId: company.id } },
        }),
        prisma.application.count({
          where: { job: { companyId: company.id }, status: "PENDING" },
        }),
        prisma.application.count({
          where: { job: { companyId: company.id }, status: "INTERVIEW" },
        }),
        prisma.application.groupBy({
          by: ["createdAt"],
          where: { job: { companyId: company.id } },
          _count: { id: true },
          orderBy: { createdAt: "asc" },
          take: 30,
        }),
        prisma.application.findMany({
          where: { job: { companyId: company.id } },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            candidate: { select: { name: true, email: true, avatar: true } },
            job: { select: { title: true, company: { select: { name: true } } } },
          },
        }),
        prisma.application.groupBy({
          by: ["status"],
          where: { job: { companyId: company.id } },
          _count: { status: true },
        }),
      ]);

      // Format applicationsByDate
      const monthMap = new Map<string, number>();
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      applicationsByDateRaw.forEach((item) => {
        const date = new Date(item.createdAt);
        const monthKey = months[date.getMonth()];
        monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + item._count.id);
      });

      const applicationsByDate = months.map((month) => ({
        date: month,
        count: monthMap.get(month) || 0,
      }));

      // Format recentApplications
      const formattedRecentApplications = recentApplications.map((app) => ({
        id: app.id,
        status: app.status,
        createdAt: app.createdAt.toISOString(),
        candidate: app.candidate,
        job: app.job,
      }));

      return {
        myJobs,
        myApplications,
        pendingReviews,
        interviewCount,
        applicationsByDate,
        recentApplications: formattedRecentApplications,
        statusBreakdown: statusStats.map((s) => ({ status: s.status, count: s._count.status })),
      };
    }

    // Admin dashboard stats - return global stats
    const [
      totalUsers,
      totalJobs,
      totalApplications,
      totalCompanies,
      applicationsByDateRaw,
      recentApplications,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.job.count({ where: { isActive: true } }),
      prisma.application.count(),
      prisma.company.count(),
      prisma.application.groupBy({
        by: ["createdAt"],
        _count: { id: true },
        orderBy: { createdAt: "asc" },
        take: 30,
      }),
      prisma.application.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          candidate: { select: { name: true, email: true, avatar: true } },
          job: { select: { title: true, company: { select: { name: true } } } },
        },
      }),
    ]);

    // Format applicationsByDate
    const monthMap = new Map<string, number>();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    applicationsByDateRaw.forEach((item) => {
      const date = new Date(item.createdAt);
      const monthKey = months[date.getMonth()];
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + item._count.id);
    });

    const applicationsByDate = months.map((month) => ({
      date: month,
      count: monthMap.get(month) || 0,
    }));

    // Format recentApplications
    const formattedRecentApplications = recentApplications.map((app) => ({
      id: app.id,
      status: app.status,
      createdAt: app.createdAt.toISOString(),
      candidate: app.candidate,
      job: app.job,
    }));

    return {
      totalUsers,
      totalJobs,
      totalApplications,
      totalCompanies,
      applicationsByDate,
      recentApplications: formattedRecentApplications,
    };
  },
};
