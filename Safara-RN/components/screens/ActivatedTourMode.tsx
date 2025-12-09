// src/components/screens/ActivatedTourMode.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import QRCodeDisplay from "./QRCodeDisplay";
import ChildPortal from "./ChildPortal";

export type TouristIdStatus = "active" | "expiring" | "expired";

export interface TouristId {
  id: string;
  destination: string;
  validUntil: Date;
  status: TouristIdStatus;
  holderName: string;
  issueDate: Date;
}

interface ActivatedTourModeProps {
  touristId: TouristId | null;
  theme: "light" | "dark";
  onSOS: () => void;
  onNavigate: (feature: string) => void;
  onLogout: () => void;
}

type TourToolView = "list" | "verify-identity" | "child-portal" | "family-circle";


export default function ActivatedTourMode({
  touristId,
  theme,
  onSOS,
  onNavigate,
  onLogout,
}: ActivatedTourModeProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>("—");
  const [toolView, setToolView] = useState<TourToolView>("list");

  const isActive = !!touristId && touristId.status === "active";
  const isDark = theme === "dark";

  useEffect(() => {
    if (!touristId) {
      setTimeRemaining("No active tour");
      return;
    }

    const updateTimeRemaining = () => {
      const now = new Date();
      const diff = touristId.validUntil.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeRemaining("Expired");
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      if (hours > 0) setTimeRemaining(`${hours}h ${minutes}m remaining`);
      else setTimeRemaining(`${minutes}m remaining`);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60_000);
    return () => clearInterval(interval);
  }, [touristId]);

  const features = [
    {
      id: "verify-identity",
      title: "Verify Identity",
      description: "Show QR code for offline verification",
      icon: "qr-code-outline" as const,
      color: "#2563eb",
    },
    {
      id: "track-location",
      title: "Track Location",
      description: "View map with geofence alerts",
      icon: "map-pin" as const,
      color: "#22c55e",
    },
    {
      id: "family-circle",
      title: "Family Circle",
      description: "Share location with trusted contacts",
      icon: "users" as const,
      color: "#6366f1",
    },
    {
      id: "child-portal",
      title: "Child Portal",
      description: "Get emergency notifications for your child",
      icon: "message-circle" as const,
      color: "#eab308",
    },
  ];

  function renderIcon(name: string, size: number, color: string) {
    if (name === "qr-code-outline") {
      return <Ionicons name="qr-code-outline" size={size} color={color} />;
    }
    if (name === "map-pin") {
      return <Feather name="map-pin" size={size} color={color} />;
    }
    if (name === "users") {
      return <Feather name="users" size={size} color={color} />;
    }
    if (name === "message-circle") {
      return <Feather name="message-circle" size={size} color={color} />;
    }
    return <Feather name="circle" size={size} color={color} />;
  }

  const bgScreen = isDark ? "#020617" : "#f9fafb";
  const topBg = isDark ? "#020617" : "#ffffff";
  const topBorder = isDark ? "#1f2937" : "#e5e7eb";
  const textMain = isDark ? "#f9fafb" : "#111827";
  const textSub = isDark ? "#9ca3af" : "#6b7280";
  const cardBg = isDark ? "#020617" : "#ffffff";
  const cardBorder = isDark ? "#1f2937" : "transparent";

  const showVerifyIdentity =
    toolView === "verify-identity" && isActive && touristId;
  const showChildPortal = toolView === "child-portal";

  return (
    <View style={[styles.screen, { backgroundColor: bgScreen }]}>
      <View
        style={[
          styles.topBar,
          { backgroundColor: topBg, borderBottomColor: topBorder },
        ]}
      >
        <View style={styles.topBarLeft}>
          <Feather name="shield" size={20} color="#2563eb" />
          <View style={{ marginLeft: 8 }}>
            <Text style={[styles.topTitle, { color: textMain }]}>
              Tour Mode
            </Text>
            <Text style={[styles.topSubtitle, { color: textSub }]}>
              {isActive ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>
        <Button variant="ghost" onPress={onLogout}>
          <View style={styles.logoutRow}>
            <Feather name="log-out" size={16} color="#ef4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </View>
        </Button>
      </View>

      {showVerifyIdentity ? (
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <View style={styles.verifyHeaderRow}>
            <TouchableOpacity
              onPress={() => setToolView("list")}
              style={styles.backRow}
            >
              <Feather name="arrow-left" size={18} color={textMain} />
              <Text style={[styles.backText, { color: textMain }]}>
                Back to tour tools
              </Text>
            </TouchableOpacity>
            <Text style={[styles.verifyTitle, { color: textMain }]}>
              Verify identity
            </Text>
          </View>

          <View style={{ marginTop: 12 }}>
            <QRCodeDisplay
              touristId={{
                id: touristId!.id,
                destination: touristId!.destination,
                validUntil: touristId!.validUntil,
                status: touristId!.status,
                holderName: touristId!.holderName,
                issueDate: touristId!.issueDate,
              }}
            />
          </View>
        </ScrollView>
      ) : showChildPortal ? (
        <View style={{ flex: 1 }}>
          <View
            style={[
              styles.childPortalHeader,
              { backgroundColor: topBg, borderBottomColor: topBorder },
            ]}
          >
            <TouchableOpacity
              onPress={() => setToolView("list")}
              style={styles.backRow}
            >
              <Feather name="arrow-left" size={18} color={textMain} />
              <Text style={[styles.backText, { color: textMain }]}>
                Back to tour tools
              </Text>
            </TouchableOpacity>
            <Text style={[styles.verifyTitle, { color: textMain }]}>
              Child Portal
            </Text>
          </View>
          <ChildPortal
            theme={theme}
            parentName={touristId?.holderName || "Guardian"}
            parentPhone="Unknown"
            parentEmail={undefined}
            children={[]} // plug real children list from backend/context later
            isChildSession={false}
            onOpenMapForChild={() => {}}
            onOpenDangerZones={() => {}}
            onNavigateToContacts={() => onNavigate("personal-safety")}
            onRequestLinkNewChild={() => onNavigate("family-circle")}
            onToggleShareLocation={() => {}}
            onToggleAutoSOSForward={() => {}}
          />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <View
            style={[
              styles.statusCard,
              { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
          >
            <View style={styles.statusRow}>
              <View>
                <Text style={[styles.labelSmall, { color: textSub }]}>
                  Destination
                </Text>
                <Text style={[styles.destinationText, { color: textMain }]}>
                  {touristId?.destination || "No active tour"}
                </Text>
              </View>
              <Badge variant="secondary">
                <View style={styles.timeBadgeRow}>
                  <Feather name="clock" size={12} color="#111827" />
                  <Text style={styles.timeBadgeText}>{timeRemaining}</Text>
                </View>
              </Badge>
            </View>
            <View style={styles.warningRow}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={16}
                color="#f59e0b"
              />
              <Text style={[styles.warningText, { color: textSub }]}>
                Press SOS to activate emergency protocols
              </Text>
            </View>
            <View style={{ marginTop: 12 }}>
              <Button
                onPress={isActive ? onSOS : undefined}
                disabled={!isActive}
              >
                <Text style={styles.sosText}>
                  {isActive
                    ? "SOS Emergency"
                    : "SOS disabled (no active tour)"}
                </Text>
              </Button>
            </View>
          </View>

          <View style={{ marginTop: 16 }}>
            <Text
              style={[
                styles.sectionTitle,
                { color: textMain, marginBottom: 8 },
              ]}
            >
              Tour tools
            </Text>
            {features.map((feature) => {
              const disabled = !isActive;
              const isVerify = feature.id === "verify-identity";
              const isChild = feature.id === "child-portal";

              const onPress = () => {
                if (disabled) return;
                if (isVerify) {
                  setToolView("verify-identity");
                } else if (isChild) {
                  setToolView("child-portal");
                } else {
                  onNavigate(feature.id);
                }
              };

              return (
                <TouchableOpacity
                  key={feature.id}
                  style={[
                    styles.sectionCard,
                    {
                      backgroundColor: cardBg,
                      borderColor: cardBorder,
                      opacity: disabled ? 0.6 : 1,
                    },
                  ]}
                  activeOpacity={disabled ? 1 : 0.8}
                  onPress={onPress}
                  disabled={disabled}
                >
                  <View style={styles.sectionInnerRow}>
                    <View
                      style={[
                        styles.iconBox,
                        { backgroundColor: feature.color },
                      ]}
                    >
                      {renderIcon(feature.icon, 24, "#ffffff")}
                    </View>
                    <View style={styles.sectionTextContainer}>
                      <View style={styles.sectionTitleRow}>
                        <Text
                          style={[
                            styles.sectionTitleText,
                            { color: textMain },
                          ]}
                        >
                          {feature.title}
                        </Text>
                        {!isActive && (
                          <Badge variant="outline">
                            <Text style={styles.badgeText}>
                              Requires active tour
                            </Text>
                          </Badge>
                        )}
                      </View>
                      <Text
                        style={[
                          styles.sectionDescription,
                          { color: textSub },
                        ]}
                      >
                        {feature.description}
                      </Text>
                    </View>
                    <Feather
                      name="chevron-right"
                      size={24}
                      color="#6b7280"
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topBarLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  topTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  topSubtitle: {
    fontSize: 12,
  },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoutText: {
    color: "#ef4444",
    marginLeft: 4,
    fontSize: 13,
    fontWeight: "500",
  },
  content: {
    padding: 16,
  },
  statusCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  labelSmall: {
    fontSize: 11,
  },
  destinationText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 2,
  },
  timeBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeBadgeText: {
    marginLeft: 4,
    color: "#111827",
    fontSize: 11,
    fontWeight: "500",
  },
  warningRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  warningText: {
    marginLeft: 6,
    fontSize: 12,
  },
  sosText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  sectionCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    borderWidth: 1,
  },
  sectionInnerRow: { flexDirection: "row", alignItems: "center" },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sectionTextContainer: { flex: 1 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center" },
  sectionTitleText: { fontSize: 16, fontWeight: "600", marginRight: 5 },
  sectionDescription: { marginTop: 4 },
  badgeText: {
    color: "#e5e7eb",
    fontSize: 10,
  },
  verifyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
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
  },
  verifyTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  childPortalHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});