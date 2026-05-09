import { callAI, parseJsonResponse } from "./aiClient";

export interface ResumeAnalysis {
  overallScore: number;
  matchPercentage: number;
  strengths: string[];
  gaps: string[];
  suggestions: string[];
  verdict: string;
}

export const analyzeResume = async (resumeText: string, jobDescription: string): Promise<ResumeAnalysis> => {
  const prompt = `Analyze this resume against the job description.

Resume:
${resumeText}

Job Description:
${jobDescription}

Return ONLY a JSON object with this exact shape (no other text):
{
  "overallScore": <number 0-100>,
  "matchPercentage": <number 0-100>,
  "strengths": ["strength1", "strength2", "strength3"],
  "gaps": ["gap1", "gap2"],
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
  "verdict": "<Strong Match | Moderate Match | Weak Match>"
}`;

  const text = await callAI(prompt, "meta-llama/llama-3.1-8b-instruct");
  return parseJsonResponse<ResumeAnalysis>(text);
};
