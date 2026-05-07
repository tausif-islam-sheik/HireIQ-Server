import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { logger } from "../lib/logger";
import { JwtPayload } from "../types";

let io: Server;

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export const initializeSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token as string | undefined;

    if (!token) {
      next(new Error("Authentication required"));
      return;
    }

    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        next(new Error("Server configuration error"));
        return;
      }

      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.userId;

    if (userId) {
      socket.join(`user:${userId}`);
      logger.info(`Socket connected: user ${userId}`);
    }

    socket.on("join-room", (room: string) => {
      socket.join(room);
      logger.debug(`User ${userId} joined room: ${room}`);
    });

    socket.on("leave-room", (room: string) => {
      socket.leave(room);
      logger.debug(`User ${userId} left room: ${room}`);
    });

    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: user ${userId}`);
    });
  });

  logger.info("Socket.io initialized");
  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error("Socket.io has not been initialized");
  }
  return io;
};

export const emitToUser = (userId: string, event: string, data: unknown): void => {
  try {
    const socketIO = getIO();
    socketIO.to(`user:${userId}`).emit(event, data);
  } catch (error) {
    logger.error(`Failed to emit to user ${userId}:`, error);
  }
};

export const emitToRoom = (room: string, event: string, data: unknown): void => {
  try {
    const socketIO = getIO();
    socketIO.to(room).emit(event, data);
  } catch (error) {
    logger.error(`Failed to emit to room ${room}:`, error);
  }
};
