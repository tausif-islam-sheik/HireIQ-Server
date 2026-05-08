import prisma from "../lib/prisma";
import { cacheGet, cacheSet, cacheDelPattern } from "../lib/redis";
import { logger } from "../lib/logger";
import { Prisma, JobType } from "@prisma/client";

interface JobCreateInput {
  title: string;
  description: string;
  requirements: string[];
  skills: string[];
  salary?: string;
  location: string;
  type: JobType;
  category: string;
  experience: string;
  companyId: string;
}

interface JobListQuery {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  type?: string;
  location?: string;
  salary?: string;
  experience?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const jobService = {
  async list(query: JobListQuery) {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      type,
      location,
      salary,
      experience,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;

    const cacheKey = `jobs:${JSON.stringify(query)}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      logger.debug(`Cache hit: ${cacheKey}`);
      return JSON.parse(cached);
    }

    const where: Prisma.JobWhereInput = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
        { company: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (category) {
      where.category = { equals: category, mode: "insensitive" };
    }

    if (type) {
      where.type = type as JobType;
    }

    if (location) {
      where.location = { contains: location, mode: "insensitive" };
    }

    if (experience) {
      where.experience = { contains: experience, mode: "insensitive" };
    }

    if (salary) {
      where.salary = { contains: salary, mode: "insensitive" };
    }

    const orderBy: Prisma.JobOrderByWithRelationInput = {};
    const validSortFields = ["createdAt", "title", "salary", "location"];
    if (validSortFields.includes(sortBy)) {
      (orderBy as Record<string, string>)[sortBy] = sortOrder;
    } else if (sortBy === "salary_high") {
      orderBy.salary = "desc";
    } else if (sortBy === "salary_low") {
      orderBy.salary = "asc";
    } else {
      orderBy.createdAt = "desc";
    }

    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              logo: true,
              location: true,
              industry: true,
            },
          },
          _count: {
            select: { applications: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);

    const result = {
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + jobs.length < total,
      },
    };

    await cacheSet(cacheKey, JSON.stringify(result), 120);

    return result;
  },

  async getById(id: string) {
    const cacheKey = `job:${id}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            website: true,
            description: true,
            location: true,
            industry: true,
            size: true,
          },
        },
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!job) {
      throw Object.assign(new Error("Job not found"), { statusCode: 404 });
    }

    await cacheSet(cacheKey, JSON.stringify(job), 300);

    return job;
  },

  async create(data: JobCreateInput) {
    const job = await prisma.job.create({
      data,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    await cacheDelPattern("jobs:*");
    logger.info(`Job created: ${job.title} (${job.id})`);

    return job;
  },

  async update(id: string, recruiterId: string, data: Partial<JobCreateInput>) {
    const job = await prisma.job.findUnique({
      where: { id },
      include: { company: true },
    });

    if (!job) {
      throw Object.assign(new Error("Job not found"), { statusCode: 404 });
    }

    if (job.company.recruiterId !== recruiterId) {
      throw Object.assign(new Error("Not authorized to update this job"), {
        statusCode: 403,
      });
    }

    const updated = await prisma.job.update({
      where: { id },
      data,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    await cacheDelPattern("jobs:*");
    await cacheDelPattern(`job:${id}`);

    return updated;
  },

  async remove(id: string, recruiterId: string) {
    const job = await prisma.job.findUnique({
      where: { id },
      include: { company: true },
    });

    if (!job) {
      throw Object.assign(new Error("Job not found"), { statusCode: 404 });
    }

    if (job.company.recruiterId !== recruiterId) {
      throw Object.assign(new Error("Not authorized to delete this job"), {
        statusCode: 403,
      });
    }

    await prisma.job.update({
      where: { id },
      data: { isActive: false },
    });

    await cacheDelPattern("jobs:*");
    await cacheDelPattern(`job:${id}`);

    logger.info(`Job deactivated: ${job.title} (${job.id})`);
  },

  async getCategories() {
    const categories = await prisma.job.groupBy({
      by: ["category"],
      _count: { category: true },
      where: { isActive: true },
      orderBy: { _count: { category: "desc" } },
    });

    return categories.map((c) => ({
      name: c.category,
      count: c._count.category,
    }));
  },

  async getStats() {
    const [totalJobs, totalCompanies, totalApplications, jobsByType] =
      await Promise.all([
        prisma.job.count({ where: { isActive: true } }),
        prisma.company.count(),
        prisma.application.count(),
        prisma.job.groupBy({
          by: ["type"],
          _count: { type: true },
          where: { isActive: true },
        }),
      ]);

    return {
      totalJobs,
      totalCompanies,
      totalApplications,
      jobsByType: jobsByType.map((j) => ({
        type: j.type,
        count: j._count.type,
      })),
    };
  },

  async getMyJobs(recruiterId: string) {
    const company = await prisma.company.findUnique({
      where: { recruiterId },
    });

    if (!company) {
      return [];
    }

    const jobs = await prisma.job.findMany({
      where: { companyId: company.id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            location: true,
            industry: true,
          },
        },
        _count: {
          select: { applications: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return jobs;
  },
};
