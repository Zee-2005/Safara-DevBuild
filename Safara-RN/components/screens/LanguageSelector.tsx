// src/components/LanguageSelector.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage, IndicLanguageCode } from "../../context/LanguageContext";
import { INDIC_LANGUAGES } from "../../lib/LanguageMaps";

type Props = {
  onContinue: () => void;
};

const LANGUAGE_GROUPS: Record<string, IndicLanguageCode[]> = {
  Popular: ["en", "hi", "ta", "te", "bn", "mr"],
  North: ["pa", "ur", "ks", "ne", "doi"],
  South: ["kn", "ml"],
  East: ["as", "or", "mni", "sat"],
  West: ["gu", "gom", "sd"],
  Other: ["sa", "brx", "mai"],
};

const LanguageSelector: React.FC<Props> = ({ onContinue }) => {
  const insets = useSafeAreaInsets();
  const { language, setLanguage } = useLanguage();
  const [localSelected, setLocalSelected] = useState<IndicLanguageCode>(language);

  const handleSelect = (code: IndicLanguageCode) => {
    setLocalSelected(code);
    setLanguage(code);
  };

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 },
      ]}
    >
      <View style={styles.card}>
        <Text style={styles.appTitle}>SaFara Safety Companion</Text>
        <Text style={styles.title}>Choose your language</Text>
        <Text style={styles.subtitle}>
          We will show all important safety information and SOS guidance in your preferred language.
        </Text>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {Object.entries(LANGUAGE_GROUPS).map(([group, langs]) => (
            <View key={group} style={styles.group}>
              <Text style={styles.groupTitle}>{group}</Text>
              <View style={styles.languageGrid}>
                {langs.map((code) => {
                  const lang = INDIC_LANGUAGES[code];
                  const selected = localSelected === code;
                  return (
                    <TouchableOpacity
                      key={code}
                      style={[
                        styles.languageButton,
                        selected && styles.languageButtonSelected,
                      ]}
                      onPress={() => handleSelect(code)}
                    >
                      <Text
                        style={[
                          styles.nativeText,
                          selected && styles.nativeTextSelected,
                        ]}
                      >
                        {lang.name}
                      </Text>
                      <Text
                        style={[
                          styles.englishText,
                          selected && styles.englishTextSelected,
                        ]}
                      >
                        {lang.english}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.primaryButton} onPress={onContinue}>
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>
        <Text style={styles.helperText}>
          You can change language anytime from settings inside the app.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  appTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 4,
    textAlign: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 16,
  },
  scroll: {
    maxHeight: 360,
  },
  scrollContent: {
    paddingBottom: 12,
  },
  group: {
    marginBottom: 18,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4B5563",
    marginBottom: 8,
  },
  languageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  languageButton: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 110,
    alignItems: "center",
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  languageButtonSelected: {
    backgroundColor: "#16A34A",
    borderColor: "#15803D",
  },
  nativeText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  nativeTextSelected: {
    color: "#FFFFFF",
  },
  englishText: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  englishTextSelected: {
    color: "#ECFDF5",
  },
  primaryButton: {
    marginTop: 12,
    backgroundColor: "#DC2626",
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  helperText: {
    marginTop: 8,
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "center",
  },
});

export default LanguageSelector;