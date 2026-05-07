import { logger } from "../lib/logger";

interface ClaudeResponse {
  content: Array<{ type: string; text: string }>;
}

export interface JDResult {
  title: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
  benefits: string[];
}

export const generateJobDescription = async (
  title: string,
  skills: string[],
  experience: string,
  type: string
): Promise<JDResult> => {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error("Claude API key is not configured"), { statusCode: 500 });
  }

  const prompt = `Generate a professional, bias-free job description for the following role.

Role Title: ${title}
Key Skills: ${skills.join(", ")}
Experience Level: ${experience}
Job Type: ${type}

Return ONLY a JSON object with this exact shape (no other text):
{
  "title": "Full job title",
  "summary": "2-3 sentence role summary",
  "responsibilities": ["resp1", "resp2", "resp3", "resp4", "resp5"],
  "requirements": ["req1", "req2", "req3", "req4"],
  "niceToHave": ["nice1", "nice2", "nice3"],
  "benefits": ["benefit1", "benefit2", "benefit3", "benefit4"]
}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    logger.error(`Claude API error: ${response.status}`);
    throw Object.assign(new Error("AI service temporarily unavailable"), { statusCode: 502 });
  }

  const data = (await response.json()) as ClaudeResponse;
  const text = data.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse AI response");
  return JSON.parse(jsonMatch[0]) as JDResult;
};
