import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import fs from "fs";

export const extractTextFromPDF = async (filePath: string): Promise<string> => {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
};

export const extractTextFromWord = async (filePath: string): Promise<string> => {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
};

export const extractResumeText = async (filePath: string, mimeType: string): Promise<string> => {
  if (mimeType === "application/pdf") {
    return extractTextFromPDF(filePath);
  } else if (
    mimeType === "application/msword" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return extractTextFromWord(filePath);
  }
  throw new Error("Unsupported file type. Only PDF and Word documents are supported.");
};
