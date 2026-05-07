import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface JobFilterQuery extends PaginationQuery {
  category?: string;
  type?: string;
  location?: string;
  salary?: string;
  experience?: string;
}

export interface CandidateForRanking {
  id: string;
  name: string;
  resumeText: string;
}

export interface ResumeAnalysisResult {
  overallScore: number;
  matchPercentage: number;
  strengths: string[];
  gaps: string[];
  suggestions: string[];
  verdict: string;
}

export interface JDGeneratorInput {
  title: string;
  skills: string[];
  experience: string;
  type: string;
}

export interface JDGeneratorResult {
  title: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
  benefits: string[];
}

export interface CandidateRankResult {
  candidateId: string;
  name: string;
  score: number;
  reason: string;
  rank: number;
}

export interface InterviewChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface InterviewChatResult {
  reply: string;
  feedback: string;
  score: number;
  nextQuestion: string;
}

export type AsyncHandler = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => Promise<void>;
