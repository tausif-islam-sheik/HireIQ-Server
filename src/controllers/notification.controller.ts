import { Response } from "express";
import { notificationService } from "../services/notification.service";
import { AuthRequest } from "../types";
import { ApiError, asyncHandler } from "../middleware/errorHandler";

export const getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const notifications = await notificationService.getUserNotifications(userId);
  
  res.json({
    success: true,
    data: notifications,
  });
});

export const getUnreadCount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const count = await notificationService.getUnreadCount(userId);
  
  res.json({
    success: true,
    data: { count },
  });
});

export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;
  
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  await notificationService.markAsRead(id as string, userId);
  
  res.json({
    success: true,
    message: "Notification marked as read",
  });
});

export const markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  await notificationService.markAllAsRead(userId);
  
  res.json({
    success: true,
    message: "All notifications marked as read",
  });
});

export const deleteNotification = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;
  
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  await notificationService.deleteNotification(id as string, userId);
  
  res.json({
    success: true,
    message: "Notification deleted",
  });
});
