// components/screens/QRCodeDisplay.tsx

// For PDF + sharing, make sure you have these installed in your project:
//   npx expo install expo-print expo-sharing  [web:315]

import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { MaterialIcons, Feather } from "@expo/vector-icons";

interface TouristIdData {
  id: string;
  destination: string;
  validUntil: Date | string;
  status: "active" | "expiring" | "expired";
  holderName: string;
  issueDate: Date | string;
}

export default function QRCodeDisplay({
  touristId,
}: {
  touristId: TouristIdData;
}) {
  const [timeRemaining, setTimeRemaining] = useState("");
  const qrRef = useRef<any>(null);
  const PUBLIC_URL = process.env.EXPO_PUBLIC_FRONTEND_URL;

  const issueDate = new Date(touristId.issueDate);
  const validUntil = new Date(touristId.validUntil);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const diff = validUntil.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining("Expired");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );

      setTimeRemaining(
        days > 0 ? `${days}d ${hours}h remaining` : `${hours}h remaining`
      );
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [validUntil]);

  const statusColor = {
    active: "#16A34A",
    expiring: "#EAB308",
    expired: "#DC2626",
  }[touristId.status];

  const statusIcon = {
    active: "check-circle",
    expiring: "alert-triangle",
    expired: "alert-octagon",
  }[touristId.status];

  const downloadPDF = async () => {
    try {
      const [{ default: Print }, { default: Sharing }] = await Promise.all([
        import("expo-print"),
        import("expo-sharing"),
      ]);

      qrRef.current?.toDataURL(async (data: string) => {
        const html = `
          <html>
            <body style="text-align:center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;">
              <h2>SaFara Tourist QR Code</h2>
              <img src="data:image/png;base64,${data}" style="width:250px; height:250px;" />
              <p>ID: ${touristId.id}</p>
              <p>Holder: ${touristId.holderName}</p>
              <p>Destination: ${touristId.destination}</p>
            </body>
          </html>
        `;

        const file = await Print.printToFileAsync({ html });
        const canShare = await Sharing.isAvailableAsync();

        if (!canShare) {
          Alert.alert(
            "Sharing not supported",
            "Sharing is not available on this device."
          );
          return;
        }

        await Sharing.shareAsync(file.uri);
      });
    } catch (err) {
      console.log("PDF error", err);
      Alert.alert(
        "Unavailable",
        "PDF export is not available in this build of the app."
      );
    }
  };

  const shareQR = () => {
    try {
      qrRef.current?.toDataURL((data: string) => {
        Share.share({
          title: "Tourist QR",
          message: "Scan this QR to view tourist details.",
          url: `data:image/png;base64,${data}`,
        });
      });
    } catch (err) {
      console.log("Share QR error", err);
      Alert.alert("Error", "Could not share QR code.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <MaterialIcons name="shield" size={26} color="#60A5FA" />
        <Text style={styles.headerTitle}>SaFara Tourist ID</Text>

        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Feather name={statusIcon as any} size={14} color="#fff" />
          <Text style={styles.statusText}>
            {touristId.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.qrCard}>
        <QRCode
          value={`${PUBLIC_URL}/tourist/${touristId.id}`}
          size={220}
          backgroundColor="white"
          color="black"
          getRef={(c) => (qrRef.current = c)}
        />
        <Text style={styles.qrHint}>Scan this to view tourist details</Text>
      </View>

      <View style={styles.infoCard}>
        <InfoRow label="ID" value={touristId.id} mono />
        <InfoRow label="Holder" value={touristId.holderName} />
        <InfoRow label="Destination" value={touristId.destination} />
        <InfoRow label="Issue Date" value={issueDate.toDateString()} />
        <InfoRow label="Valid Until" value={validUntil.toDateString()} />
        <InfoRow
          label="Time Left"
          value={timeRemaining}
          highlight={timeRemaining === "Expired"}
        />
      </View>

      <View style={styles.actions}>
        <ActionButton
          icon="file-download"
          label="Download PDF"
          onPress={downloadPDF}
        />
        <ActionButton icon="share" label="Share QR" onPress={shareQR} />
      </View>
    </View>
  );
}

function InfoRow({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text
        style={[
          styles.infoValue,
          mono && styles.mono,
          highlight && { color: "#DC2626" },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
}: {
  icon: any;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
      <MaterialIcons name={icon} size={20} color="#fff" />
      <Text style={styles.actionText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: "#0B0B0B",
    borderRadius: 16,
  },
  headerCard: {
    backgroundColor: "#111827",
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  statusBadge: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignItems: "center",
    gap: 4,
  },
  statusText: {
    color: "white",
    fontSize: 12,
  },
  qrCard: {
    marginTop: 20,
    backgroundColor: "#1F2937",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
  },
  qrHint: {
    color: "#9CA3AF",
    marginTop: 8,
    fontSize: 12,
  },
  infoCard: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#1F2937",
    borderRadius: 16,
    gap: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoLabel: {
    color: "#9CA3AF",
  },
  infoValue: {
    color: "#fff",
    fontWeight: "600",
  },
  mono: {
    fontFamily: "monospace",
  },
  actions: {
    marginTop: 20,
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    color: "white",
    fontWeight: "600",
  },
});
