import { logger } from "../lib/logger";

interface ClaudeResponse {
  content: Array<{ type: string; text: string }>;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface InterviewResult {
  reply: string;
  feedback: string;
  score: number;
  nextQuestion: string;
}

export const interviewChat = async (
  jobTitle: string,
  messages: ChatMessage[]
): Promise<InterviewResult> => {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error("Claude API key is not configured"), { statusCode: 500 });
  }

  const conversationHistory = messages
    .map((m) => `${m.role === "user" ? "Candidate" : "Interviewer"}: ${m.content}`)
    .join("\n");

  const prompt = `You are an expert technical interviewer for the role of "${jobTitle}".

${messages.length === 0
  ? "Start the interview with a greeting and your first question."
  : `Conversation so far:\n${conversationHistory}\n\nEvaluate the candidate's last answer, provide feedback, and ask the next question.`}

Return ONLY a JSON object (no other text):
{
  "reply": "Your response to the candidate",
  "feedback": "Brief feedback on their last answer (empty if first message)",
  "score": <number 1-10 for the last answer, 0 if first message>,
  "nextQuestion": "The next interview question"
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
  return JSON.parse(jsonMatch[0]) as InterviewResult;
};
