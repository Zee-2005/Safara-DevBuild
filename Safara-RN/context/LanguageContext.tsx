// src/context/LanguageContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type IndicLanguageCode =
  | "hi" | "bn" | "te" | "mr" | "ta" | "gu" | "kn" | "ml"
  | "or" | "pa" | "as" | "ur" | "sa" | "ks" | "sd" | "ne"
  | "gom" | "mni" | "doi" | "brx" | "sat" | "mai" | "en";

interface LanguageContextValue {
  language: IndicLanguageCode;
  setLanguage: (lang: IndicLanguageCode) => Promise<void>;
  loading: boolean;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<IndicLanguageCode>("en");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem("selectedLanguage");
        if (saved) {
          setLanguageState(saved as IndicLanguageCode);
        }
      } catch (e) {
        console.log("Error loading language", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const setLanguage = async (lang: IndicLanguageCode) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem("selectedLanguage", lang);
    } catch (e) {
      console.log("Error saving language", e);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, loading }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};