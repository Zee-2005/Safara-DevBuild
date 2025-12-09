// src/routes/translate.route.ts
import { Router } from "express";
import { translateTextServer } from "../services/geminiTranslation.service.js";

const router = Router();

// POST /api/translate
router.post("/", async (req, res) => {
  try {
    const { text, sourceLang = "en", targetLang = "hi" } = req.body || {};

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "text is required" });
    }

    const translated = await translateTextServer({
      text,
      sourceLang,
      targetLang,
    });

    return res.json({ translated });
  } catch (err: any) {
    console.error("Server translation error:", err);
    return res.status(500).json({
      error: "translation_failed",
      message: err?.message ?? "Unknown error",
    });
  }
});

export default router;