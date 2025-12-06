// components/screens/TouristPublicView.tsx

// For PDF + sharing, make sure you have these installed in your project:
//   npx expo install expo-print expo-sharing  [web:315]

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import axios from "axios";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";

export type TouristData = {
  tid: string;
  userId: string;
  holderPid: string;
  travelerType: string;
  destination: string;
  status: string;
  startDate: string;
  endDate: string;
  agencyId?: string | null;
  homeCity?: string | null;
  itinerary?: string | null;
};

type Props = {
  tid: string;
};

export default function TouristPublicView({ tid }: Props) {
  const [tourist, setTourist] = useState<TouristData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const API = process.env.EXPO_PUBLIC_API_BACKEND_URL;

  useEffect(() => {
    if (!tid) {
      setError("No tourist id provided");
      return;
    }

    setLoading(true);
    setError(null);

    axios
      .get(`${API}/api/tourist/${tid}`)
      .then((res) => {
        setTourist(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("fetch tourist error:", err?.response ?? err);
        setError("Tourist ID not found");
        setLoading(false);
      });
  }, [tid, API]);

  const formatDate = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString() : "—";

  const downloadPDF = async () => {
    if (!tourist) return;

    try {
      const [{ default: Print }, { default: Sharing }] = await Promise.all([
        import("expo-print"),
        import("expo-sharing"),
      ]);

      const html = `
        <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1"/>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial; color:#0b0b0b; padding:24px; }
              .card { border-radius:12px; padding:18px; box-shadow: 0 2px 6px rgba(0,0,0,0.08); border:1px solid #e5e7eb;}
              h1 { margin:0 0 12px 0; font-size:20px; }
              .row { display:flex; justify-content:space-between; margin:8px 0; }
              .label { color:#6b7280; font-size:12px; width:30%; }
              .value { color:#111827; font-size:14px; width:65%; }
              .itinerary { margin-top:10px; padding:10px; background:#f3f4f6; border-radius:8px; color:#374151; font-size:13px; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>Tourist Details</h1>
              <div class="row"><div class="label">ID</div><div class="value">${tourist.tid}</div></div>
              <div class="row"><div class="label">User ID</div><div class="value">${tourist.userId}</div></div>
              <div class="row"><div class="label">Holder PID</div><div class="value">${tourist.holderPid}</div></div>
              <div class="row"><div class="label">Traveler Type</div><div class="value">${tourist.travelerType}</div></div>
              <div class="row"><div class="label">Destination</div><div class="value">${tourist.destination}</div></div>
              <div class="row"><div class="label">Status</div><div class="value">${tourist.status}</div></div>
              <div class="row"><div class="label">Travel Dates</div><div class="value">${formatDate(
                tourist.startDate
              )} — ${formatDate(tourist.endDate)}</div></div>
              ${tourist.agencyId ? `<div class="row"><div class="label">Agency</div><div class="value">${tourist.agencyId}</div></div>` : ""}
              ${tourist.homeCity ? `<div class="row"><div class="label">Home City</div><div class="value">${tourist.homeCity}</div></div>` : ""}
              ${
                tourist.itinerary
                  ? `<div style="margin-top:12px;"><div class="label">Itinerary</div><div class="itinerary">${tourist.itinerary}</div></div>`
                  : ""
              }
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert(
          "Share not available",
          "Cannot open sharing on this device."
        );
      }
    } catch (err) {
      console.error("PDF error:", err);
      Alert.alert(
        "Unavailable",
        "PDF export is not available in this build of the app."
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!tourist) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No tourist details to display.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.wrapper}>
      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Tourist Details</Text>
          <Badge>
            <Text style={styles.badgeText}>
              {tourist.status?.toUpperCase() || "STATUS"}
            </Text>
          </Badge>
        </View>

        <View style={styles.body}>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>ID</Text>
              <Text style={styles.value}>{tourist.tid}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>User ID</Text>
              <Text style={styles.value}>{tourist.userId}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Holder PID</Text>
              <Text style={styles.value}>{tourist.holderPid}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Traveler Type</Text>
              <Text style={styles.value}>{tourist.travelerType}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Destination</Text>
              <Text style={styles.value}>{tourist.destination || "—"}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Agency</Text>
              <Text style={styles.value}>{tourist.agencyId || "—"}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Travel Dates</Text>
              <Text style={styles.value}>
                {formatDate(tourist.startDate)} — {formatDate(tourist.endDate)}
              </Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Home City</Text>
              <Text style={styles.value}>{tourist.homeCity || "—"}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Itinerary</Text>
            <View style={styles.itineraryBox}>
              <Text style={styles.itineraryText}>
                {tourist.itinerary || "—"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footerRow}>
          <TouchableOpacity
            style={styles.outlineButton}
            onPress={() => {
              Alert.alert("Action", "Back action not wired here.");
            }}
          >
            <Text style={styles.outlineText}>Back</Text>
          </TouchableOpacity>

          <View style={{ width: 12 }} />

          <Button onPress={downloadPDF}>
            <Text style={styles.buttonText}>Download PDF</Text>
          </Button>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    padding: 16,
  },
  center: {
    flex: 1,
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    borderRadius: 12,
    backgroundColor: "#0B0B0B",
    padding: 14,
    maxHeight: "100%",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
  },
  body: {
    paddingVertical: 4,
  },
  row: {
    flexDirection: "row",
    marginBottom: 10,
  },
  col: {
    flex: 1,
    paddingRight: 8,
  },
  label: {
    color: "#9CA3AF",
    fontSize: 12,
    marginBottom: 4,
  },
  value: {
    color: "#F9FAFB",
    fontSize: 14,
  },
  section: {
    marginTop: 8,
  },
  itineraryBox: {
    marginTop: 6,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#111827",
  },
  itineraryText: {
    color: "#D1D5DB",
    fontSize: 13,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 14,
  },
  outlineButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#4B5563",
    backgroundColor: "transparent",
  },
  outlineText: {
    color: "#E5E7EB",
    fontSize: 14,
    fontWeight: "500",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  errorText: {
    color: "#F87171",
    fontSize: 14,
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 13,
  },
});
