import { Queue, Worker, Job } from "bullmq";
import { redis } from "../lib/redis";
import { logger } from "../lib/logger";
import prisma from "../lib/prisma";

interface ResumeJobData {
  resumeId: string;
  userId: string;
  fileUrl: string;
}

interface ResumeJobResult {
  success: boolean;
  parsedData?: Record<string, unknown>;
}

export const resumeQueue = redis
  ? new Queue<ResumeJobData>("resume-processing", {
      connection: redis,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      },
    })
  : null;

export const createResumeWorker = (): Worker<ResumeJobData, ResumeJobResult> | null => {
  if (!redis) return null;
  const worker = new Worker<ResumeJobData, ResumeJobResult>(
    "resume-processing",
    async (job: Job<ResumeJobData>) => {
      const { resumeId, fileUrl } = job.data;

      logger.info(`Processing resume: ${resumeId}`);

      try {
        const parsedData = {
          fileName: fileUrl.split("/").pop() || "resume",
          processedAt: new Date().toISOString(),
          status: "parsed",
        };

        await prisma.resume.update({
          where: { id: resumeId },
          data: { parsedData },
        });

        logger.info(`Resume processed successfully: ${resumeId}`);
        return { success: true, parsedData };
      } catch (error) {
        logger.error(`Resume processing failed: ${resumeId}`, error);
        throw error;
      }
    },
    {
      connection: redis!,
      concurrency: 5,
      limiter: {
        max: 10,
        duration: 60000,
      },
    }
  );

  worker.on("completed", (job: Job<ResumeJobData>) => {
    logger.info(`Resume job completed: ${job.id}`);
  });

  worker.on("failed", (job: Job<ResumeJobData> | undefined, err: Error) => {
    logger.error(`Resume job failed: ${job?.id}`, err);
  });

  return worker;
};

export const addResumeJob = async (data: ResumeJobData): Promise<Job<ResumeJobData> | null> => {
  if (!resumeQueue) {
    logger.warn("Resume queue not available - Redis not configured");
    return null;
  }
  const job = await resumeQueue.add("parse-resume", data, {
    priority: 1,
  });
  logger.info(`Resume job added: ${job.id}`);
  return job;
};
