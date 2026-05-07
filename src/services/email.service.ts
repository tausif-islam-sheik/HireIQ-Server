import { logger } from "../lib/logger";
import { addEmailJob } from "../queues/emailQueue";

export const emailService = {
  async sendApplicationConfirmation(to: string, jobTitle: string, companyName: string): Promise<void> {
    await addEmailJob({
      to,
      subject: `Application Received - ${jobTitle} at ${companyName}`,
      html: `
        <h2>Application Submitted Successfully</h2>
        <p>Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been received.</p>
        <p>We will notify you when the recruiter reviews your application.</p>
        <p>Best of luck!</p>
        <p>— The HireIQ Team</p>
      `,
    });
    logger.info(`Application confirmation email queued for ${to}`);
  },

  async sendStatusUpdate(to: string, jobTitle: string, status: string): Promise<void> {
    await addEmailJob({
      to,
      subject: `Application Update - ${jobTitle}`,
      html: `
        <h2>Application Status Updated</h2>
        <p>Your application for <strong>${jobTitle}</strong> has been updated to: <strong>${status}</strong></p>
        <p>Log in to your HireIQ dashboard to see more details.</p>
        <p>— The HireIQ Team</p>
      `,
    });
    logger.info(`Status update email queued for ${to}`);
  },

  async sendWelcome(to: string, name: string): Promise<void> {
    await addEmailJob({
      to,
      subject: "Welcome to HireIQ!",
      html: `
        <h2>Welcome, ${name}!</h2>
        <p>Your HireIQ account has been created successfully.</p>
        <p>Start exploring opportunities and take advantage of our AI-powered tools.</p>
        <p>— The HireIQ Team</p>
      `,
    });
    logger.info(`Welcome email queued for ${to}`);
  },
};
