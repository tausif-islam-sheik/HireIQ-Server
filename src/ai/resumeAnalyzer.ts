import { logger } from "../lib/logger";

interface ClaudeResponse {
  content: Array<{ type: string; text: string }>;
}

const callClaude = async (prompt: string, maxTokens: number = 1024): Promise<string> => {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error("Claude API key is not configured"), { statusCode: 500 });
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`Claude API error: ${response.status} - ${errorText}`);
    throw Object.assign(new Error("AI service temporarily unavailable"), { statusCode: 502 });
  }

  const data = (await response.json()) as ClaudeResponse;
  return data.content[0].text;
};

const parseJsonResponse = <T>(text: string): T => {
  const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Failed to parse AI response");
  }
  return JSON.parse(jsonMatch[0]) as T;
};

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

  const text = await callClaude(prompt);
  return parseJsonResponse<ResumeAnalysis>(text);
};
