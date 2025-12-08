// src/services/aiClient.ts

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";

// Use a v1beta‑supported model name
const GEMINI_MODEL = "gemini-2.5-flash"; // or "gemini-1.0-pro"
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

type GeminiTextPart = { text: string };
type GeminiContent = { role?: string; parts: GeminiTextPart[] };

type GeminiRequest = {
  contents: GeminiContent[];
};

type GeminiResponse = {
  candidates?: { content?: GeminiContent }[];
};

export async function runTravelAssistantPrompt(prompt: string): Promise<string> {
  if (!apiKey) {
    throw new Error("Gemini API key is missing (EXPO_PUBLIC_GEMINI_API_KEY).");
  }

  const body: GeminiRequest = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
  };

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini HTTP ${res.status}: ${text}`);
  }

  const data = (await res.json()) as GeminiResponse;

  const text =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";

  if (!text) {
    throw new Error("Gemini response had no text.");
  }

  return text;
}