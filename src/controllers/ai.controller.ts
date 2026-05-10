import { Response } from "express";
import { AuthRequest } from "../types";
import { analyzeResume } from "../ai/resumeAnalyzer";
import { generateJobDescription } from "../ai/jdGenerator";
import { rankCandidates } from "../ai/candidateRanker";
import { interviewChat } from "../ai/interviewCoach";
import { logger } from "../lib/logger";
import { prisma } from "../lib/prisma";

export const aiController = {
  async analyzeResume(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { resumeText, jobDescription } = req.body;

      if (!resumeText) {
        res.status(400).json({
          success: false,
          message: "Resume text is required",
          data: null,
        });
        return;
      }

      const defaultJobDescription = jobDescription || "General professional position requiring relevant skills and experience.";
      const analysis = await analyzeResume(resumeText, defaultJobDescription);

      // Save analysis to user's resume
      const resume = await prisma.resume.findUnique({
        where: { userId: req.user?.userId },
      });
      
      if (resume) {
        await prisma.resume.update({
          where: { id: resume.id },
          data: { aiAnalysis: analysis },
        });
        logger.info(`AI analysis saved for resume: ${resume.id}`);
      }

      res.json({
        success: true,
        message: "Resume analyzed successfully",
        data: analysis,
      });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      logger.error("AI analyze resume error:", err.message);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Failed to analyze resume",
        data: null,
      });
    }
  },

  async generateJD(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { title, skills, experience, type } = req.body;

      if (!title || !skills || !experience || !type) {
        res.status(400).json({
          success: false,
          message: "Title, skills, experience, and type are required",
          data: null,
        });
        return;
      }

      const jd = await generateJobDescription(title, skills, experience, type);

      res.json({
        success: true,
        message: "Job description generated successfully",
        data: jd,
      });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      logger.error("AI generate JD error:", err.message);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Failed to generate job description",
        data: null,
      });
    }
  },

  async rankCandidates(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { jobDescription, candidates } = req.body;

      if (!jobDescription || !candidates || !Array.isArray(candidates)) {
        res.status(400).json({
          success: false,
          message: "Job description and candidates array are required",
          data: null,
        });
        return;
      }

      const rankings = await rankCandidates(jobDescription, candidates);

      res.json({
        success: true,
        message: "Candidates ranked successfully",
        data: rankings,
      });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      logger.error("AI rank candidates error:", err.message);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Failed to rank candidates",
        data: null,
      });
    }
  },

  async interviewChat(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { jobTitle, messages } = req.body;

      if (!jobTitle) {
        res.status(400).json({
          success: false,
          message: "Job title is required",
          data: null,
        });
        return;
      }

      const result = await interviewChat(jobTitle, messages || []);

      res.json({
        success: true,
        message: "Interview response generated",
        data: result,
      });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      logger.error("AI interview chat error:", err.message);
      logger.error("Full error:", err);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Failed to generate interview response",
        data: null,
      });
    }
  },
};
