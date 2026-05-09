import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class NotificationService {
  async getUserNotifications(userId: string) {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  async getUnreadCount(userId: string) {
    return await prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    return await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async deleteNotification(notificationId: string, userId: string) {
    return await prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });
  }

  async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
  }) {
    return await prisma.notification.create({
      data: {
        ...data,
        isRead: false,
      },
    });
  }

  // Create notification for job application
  async notifyJobApplication(jobTitle: string, companyName: string, recruiterId: string, candidateName: string) {
    return await this.createNotification({
      userId: recruiterId,
      type: "JOB_APPLICATION",
      title: "New Application",
      message: `${candidateName} applied for ${jobTitle} at ${companyName}`,
    });
  }

  // Create notification for status update
  async notifyStatusUpdate(userId: string, jobTitle: string, companyName: string, status: string) {
    const statusMessages: Record<string, string> = {
      REVIEWING: "is being reviewed",
      SHORTLISTED: "has been shortlisted",
      INTERVIEW: "moved to interview stage",
      REJECTED: "was not selected",
      HIRED: "Congratulations! You got hired",
    };

    return await this.createNotification({
      userId,
      type: "STATUS_UPDATE",
      title: "Application Update",
      message: `Your application for ${jobTitle} at ${companyName} ${statusMessages[status] || `is now ${status.toLowerCase()}`}`,
    });
  }
}

export const notificationService = new NotificationService();
