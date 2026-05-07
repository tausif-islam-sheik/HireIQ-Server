import { Queue, Worker, Job } from "bullmq";
import { redis } from "../lib/redis";
import { logger } from "../lib/logger";

interface EmailJobData {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

interface EmailJobResult {
  success: boolean;
  messageId?: string;
}

export const emailQueue = new Queue<EmailJobData>("email-sending", {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 200,
    removeOnFail: 100,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 3000,
    },
  },
});

export const createEmailWorker = (): Worker<EmailJobData, EmailJobResult> => {
  const worker = new Worker<EmailJobData, EmailJobResult>(
    "email-sending",
    async (job: Job<EmailJobData>) => {
      const { to, subject } = job.data;

      logger.info(`Sending email to ${to}: ${subject}`);

      try {
        // In production, integrate with a real email service (SendGrid, SES, etc.)
        // For now, log the email details
        logger.info(`Email sent successfully to ${to}`);
        return { success: true, messageId: `msg_${Date.now()}` };
      } catch (error) {
        logger.error(`Email sending failed to ${to}:`, error);
        throw error;
      }
    },
    {
      connection: redis,
      concurrency: 10,
      limiter: {
        max: 50,
        duration: 60000,
      },
    }
  );

  worker.on("completed", (job: Job<EmailJobData>) => {
    logger.info(`Email job completed: ${job.id}`);
  });

  worker.on("failed", (job: Job<EmailJobData> | undefined, err: Error) => {
    logger.error(`Email job failed: ${job?.id}`, err);
  });

  return worker;
};

export const addEmailJob = async (data: EmailJobData): Promise<Job<EmailJobData>> => {
  const job = await emailQueue.add("send-email", data, {
    priority: 2,
  });
  logger.info(`Email job added: ${job.id}`);
  return job;
};
