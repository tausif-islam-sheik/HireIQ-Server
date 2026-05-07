import { Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { AuthRequest } from "../types";

export const requireRole = (...roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
        data: null,
      });
      return;
    }

    if (!roles.includes(req.user.role as Role)) {
      res.status(403).json({
        success: false,
        message: "You do not have permission to access this resource",
        data: null,
      });
      return;
    }

    next();
  };
};

export const requireCandidate = requireRole(Role.CANDIDATE);
export const requireRecruiter = requireRole(Role.RECRUITER);
export const requireAdmin = requireRole(Role.ADMIN);
export const requireRecruiterOrAdmin = requireRole(Role.RECRUITER, Role.ADMIN);
