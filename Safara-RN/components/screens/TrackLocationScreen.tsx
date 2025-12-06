import React from "react";
import { View, StyleSheet, Pressable, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapComponent from "./MapComponent";

type Props = {
  onBack: () => void;
};

export default function TrackLocationScreen({ onBack }: Props) {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Track your location</Text>
      </View>
      <View style={styles.mapContainer}>
        <MapComponent isFullscreen />
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
  },
  backButton: {
    paddingRight: 12,
    paddingVertical: 4,
  },
  backText: { color: "#38bdf8", fontWeight: "600" },
  title: { color: "#fff", fontSize: 18, fontWeight: "700" },
  mapContainer: { flex: 1, paddingHorizontal: 12, paddingBottom: 12 },
});
