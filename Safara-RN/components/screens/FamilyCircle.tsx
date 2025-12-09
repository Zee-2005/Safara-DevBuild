// src/screens/FamilyCircleDemo.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import MapLibreGL from "@maplibre/maplibre-react-native";
import { Feather } from "@expo/vector-icons";

type Props = {
  myTouristId?: string;
  familyId?: string | null;

};

const MAPTILER_KEY = "K183PqmMToR2O89INJ40";
MapLibreGL.setAccessToken(null);

export default function FamilyCircleDemo({
  myTouristId = "TID-DEMO-123456",
  familyId = null,

}: Props) {
  const [otherTid, setOtherTid] = useState("");
  const [linkedTid, setLinkedTid] = useState<string | null>(null);

  const handleManualLink = () => {
    const trimmed = otherTid.trim();
    if (!trimmed) {
      Alert.alert("Missing ID", "Enter family member's Tourist ID.");
      return;
    }
    setLinkedTid(trimmed);
    Alert.alert("Linked", `You linked with ${trimmed}`);
  };

  return (
    <View style={styles.screen}>
      {/* Header like verify/child portal */}
      <View style={styles.header}>
        <TouchableOpacity
       
          style={styles.backRow}
        >
          <Feather name="arrow-left" size={18} color="#e5e7eb" />
          <Text style={styles.backText}>Back to tour tools</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Family Circle</Text>
      </View>

      <View style={styles.content}>
        {/* My + family IDs */}
        <View style={styles.card}>
          <Text style={styles.label}>My Tourist ID</Text>
          <Text style={styles.value}>{myTouristId}</Text>

          <Text style={[styles.label, { marginTop: 8 }]}>Our Family ID</Text>
          <Text style={styles.value}>
            {familyId || "Not created yet (demo)"}
          </Text>

          <Text style={styles.helper}>
            Share your ID only with trusted family members.
          </Text>
        </View>

        {/* Link member */}
        <View style={styles.card}>
          <Text style={styles.label}>Link family member</Text>
          <TextInput
            placeholder="Enter family member's Tourist ID"
            placeholderTextColor="#6b7280"
            value={otherTid}
            onChangeText={setOtherTid}
            style={styles.input}
            autoCapitalize="characters"
          />
          <View style={{ marginTop: 8 }}>
            <Button title="Link via ID" onPress={handleManualLink} />
          </View>
        </View>

        {/* Map demo */}
        <View style={[styles.card, { flex: 1 }]}>
          <Text style={styles.label}>Family map</Text>
          <Text style={styles.helper}>
            Demo map: shows a marker when a family member is linked.
          </Text>

          <View style={styles.mapContainer}>
            <MapLibreGL.MapView
              style={styles.map}
              mapStyle={`https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`}
              logoEnabled={false}
              attributionEnabled
            >
              <MapLibreGL.Camera
                defaultSettings={{
                  centerCoordinate: [78.9629, 20.5937],
                  zoomLevel: 4,
                }}
              />

              {linkedTid && (
                <MapLibreGL.ShapeSource
                  id="family-member"
                  shape={{
                    type: "FeatureCollection",
                    features: [
                      {
                        type: "Feature",
                        id: linkedTid,
                        properties: { id: linkedTid },
                        geometry: {
                          type: "Point",
                          coordinates: [77.209, 28.6139], // demo
                        },
                      },
                    ],
                  }}
                >
                  <MapLibreGL.CircleLayer
                    id="family-member-layer"
                    style={{
                      circleRadius: 6,
                      circleColor: "#22c55e",
                      circleStrokeWidth: 1,
                      circleStrokeColor: "#ffffff",
                    }}
                  />
                </MapLibreGL.ShapeSource>
              )}
            </MapLibreGL.MapView>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#020617" },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#1f2937",
    flexDirection: "row",
    alignItems: "center",
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  backText: {
    marginLeft: 4,
    fontSize: 13,
    fontWeight: "500",
    color: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#e5e7eb",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: "#020617",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9ca3af",
  },
  value: {
    fontSize: 15,
    fontWeight: "600",
    color: "#e5e7eb",
    marginTop: 4,
  },
  helper: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#4b5563",
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    color: "#e5e7eb",
  },
  mapContainer: {
    marginTop: 12,
    flex: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
});
