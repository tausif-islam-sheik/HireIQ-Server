import { Queue, Worker, Job } from "bullmq";
import nodemailer from "nodemailer";
import { redis } from "../lib/redis";
import { logger } from "../lib/logger";

// Create Nodemailer transporter with real SMTP credentials
const createTransporter = () => {
  // Check if SMTP credentials are configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error(
      "SMTP credentials not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables."
    );
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

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
      const { to, subject, html, from } = job.data;

      logger.info(`Sending email to ${to}: ${subject}`);

      try {
        const transporter = createTransporter();

        const info = await transporter.sendMail({
          from: from || process.env.SMTP_FROM || "noreply@hireiq.com",
          to,
          subject,
          html,
        });

        logger.info(`Email sent successfully to ${to}, messageId: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
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
