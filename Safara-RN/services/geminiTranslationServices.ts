// src/services/geminiTranslationService.ts (React Native side)
import { IndicLanguageCode } from "../context/LanguageContext";
import { INDIC_LANGUAGES } from "../lib/LanguageMaps";
import { SOCKET_API_BASE } from "../config/api"; // or your API base URL

class BackendTranslationService {
  private cache = new Map<string, string>();

  async translate(
    text: string,
    targetLang: IndicLanguageCode,
    sourceLang: IndicLanguageCode = "en"
  ): Promise<string> {
    if (!text) return "";

    const cacheKey = `${text}_${sourceLang}_${targetLang}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as string;
    }

    // Map to readable names or pass codes directly
    const sourceName = INDIC_LANGUAGES[sourceLang]?.english || sourceLang;
    const targetName = INDIC_LANGUAGES[targetLang]?.english || targetLang;

    try {
      const res = await fetch(`${SOCKET_API_BASE}/api/translate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          sourceLang: sourceName,
          targetLang: targetName,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        console.log("❌ Backend translate error", res.status, errJson);
        throw new Error("Backend translate failed");
      }

      const json = await res.json();
      const translated = (json?.translated as string) || text;
      this.cache.set(cacheKey, translated);
      return translated;
    } catch (err) {
      console.log("❌ Translation fetch error", err);
      return text; // fallback
    }
  }
}

const translationService = new BackendTranslationService();
export default translationService;