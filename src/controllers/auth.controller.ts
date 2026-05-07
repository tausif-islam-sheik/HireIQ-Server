import { Response } from "express";
import { authService } from "../services/auth.service";
import { AuthRequest } from "../types";
import { logger } from "../lib/logger";

export const authController = {
  async register(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password) {
        res.status(400).json({
          success: false,
          message: "Name, email, and password are required",
          data: null,
        });
        return;
      }

      const result = await authService.register({ name, email, password, role });

      res.status(201).json({
        success: true,
        message: "Account created successfully",
        data: result,
      });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      logger.error("Registration error:", err.message);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Registration failed",
        data: null,
      });
    }
  },

  async login(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: "Email and password are required",
          data: null,
        });
        return;
      }

      const result = await authService.login({ email, password });

      res.json({
        success: true,
        message: "Login successful",
        data: result,
      });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      logger.error("Login error:", err.message);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Login failed",
        data: null,
      });
    }
  },

  async googleAuth(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { googleId, name, email, avatar } = req.body;

      if (!googleId || !name || !email) {
        res.status(400).json({
          success: false,
          message: "Google ID, name, and email are required",
          data: null,
        });
        return;
      }

      const result = await authService.googleAuth({ googleId, name, email, avatar });

      res.json({
        success: true,
        message: "Google authentication successful",
        data: result,
      });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      logger.error("Google auth error:", err.message);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Google authentication failed",
        data: null,
      });
    }
  },

  async getMe(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Not authenticated",
          data: null,
        });
        return;
      }

      const user = await authService.getCurrentUser(req.user.userId);

      res.json({
        success: true,
        message: "User profile retrieved",
        data: user,
      });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      logger.error("Get me error:", err.message);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Failed to get user profile",
        data: null,
      });
    }
  },

  async logout(_req: AuthRequest, res: Response): Promise<void> {
    res.json({
      success: true,
      message: "Logged out successfully",
      data: null,
    });
  },
};
