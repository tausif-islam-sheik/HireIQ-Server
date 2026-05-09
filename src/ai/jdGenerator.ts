import { callAI, parseJsonResponse } from "./aiClient";

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

  const text = await callAI(prompt, "meta-llama/llama-3.1-8b-instruct");
  return parseJsonResponse<JDResult>(text);
};
