import { callAI, parseJsonResponse } from "./aiClient";

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

  const text = await callAI(prompt, "meta-llama/llama-3.1-8b-instruct", 2048);
  return parseJsonResponse<RankResult[]>(text);
};
