import { logger } from "../lib/logger";

interface ClaudeResponse {
  content: Array<{ type: string; text: string }>;
}

interface CandidateInput {
  id: string;
  name: string;
  resumeText: string;
}

export interface RankResult {
  candidateId: string;
  name: string;
  score: number;
  reason: string;
  rank: number;
}

export const rankCandidates = async (
  jobDescription: string,
  candidates: CandidateInput[]
): Promise<RankResult[]> => {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error("Claude API key is not configured"), { statusCode: 500 });
  }

  const candidateList = candidates
    .map((c, i) => `Candidate ${i + 1} (ID: ${c.id}, Name: ${c.name}):\n${c.resumeText}`)
    .join("\n\n---\n\n");

  const prompt = `Rank these candidates for the following job role. Evaluate skills, experience, and fit.

Job Description:
${jobDescription}

Candidates:
${candidateList}

Return ONLY a JSON array sorted by rank (no other text):
[{
  "candidateId": "id",
  "name": "name",
  "score": <number 0-100>,
  "reason": "brief explanation",
  "rank": <number starting from 1>
}]`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    logger.error(`Claude API error: ${response.status}`);
    throw Object.assign(new Error("AI service temporarily unavailable"), { statusCode: 502 });
  }

  const data = (await response.json()) as ClaudeResponse;
  const text = data.content[0].text;
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("Failed to parse AI response");
  return JSON.parse(jsonMatch[0]) as RankResult[];
};
