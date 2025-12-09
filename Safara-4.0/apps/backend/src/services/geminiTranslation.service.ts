// src/services/geminiTranslation.service.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

if (!GEMINI_API_KEY) {
  // eslint-disable-next-line no-console
  console.warn("GEMINI_API_KEY is not set on the server.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function translateTextServer(opts: {
  text: string;
  sourceLang: string;
  targetLang: string;
}): Promise<string> {
  const { text, sourceLang, targetLang } = opts;

  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured on server");
  }

  const prompt = `Translate the following text from ${sourceLang} to ${targetLang}.
Only return the translation, nothing else.

Text: "${text}"

Translation:`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const translated = response.text().trim();
  return translated || text;
}