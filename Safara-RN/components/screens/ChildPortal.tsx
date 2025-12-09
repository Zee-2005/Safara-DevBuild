// src/components/screens/ChildPortal.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";

type ChildProfile = {
  id: string;
  name: string;
  age: number;
  relation: string;
  phone: string;
  email?: string;
  lastKnownLocation?: {
    label: string;
    time: string;
  };
  activeTrip?: {
    destination: string;
    status: "active" | "scheduled" | "ended";
  } | null;
};

type ChildPortalProps = {
  theme: "light" | "dark";
  // Parent contact details (for display only here)
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  // All linked children for this parent
  children: ChildProfile[];
  // Whether this device/app session belongs to a child user
  isChildSession: boolean;
  // Callbacks to wire with backend / sockets
  onOpenMapForChild?: (childId: string) => void;
  onOpenDangerZones?: (childId: string) => void;
  onNavigateToContacts?: () => void;
  onRequestLinkNewChild?: () => void;
  onToggleShareLocation?: (enabled: boolean) => void;
  onToggleAutoSOSForward?: (enabled: boolean) => void;
};

export default function ChildPortal({
  theme,
  parentName,
  parentPhone,
  parentEmail,
  children,
  isChildSession,
  onOpenMapForChild,
  onOpenDangerZones,
  onNavigateToContacts,
  onRequestLinkNewChild,
  onToggleShareLocation,
  onToggleAutoSOSForward,
}: ChildPortalProps) {
  const isDark = theme === "dark";

  const [shareLocationEnabled, setShareLocationEnabled] = useState(true);
  const [autoForwardSOS, setAutoForwardSOS] = useState(true);
  const [dangerZoneAlerts, setDangerZoneAlerts] = useState(true);

  const bgScreen = isDark ? "#020617" : "#f9fafb";
  const cardBg = isDark ? "#020617" : "#ffffff";
  const cardBorder = isDark ? "#1f2937" : "#e5e7eb";
  const textMain = isDark ? "#f9fafb" : "#111827";
  const textSub = isDark ? "#9ca3af" : "#6b7280";

  const handleToggleShareLocation = (value: boolean) => {
    setShareLocationEnabled(value);
    onToggleShareLocation && onToggleShareLocation(value);
  };

  const handleToggleAutoSOS = (value: boolean) => {
    setAutoForwardSOS(value);
    onToggleAutoSOSForward && onToggleAutoSOSForward(value);
  };

  const handleToggleDangerAlerts = (value: boolean) => {
    setDangerZoneAlerts(value);
    // you can expose a callback if needed later
  };

  function renderChildCard(child: ChildProfile) {
    const trip = child.activeTrip;
    let tripLabel = "No active trip";
    let tripBadgeColor = "#6b7280";

    if (trip) {
      if (trip.status === "active") {
        tripLabel = `On trip to ${trip.destination}`;
        tripBadgeColor = "#16a34a";
      } else if (trip.status === "scheduled") {
        tripLabel = `Upcoming trip to ${trip.destination}`;
        tripBadgeColor = "#eab308";
      } else {
        tripLabel = `Last trip: ${trip.destination}`;
        tripBadgeColor = "#6b7280";
      }
    }

    return (
      <View
        key={child.id}
        style={[
          styles.childCard,
          { backgroundColor: cardBg, borderColor: cardBorder },
        ]}
      >
        <View style={styles.childHeaderRow}>
          <View style={styles.childAvatar}>
            <Text style={styles.childAvatarText}>
              {child.name?.charAt(0)?.toUpperCase() || "C"}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.childName, { color: textMain }]}>
              {child.name}
            </Text>
            <Text style={[styles.childMeta, { color: textSub }]}>
              {child.age} yrs • {child.relation}
            </Text>
          </View>
          <View
            style={[
              styles.badge,
              { backgroundColor: tripBadgeColor, borderColor: tripBadgeColor },
            ]}
          >
            <Text style={styles.badgeText}>{trip ? trip.status.toUpperCase() : "NO TRIP"}</Text>
          </View>
        </View>

        <View style={styles.childInfoRow}>
          <View style={styles.infoItemRow}>
            <Feather name="phone" size={14} color={textSub} />
            <Text style={[styles.infoItemText, { color: textSub }]}>
              {child.phone || "No phone"}
            </Text>
          </View>
          {child.email ? (
            <View style={styles.infoItemRow}>
              <Feather name="mail" size={14} color={textSub} />
              <Text style={[styles.infoItemText, { color: textSub }]}>
                {child.email}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.childInfoRow}>
          <View style={styles.infoItemRow}>
            <Feather name="map-pin" size={14} color={textSub} />
            <Text style={[styles.infoItemText, { color: textSub }]}>
              {child.lastKnownLocation?.label || "Location not available"}
            </Text>
          </View>
          {child.lastKnownLocation?.time ? (
            <Text style={[styles.infoItemMeta, { color: textSub }]}>
              Updated {child.lastKnownLocation.time}
            </Text>
          ) : null}
        </View>

        <View style={styles.childActionsRow}>
          <TouchableOpacity
            style={[styles.smallButton, { borderColor: "#22c55e" }]}
            onPress={() => onOpenMapForChild && onOpenMapForChild(child.id)}
          >
            <Ionicons name="navigate-outline" size={16} color="#22c55e" />
            <Text style={[styles.smallButtonText, { color: "#22c55e" }]}>
              Live location
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.smallButton, { borderColor: "#eab308" }]}
            onPress={() => onOpenDangerZones && onOpenDangerZones(child.id)}
          >
            <Feather name="alert-triangle" size={16} color="#eab308" />
            <Text style={[styles.smallButtonText, { color: "#eab308" }]}>
              Danger zones
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.smallButton, { borderColor: "#2563eb" }]}
            onPress={onNavigateToContacts}
          >
            <Feather name="users" size={16} color="#2563eb" />
            <Text style={[styles.smallButtonText, { color: "#2563eb" }]}>
              Contacts
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: bgScreen }]}>
      <View
        style={[
          styles.topBar,
          { backgroundColor: isDark ? "#020617" : "#ffffff", borderBottomColor: cardBorder },
        ]}
      >
        <View style={styles.topLeft}>
          <View style={styles.iconCircleMain}>
            <Feather name="shield" size={18} color="#ffffff" />
          </View>
          <View>
            <Text style={[styles.topTitle, { color: textMain }]}>
              Child Safety Portal
            </Text>
            <Text style={[styles.topSubtitle, { color: textSub }]}>
              Linked family devices, alerts and controls
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Parent summary */}
        <View
          style={[
            styles.card,
            { backgroundColor: cardBg, borderColor: cardBorder },
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: textMain }]}>
              Parent contact
            </Text>
            {isChildSession ? (
              <View style={[styles.badge, { borderColor: "#f97316" }]}>
                <Text style={[styles.badgeText, { color: "#f97316" }]}>
                  Child device
                </Text>
              </View>
            ) : (
              <View style={[styles.badge, { borderColor: "#22c55e" }]}>
                <Text style={[styles.badgeText, { color: "#22c55e" }]}>
                  Guardian
                </Text>
              </View>
            )}
          </View>

          <View style={styles.infoRowParent}>
            <View style={styles.infoItemRow}>
              <Feather name="user" size={16} color={textSub} />
              <Text style={[styles.infoItemText, { color: textMain }]}>
                {parentName}
              </Text>
            </View>
            <View style={styles.infoItemRow}>
              <Feather name="phone" size={16} color={textSub} />
              <Text style={[styles.infoItemText, { color: textSub }]}>
                {parentPhone}
              </Text>
            </View>
            {parentEmail ? (
              <View style={styles.infoItemRow}>
                <Feather name="mail" size={16} color={textSub} />
                <Text style={[styles.infoItemText, { color: textSub }]}>
                  {parentEmail}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Children list or empty state */}
        <View
          style={[
            styles.card,
            { backgroundColor: cardBg, borderColor: cardBorder },
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: textMain }]}>
              Linked children
            </Text>
            <Text style={[styles.sectionSubtitle, { color: textSub }]}>
              SOS and danger-zone alerts will be shared here
            </Text>
          </View>

          {children.length === 0 ? (
            <View style={styles.emptyChildren}>
              <Feather name="users" size={32} color={textSub} />
              <Text style={[styles.emptyTitle, { color: textMain }]}>
                No child profiles linked
              </Text>
              <Text style={[styles.emptyText, { color: textSub }]}>
                Link your child’s SaFara app to monitor alerts, trips and live
                location.
              </Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={onRequestLinkNewChild}
              >
                <Feather name="plus-circle" size={18} color="#ffffff" />
                <Text style={styles.primaryButtonText}>
                  Link a child device
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {children.map(renderChildCard)}
              <TouchableOpacity
                style={[styles.outlineButton, { borderColor: "#4b5563" }]}
                onPress={onRequestLinkNewChild}
              >
                <Feather name="plus" size={16} color="#4b5563" />
                <Text style={[styles.outlineButtonText, { color: "#4b5563" }]}>
                  Add another child
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Safety rules & automations */}
        <View
          style={[
            styles.card,
            { backgroundColor: cardBg, borderColor: cardBorder },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: textMain }]}>
            Safety rules
          </Text>
          <Text style={[styles.sectionSubtitle, { color: textSub }]}>
            Control how alerts and location are shared between you and your
            child.
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingTextBlock}>
              <Text style={[styles.settingTitle, { color: textMain }]}>
                Share live location with parent
              </Text>
              <Text style={[styles.settingDesc, { color: textSub }]}>
                Allows SaFara to share your current location with linked
                guardians during trips and SOS events.
              </Text>
            </View>
            <Switch
              value={shareLocationEnabled}
              onValueChange={handleToggleShareLocation}
              thumbColor={shareLocationEnabled ? "#22c55e" : "#9ca3af"}
              trackColor={{ true: "#bbf7d0", false: "#e5e7eb" }}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingTextBlock}>
              <Text style={[styles.settingTitle, { color: textMain }]}>
                Auto-forward child SOS to parents
              </Text>
              <Text style={[styles.settingDesc, { color: textSub }]}>
                When your child presses SOS, parents receive the alert before it
                is escalated to authorities.
              </Text>
            </View>
            <Switch
              value={autoForwardSOS}
              onValueChange={handleToggleAutoSOS}
              thumbColor={autoForwardSOS ? "#f97316" : "#9ca3af"}
              trackColor={{ true: "#fed7aa", false: "#e5e7eb" }}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingTextBlock}>
              <Text style={[styles.settingTitle, { color: textMain }]}>
                Danger-zone alerts for parents
              </Text>
              <Text style={[styles.settingDesc, { color: textSub }]}>
                Notify guardians when a child enters or stays in a marked
                danger zone.
              </Text>
            </View>
            <Switch
              value={dangerZoneAlerts}
              onValueChange={handleToggleDangerAlerts}
              thumbColor={dangerZoneAlerts ? "#ef4444" : "#9ca3af"}
              trackColor={{ true: "#fecaca", false: "#e5e7eb" }}
            />
          </View>
        </View>

        {/* Info card */}
        <View
          style={[
            styles.card,
            { backgroundColor: isDark ? "#0f172a" : "#eef2ff", borderColor: "transparent" },
          ]}
        >
          <View style={styles.infoBannerRow}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={isDark ? "#c4b5fd" : "#4c1d95"}
            />
            <Text
              style={[
                styles.infoBannerText,
                { color: isDark ? "#e5e7eb" : "#312e81" },
              ]}
            >
              Child Portal is designed for under‑18 travellers. Guardians should
              regularly review linked devices and safety rules together with the
              child.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircleMain: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#7c3aed",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  topTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  topSubtitle: {
    fontSize: 12,
  },
  scroll: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  sectionSubtitle: {
    marginTop: 2,
    fontSize: 12,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#ffffff",
  },
  infoRowParent: {
    marginTop: 8,
    gap: 4,
  },
  infoItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  infoItemText: {
    fontSize: 13,
  },
  infoItemMeta: {
    fontSize: 11,
  },
  childCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 10,
  },
  childHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  childAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  childAvatarText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  childName: {
    fontSize: 15,
    fontWeight: "600",
  },
  childMeta: {
    fontSize: 12,
  },
  childInfoRow: {
    marginTop: 8,
  },
  childActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  smallButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 5,
  },
  smallButtonText: {
    fontSize: 11,
    fontWeight: "500",
  },
  emptyChildren: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 12,
    textAlign: "center",
  },
  primaryButton: {
    marginTop: 6,
    backgroundColor: "#2563eb",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  outlineButton: {
    marginTop: 10,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  outlineButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  settingRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  settingTextBlock: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  settingDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  infoBannerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  infoBannerText: {
    fontSize: 11,
    flex: 1,
  },
});