import prisma from "../lib/prisma";
import { logger } from "../lib/logger";

export const savedJobService = {
  async saveJob(userId: string, jobId: string) {
    try {
      // Fetch job name
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        select: { title: true },
      });

      if (!job) {
        throw new Error("Job not found");
      }

      const savedJob = await prisma.savedJob.create({
        data: {
          userId,
          jobId,
          jobName: job.title,
        },
        include: {
          job: {
            include: {
              company: {
                select: {
                  id: true,
                  name: true,
                  logo: true,
                  location: true,
                },
              },
              _count: {
                select: { applications: true },
              },
            },
          },
        },
      });
      return savedJob;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new Error("Job already saved");
      }
      logger.error("Save job error:", error.message);
      throw new Error("Failed to save job");
    }
  },

  async unsaveJob(userId: string, jobId: string) {
    try {
      await prisma.savedJob.deleteMany({
        where: {
          userId,
          jobId,
        },
      });
      return { success: true };
    } catch (error: any) {
      logger.error("Unsave job error:", error.message);
      throw new Error("Failed to unsave job");
    }
  },

  async getSavedJobs(userId: string) {
    try {
      const savedJobs = await prisma.savedJob.findMany({
        where: { userId },
        include: {
          job: {
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
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return savedJobs;
    } catch (error: any) {
      logger.error("Get saved jobs error:", error.message);
      throw new Error("Failed to get saved jobs");
    }
  },

  async isJobSaved(userId: string, jobId: string) {
    try {
      const savedJob = await prisma.savedJob.findUnique({
        where: {
          userId_jobId: {
            userId,
            jobId,
          },
        },
      });
      return !!savedJob;
    } catch (error: any) {
      logger.error("Check saved job error:", error.message);
      return false;
    }
  },
};
