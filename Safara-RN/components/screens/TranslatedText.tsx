// src/components/TranslatedText.tsx
import React, { useEffect, useState } from "react";
import { Text, ActivityIndicator, View, StyleSheet, TextStyle } from "react-native";
import translationService from "../../services/geminiTranslationServices";
import { IndicLanguageCode } from "../../context/LanguageContext";

interface TranslatedTextProps {
  text: string;
  targetLang: IndicLanguageCode;
  sourceLang?: IndicLanguageCode;
  style?: TextStyle | TextStyle[];  // ⬅ allow array
  showOriginal?: boolean;
}

const TranslatedText: React.FC<TranslatedTextProps> = ({
  text,
  targetLang,
  sourceLang = "en",
  style,
  showOriginal = false,
}) => {
  const [translatedText, setTranslatedText] = useState<string>(text);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const translate = async () => {
      if (!text) {
        setTranslatedText("");
        return;
      }
      if (targetLang === sourceLang) {
        setTranslatedText(text);
        return;
      }

      setLoading(true);
      try {
        const result = await translationService.translate(
          text,
          targetLang,
          sourceLang
        );
        if (isMounted) {
          setTranslatedText(result);
        }
      } catch (error) {
        console.log("❌ Translation error in component", error);
        if (isMounted) {
          setTranslatedText(text);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    translate();

    return () => {
      isMounted = false;
    };
  }, [text, targetLang, sourceLang]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#4CAF50" />
        <Text style={[styles.loadingText, style as any]}>Translating...</Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={style}>{translatedText}</Text>
      {showOriginal && targetLang !== sourceLang && !!text && (
        <Text style={styles.originalText}>({text})</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingText: {
    color: "#666666",
    fontSize: 14,
    marginLeft: 8,
  },
  originalText: {
    color: "#999999",
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 4,
  },
});

export default TranslatedText;