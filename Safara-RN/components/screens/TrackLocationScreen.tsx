// src/components/screens/TrackLocationScreen.tsx
import React, { useState } from "react";
import { View, StyleSheet, Pressable, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapComponent from "./MapComponent";
import FamilyCircleDemo from "./FamilyCircle";

type Props = {
  onBack: () => void;
};

export default function TrackLocationScreen({ onBack }: Props) {
  const [view, setView] = useState<"map" | "family">("map");

  // Back button behaviour
  const handleBack = () => {
    if (view === "family") {
      setView("map");          // go back to map
    } else {
      onBack();               // go back to Home
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.title}>
          {view === "family" ? "Family Circle" : "Track your location"}
        </Text>
        {view === "map" && (
          <Pressable
            onPress={() => setView("family")}
            style={styles.familyButton}
          >
            <Text style={styles.familyText}>Family</Text>
          </Pressable>
        )}
        {view === "family" && <View style={styles.familyButton} />}
      </View>

      <View style={styles.mapContainer}>
        {view === "map" ? (
          <MapComponent isFullscreen />
        ) : (
          <FamilyCircleDemo
            myTouristId="TID-DEMO-123456"
            familyId={null}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0f172a" },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    paddingRight: 12,
    paddingVertical: 4,
  },
  backText: { color: "#38bdf8", fontWeight: "600" },
  title: { color: "#fff", fontSize: 18, fontWeight: "700" },
  familyButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#1d4ed8",
    minWidth: 60,
    alignItems: "center",
  },
  familyText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  mapContainer: { flex: 1, paddingHorizontal: 12, paddingBottom: 12 },
});
