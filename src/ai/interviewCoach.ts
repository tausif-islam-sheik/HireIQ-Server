import { callAI, parseJsonResponse } from "./aiClient";

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

  const text = await callAI(prompt, "meta-llama/llama-3.1-8b-instruct");
  return parseJsonResponse<InterviewResult>(text);
};
