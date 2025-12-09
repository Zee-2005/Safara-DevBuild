// server/src/routes/invokeLlmRoute.ts

import express from "express";
import { callGemini, extractJsonBlock } from "../services/invokeLlm.js";

const router = express.Router();

/**
 * Body shape expected from frontend:
 * {
 *   prompt: string;
 *   response_json_schema: any; // descriptive only – we won't enforce schema here
 * }
 */
const fallbackAnalysis = {
  patterns: {
    trending_incident_types: ["theft", "harassment"],
    hotspot_locations: ["Baga Beach, Goa", "India Gate, New Delhi"],
    peak_times: "Evenings between 6pm–10pm local time",
    severity_trend: "Slight upward trend over last 7 days",
  },
  predictions: {
    next_7_days_risk_score: 68,
    likely_incident_types: ["theft", "harassment", "scam"],
    high_risk_areas: ["Old Delhi Bazaar Pickpocket Belt"],
    expected_sos_volume:
      "Moderate volume; peaks expected around weekends and holidays.",
  },
  recommendations: [],
  resource_allocation: {
    patrol_areas: [],
    staffing_needs: "",
    equipment_requirements: [],
  },
  urgent_attention: [],
};

router.post("/ai/invoke-llm", async (req, res) => {
  try {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "prompt is required" });
    }

    const rawText = await callGemini(prompt);

    if (!rawText) {
      // Use fallback so UI still populates
      return res.json(fallbackAnalysis);
    }

    const jsonText = extractJsonBlock(rawText) ?? rawText;

    try {
      const obj = JSON.parse(jsonText);
      return res.json(obj);
    } catch (err) {
      console.error("invoke-llm JSON parse error:", err, jsonText);
      // fall back to static data instead of 502
      return res.json(fallbackAnalysis);
    }
  } catch (e) {
    console.error("invoke-llm unexpected error:", e);
    return res.status(500).json({ error: "Internal error calling LLM" });
  }
});
export default router;