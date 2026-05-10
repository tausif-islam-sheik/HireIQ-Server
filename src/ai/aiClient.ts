import { logger } from "../lib/logger";

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

const API_URL = "https://openrouter.ai/api/v1/chat/completions";

export const callAI = async (
  prompt: string,
  model: string = "meta-llama/llama-3.1-8b-instruct",
  maxTokens: number = 1024
): Promise<string> => {
  const apiKey = process.env.CLAUDE_API_KEY || process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error("AI API key not configured. Set CLAUDE_API_KEY or OPENROUTER_API_KEY"), {
      statusCode: 500,
    });
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.CLIENT_URL || "http://localhost:3000",
      "X-Title": "HireIQ",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`OpenRouter API error: ${response.status} - ${errorText}`);
    throw Object.assign(new Error("AI service temporarily unavailable"), { statusCode: 502 });
  }

  const data = (await response.json()) as OpenRouterResponse;
  
  // Debug logging
  logger.info(`OpenRouter response: ${JSON.stringify(data).substring(0, 200)}...`);
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    logger.error("Invalid OpenRouter response structure:", data);
    throw new Error("Invalid AI response structure");
  }
  
  return data.choices[0].message.content;
};

export const parseJsonResponse = <T>(text: string): T => {
  // First, try to extract JSON from markdown code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    text = codeBlockMatch[1];
  }
  
  // Clean control characters that break JSON parsing
  const cleaned = text
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
    .replace(/\n|\r/g, ' ')              // Replace newlines with spaces
    .trim();
  
  // Try to find JSON object or array
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/) || cleaned.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    logger.error("No JSON found in response:", text.substring(0, 200));
    throw new Error("Failed to parse AI response: No JSON found");
  }
  
  try {
    return JSON.parse(jsonMatch[0]) as T;
  } catch (parseError) {
    logger.error("JSON parse failed for:", jsonMatch[0].substring(0, 200));
    throw new Error(`Failed to parse AI response: ${parseError}`);
  }
};
