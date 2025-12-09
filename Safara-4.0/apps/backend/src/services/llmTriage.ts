// server/src/services/llmTriage.ts

import { SosPayload, SosTriageResult } from "../types/sos";

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
++
function buildPrompt(payload: SosPayload): string {
  const loc = payload.location
    ? `Latitude: ${payload.location.lat}, Longitude: ${payload.location.lng}`
    : "Unknown";
  const mediaHints = [
    payload.media.photo ? "photo attached" : "",
    payload.media.audio ? "audio attached" : "",
    payload.media.video ? "video attached" : "",
  ]
    .filter(Boolean)
    .join(", ");

  return `
You are a safety triage assistant for the SaFara Tourist SOS platform.

You receive SOS alerts from travellers. Each alert includes:
- A free-text description of the situation
- A structured emergency type chosen by the user
- A flag if a child or under-18 is involved
- An approximate location and timestamp
- Information about whether this may be a demo/test alert

Your task is to help human authorities by:
1) classifying urgency,
2) categorizing incident type,
3) creating a concise summary,
4) setting boolean flags for what response is needed,
5) estimating if this might be non-emergency or prank.

You must be conservative: when in doubt, choose the higher urgency and avoid marking true emergencies as non-emergency.

Return ONLY valid JSON with this exact schema and keys:

{
  "urgency": "life_threatening" | "high" | "medium" | "low",
  "incident_type": "medical" | "harassment" | "accident" | "lost" | "theft" | "natural_disaster" | "suspicious_activity" | "other",
  "summary": "short text (max 60 words)",
  "needs_police": boolean,
  "needs_medical": boolean,
  "needs_fire": boolean,
  "contains_child": boolean,
  "possibly_false_report": boolean,
  "emergency_score": number (0.0 to 1.0),
  "likely_non_emergency": boolean
}

Now analyze this SOS:

EMERGENCY_TYPE: ${payload.emergencyType}
CHILD_INVOLVED: ${payload.isChildInvolved ? "true" : "false"}
IS_DEMO: ${payload.isDemo ? "true" : "false"}
LOCATION_HINT: ${loc}
TIMESTAMP: ${payload.timestamp}
DESCRIPTION: """${payload.description}"""
MEDIA_HINTS: ${mediaHints || "none"}
`.trim();
}

export async function triageSos(
  payload: SosPayload
): Promise<SosTriageResult | null> {
  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY missing, skipping triage");
    return null;
  }

  const prompt = buildPrompt(payload);

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
    console.error("Gemini response empty");
    return null;
  }

  // extract JSON block
  let jsonText = text.trim();
  const firstBrace = jsonText.indexOf("{");
  const lastBrace = jsonText.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    jsonText = jsonText.slice(firstBrace, lastBrace + 1);
  }

  try {
    const triage = JSON.parse(jsonText) as SosTriageResult;
    // basic validation
    if (!triage.urgency || !triage.incident_type) {
      throw new Error("Missing required fields");
    }
    return triage;
  } catch (e) {
    console.error("Triage JSON parse error:", e, jsonText);
    return null;
  }
}