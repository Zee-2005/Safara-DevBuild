// server/src/services/invokeLlm.ts

import fetch from "node-fetch";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = "gemini-1.5-pro";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

type GeminiTextPart = { text: string };
type GeminiContent = { role?: string; parts: GeminiTextPart[] };

interface GeminiRequest {
  contents: GeminiContent[];
}

interface GeminiResponse {
  candidates?: { content?: GeminiContent }[];
}

/**
 * Generic helper to call Gemini with a prompt string and
 * return raw text from the first candidate.
 */
// in invokeLlm.ts
export async function callGemini(prompt: string): Promise<string | null> {
  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY missing, cannot call Gemini");
    return null;
  }

  const body: GeminiRequest = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  };

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Gemini HTTP error:", res.status, text);
    return null;
  }

  const data = (await res.json()) as GeminiResponse;
  const text =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";

  if (!text) {
    console.error("Gemini response empty:", JSON.stringify(data, null, 2));
    return null;
  }

  return text.trim();
}

/**
 * Extract JSON object from a possibly‑verbose LLM answer.
 */
export function extractJsonBlock(text: string): string | null {
  const trimmed = text.trim();
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return null;
  return trimmed.slice(first, last + 1);
}