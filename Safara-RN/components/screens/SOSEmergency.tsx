// Uses Expo Location, ImagePicker, and AV Audio APIs for permissions and media capture [web:74][web:27][web:86]

// src/components/screens/SOSEmergency.tsx

import React, { useState, useEffect, useRef } from "react";
import { SOCKET_API_BASE } from "../../config/api";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Linking,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { io, Socket } from "socket.io-client";
import Icon from "react-native-vector-icons/Feather";

import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";

import { useUserData } from "@/context/UserDataContext";
import { TouristIdRecord, saveTouristIdFromDraft } from "@/lib/touristId";

const SOCKET_URL = `${SOCKET_API_BASE}`; // update as needed
const API_BASE_URL = `${SOCKET_API_BASE}`; // update as needed

type LatLng = { lat: number; lng: number };
type EmergencyType =
  | "medical"
  | "harassment"
  | "accident"
  | "lost"
  | "theft"
  | "natural_disaster"
  | "suspicious_activity"
  | "other";

const EMERGENCY_TYPE_OPTIONS: { id: EmergencyType; label: string }[] = [
  { id: "medical", label: "Medical emergency" },
  { id: "harassment", label: "Harassment / threat" },
  { id: "accident", label: "Accident / injury" },
  { id: "lost", label: "Lost / need guidance" },
  { id: "theft", label: "Theft / missing items" },
  { id: "natural_disaster", label: "Flood / fire / disaster" },
  { id: "suspicious_activity", label: "Suspicious activity" },
  { id: "other", label: "Other" },
];
interface SOSEmergencyProps {
  userLocation?: LatLng;
  onCancel: () => void;
  onEscalate: () => void;
  pid_application_id?: string | null;
  pid_full_name?: string | null;
  pid_mobile?: string | null;
  pid_email?: string | null;
  pid_personal_id?: string | null;
  tid?: string | null;
  tid_status?: string | null;
  trip?: any;
}

const SAFETY_RED = "#DC2626";
const MUTED_TEXT = "#6B7280";
const BACKGROUND = "#FFFFFF";

export default function SOSEmergency(props: SOSEmergencyProps) {
  const { userLocation, onCancel, onEscalate } = props;

  const [description, setDescription] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [stage, setStage] = useState<"confirmation" | "details" | "escalation">(
    "confirmation"
  );

  const socketRef = useRef<Socket | null>(null);
  const emergencyIdRef = useRef<string | undefined>(undefined);

  const [touristRecord, setTouristRecord] = useState<TouristIdRecord | null>(
    null
  );

  const { personal, tourist } = useUserData();
  const personalRef = useRef(personal);
  const touristRef = useRef(tourist);

  const [currentLocation, setCurrentLocation] = useState<LatLng | undefined>(
    userLocation
  );
  const [requestingLocation, setRequestingLocation] = useState(false);

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | undefined>(undefined);
  const [photoBase64, setPhotoBase64] = useState<string | undefined>(undefined);
const [emergencyType, setEmergencyType] =
    useState<EmergencyType>("harassment");
  const [isChildInvolved, setIsChildInvolved] = useState<boolean>(false);
  // Keep refs synced with latest user data
  useEffect(() => {
    personalRef.current = personal;
    touristRef.current = tourist;
  }, [personal, tourist]);

  // Load TouristIdRecord from draft (async)
  useEffect(() => {
    let isMounted = true;

    const loadTouristRecord = async () => {
      try {
        const applicationId =
          personal?.pid_application_id || "default_user";
        const record = await saveTouristIdFromDraft(applicationId);
        if (isMounted) {
          setTouristRecord(record ?? null);
        }
      } catch (e) {
        if (isMounted) {
          setTouristRecord(null);
        }
      }
    };

    loadTouristRecord();

    return () => {
      isMounted = false;
    };
  }, [personal?.pid_application_id]);

  // Socket connection setup
  useEffect(() => {
    if (!SOCKET_URL) return;
    const s = io(SOCKET_URL, { transports: ["websocket", "polling"] });

    s.on("connect", () => {
      console.log("✅ Socket connected", s.id);
    });

    s.on("connect_error", (err) => {
      console.log("❌ Socket connect_error", err.message);
    });

    socketRef.current = s;
    return () => {
      try {
        s.disconnect();
      } catch {}
    };
  }, []);

  // Ask for foreground location and read current position when entering details stage
  useEffect(() => {
    if (stage !== "details") return;

    let isMounted = true;

    const requestAndGetLocation = async () => {
      try {
        setRequestingLocation(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Location permission",
            "Location permission was denied. Your SOS can still be sent, but location may not be attached."
          );
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });
        if (!isMounted) return;
        setCurrentLocation({
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
        });
      } catch (e) {
        if (isMounted) {
          Alert.alert(
            "Location error",
            "Could not determine your current location. You can still send the SOS."
          );
        }
      } finally {
        if (isMounted) {
          setRequestingLocation(false);
        }
      }
    };

    requestAndGetLocation();

    return () => {
      isMounted = false;
    };
  }, [stage]);

  // Stop any ongoing recording on unmount
  useEffect(() => {
    return () => {
      if (recording) {
        try {
          recording.stopAndUnloadAsync();
        } catch {}
      }
    };
  }, [recording]);

  // Escalation countdown
  useEffect(() => {
    if (stage === "escalation" && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (stage === "escalation" && countdown === 0) {
      handleEscalateToERSS();
    }
  }, [stage, countdown]);

  const handleConfirmSOS = () => {
    setStage("details");
  };

  const handleSubmitDetails = async () => {
    try {
      // Fallback identity for demo parity
      const storedFullName =
        (await AsyncStorage.getItem("pid_full_name")) || "Demo Tourist";
      const storedMobile =
        (await AsyncStorage.getItem("pid_mobile")) || "+911234567890";

      const p: any = personalRef.current;
      const t: any = touristRef.current;

      const location: LatLng | undefined =
        currentLocation ||
        (userLocation
          ? { lat: userLocation.lat, lng: userLocation.lng }
          : undefined);

      // const touristId =
      //   t?.id ||
      //   (await AsyncStorage.getItem("current_tid")) ||
      //   (await AsyncStorage.getItem("tourist_id")) ||
      //  // touristRecord?.id ||
      //   undefined;
        // ✅ 5 LINES - Gets MOST RECENT tourist_id
const keys = await AsyncStorage.getAllKeys();
const touristKeys = keys.filter(key => key.startsWith('tourist_id:'));
let touristId = null;

if (touristKeys.length > 0) {
  const latestKey = touristKeys[0];
  const data = await AsyncStorage.getItem(latestKey);
  touristId = data ? JSON.parse(data).id : null;
}

console.log("✅ TOURIST ID:", touristId);

console.log(touristId);

      const touristName = p?.pid_full_name || storedFullName || "Unknown";
      const touristPhone = p?.pid_mobile || storedMobile || "-";
       const touristEmail = p?.pid_email || (await AsyncStorage.getItem("pid_email")) || "-";
      const isDemo = !(await AsyncStorage.getItem("t_id"));

      const payload: any = {
        touristId,
        touristName,
        touristPhone,
        location,
         touristEmail,
        description:
          description && description.trim().length > 0
            ? description.trim()
            : "Demo SOS: Need urgent help near Rajwada Palace!",
        media: {
          audio: audioBase64,
          video: undefined,
          photo: photoBase64,
        },
        
        isDemo,
        timestamp: new Date().toISOString(),
        emergencyType,
        isChildInvolved,
      };

      // Server generates incident ID; keep reference slot
      emergencyIdRef.current = payload.id;

      console.log("📤 Sending SOS payload:", {
        ...payload,
        media: {
          audio: !!payload.media.audio,
          photo: !!payload.media.photo,
          video: !!payload.media.video,
        },
      });

      socketRef.current?.emit("sos-create", payload);

      setStage("escalation");
    } catch (error) {
      console.log("❌ SOS emit failed", error);
      Alert.alert(
        "Emergency failed",
        "Failed to create emergency alert. Please call 112 directly."
      );
    }
  };

  const handleEscalateToERSS = async () => {
    try {
      const emergencyId = emergencyIdRef.current;

      if (emergencyId) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/sos/${emergencyId}/escalate`,
            {
              method: "POST",
            }
          );
          if (response.ok) {
            await response.json();
          }
        } catch {
          // ignore HTTP escalation failure
        }
      }

      const phoneNumber = "112";
      await Linking.openURL(`tel:${phoneNumber}`);

      const emergencyInfo =
        "EMERGENCY - Call Immediately:\n" +
        "• India Emergency: 112\n" +
        "• Tourist Helpline: 1363\n" +
        "• Your location may be shared with authorities\n" +
        "• Emergency contacts may be notified\n\n" +
        "This is a real emergency alert - authorities are being contacted.";

      Alert.alert("Emergency call", emergencyInfo, [
        {
          text: "OK",
          onPress: () => {
            onEscalate();
          },
        },
      ]);
    } catch (error) {
      try {
        await Linking.openURL("tel:112");
      } catch {
        // ignore
      }
      onEscalate();
    }
  };

  const handleRecording = async () => {
    try {
      if (!recording) {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Microphone permission",
            "Microphone access is required to record audio evidence."
          );
          return;
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording: newRecording } =
          await Audio.Recording.createAsync(
            Audio.RecordingOptionsPresets.HIGH_QUALITY
          );
        setRecording(newRecording);
        setIsRecording(true);
      } else {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setIsRecording(false);
        setRecording(null);

        if (uri) {
          const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: "base64",
          });
          const dataUrl = `data:audio/m4a;base64,${base64}`;
          setAudioBase64(dataUrl);
        }
      }
    } catch (e) {
      console.log("❌ Audio recording error", e);
      Alert.alert(
        "Audio error",
        "Could not record audio. Please try again or continue without audio."
      );
      setIsRecording(false);
      setRecording(null);
    }
  };

  const handleCamera = async () => {
    try {
      const { status } =
        await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Camera permission",
          "Camera access is required to capture photo evidence."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0].base64) {
        const base64 = result.assets[0].base64;
        const dataUrl = `data:image/jpeg;base64,${base64}`;
        setPhotoBase64(dataUrl);
      }
    } catch (e) {
      console.log("❌ Camera error", e);
      Alert.alert(
        "Camera error",
        "Could not capture photo. Please try again or continue without photo."
      );
    }
  };

  // --- UI RENDERING ---

  if (stage === "confirmation") {
    return (
      <View style={styles.confirmationContainer}>
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <View style={styles.centerContent}>
              <View style={styles.iconCircle}>
                <Icon name="alert-triangle" size={40} color="#FFFFFF" />
              </View>

              <View style={styles.titleBlock}>
                <Text style={styles.titleText}>Emergency Alert</Text>
                <Text style={styles.subtitleText}>
                  You are about to activate emergency protocols
                </Text>
              </View>

              <View style={styles.infoList}>
                <View style={styles.infoRow}>
                  <Icon
                    name="map-pin"
                    size={16}
                    color={SAFETY_RED}
                    style={styles.infoIcon}
                  />
                  <Text style={styles.infoText}>
                    Location will be shared with emergency services
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Icon
                    name="phone"
                    size={16}
                    color={SAFETY_RED}
                    style={styles.infoIcon}
                  />
                  <Text style={styles.infoText}>
                    Emergency contacts will be notified
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Icon
                    name="shield"
                    size={16}
                    color={SAFETY_RED}
                    style={styles.infoIcon}
                  />
                  <Text style={styles.infoText}>
                    Incident will be logged with authorities
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.actionColumn}>
            <Pressable onPress={handleConfirmSOS} style={styles.primaryButton}>
              <Icon
                name="alert-triangle"
                size={20}
                color="#FFFFFF"
                style={styles.buttonIcon}
              />
              <Text style={styles.primaryButtonText}>Confirm Emergency</Text>
            </Pressable>

            <Pressable onPress={onCancel} style={styles.outlineButton}>
              <Text style={styles.outlineButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  if (stage === "details") {
    return (
      <View style={styles.detailsRoot}>
        <View style={styles.detailsHeader}>
          <View style={styles.detailsHeaderContent}>
            <Icon name="alert-triangle" size={24} color="#FFFFFF" />
            <View style={styles.detailsHeaderTextBlock}>
              <Text style={styles.detailsHeaderTitle}>Emergency Details</Text>
              <Text style={styles.detailsHeaderSubtitle}>
                Provide information about the situation
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.detailsScroll}
          contentContainerStyle={styles.detailsScrollContent}
        >
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Current Location</Text>
            <View style={styles.locationRow}>
              <Icon
                name="map-pin"
                size={16}
                color={SAFETY_RED}
                style={styles.infoIcon}
              />
              <Text style={styles.locationText}>
                {currentLocation
                  ? `${currentLocation.lat.toFixed(
                      6
                    )}, ${currentLocation.lng.toFixed(6)}`
                  : requestingLocation
                  ? "Location being determined..."
                  : "Location permission required or unavailable"}
              </Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Live</Text>
              </View>
            </View>
          </View>


          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Emergency Type</Text>
            <Text style={styles.helperText}>
              Choose the option that best matches your situation. This helps
              authorities respond faster.
            </Text>
            <View style={styles.chipRow}>
              {EMERGENCY_TYPE_OPTIONS.map((opt) => {
                const selected = emergencyType === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    style={[
                      styles.chip,
                      selected && styles.chipSelected,
                    ]}
                    onPress={() => setEmergencyType(opt.id)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selected && styles.chipTextSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              style={styles.childToggleRow}
              onPress={() => setIsChildInvolved((prev) => !prev)}
            >
              <View
                style={[
                  styles.checkbox,
                  isChildInvolved && styles.checkboxChecked,
                ]}
              >
                {isChildInvolved && (
                  <Icon
                    name="check"
                    size={14}
                    color="#FFFFFF"
                  />
                )}
              </View>
              <Text style={styles.childToggleText}>
                Incident involves a child or under‑18 traveller
              </Text>
            </Pressable>
          </View>


          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Describe the Situation</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Briefly describe what happened or what help you need..."
              placeholderTextColor={MUTED_TEXT}
              multiline
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Add Evidence (Optional)</Text>
            <View style={styles.evidenceRow}>
              <Pressable
                onPress={handleCamera}
                style={styles.outlineSmallButton}
              >
                <Icon
                  name="camera"
                  size={16}
                  color={SAFETY_RED}
                  style={styles.buttonIcon}
                />
                <Text style={styles.outlineSmallButtonText}>Photo</Text>
              </Pressable>

              <Pressable
                onPress={handleRecording}
                style={[
                  styles.outlineSmallButton,
                  isRecording && styles.recordingButton,
                ]}
              >
                <Icon
                  name="mic"
                  size={16}
                  color={SAFETY_RED}
                  style={styles.buttonIcon}
                />
                <Text style={styles.outlineSmallButtonText}>
                  {isRecording ? "Stop Recording" : "Audio"}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.actionColumn}>
            <Pressable onPress={handleSubmitDetails} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Send Emergency Alert</Text>
            </Pressable>

            <Pressable onPress={onCancel} style={styles.ghostButton}>
              <Text style={styles.ghostButtonText}>Cancel Emergency</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Escalation stage
  return (
    <View style={styles.escalationRoot}>
      <View style={styles.escalationContent}>
        <View style={styles.pulseCircle}>
          <View style={styles.innerCircle}>
            <Icon name="phone" size={48} color={SAFETY_RED} />
          </View>
        </View>

        <View style={styles.escalationTextBlock}>
          <Text style={styles.escalationTitle}>
            Connecting to Emergency Services
          </Text>
          <Text style={styles.escalationSubtitle}>
            Escalating to ERSS-112 system...
          </Text>
        </View>

        <View style={[styles.card, styles.escalationCard]}>
          <View style={styles.countdownRow}>
            <Icon name="clock" size={20} color="#FFFFFF" />
            <Text style={styles.countdownText}>{countdown}s</Text>
          </View>
          <Text style={styles.escalationCardText}>
            Automatically connecting to emergency services
          </Text>
        </View>

        <Pressable
          onPress={handleEscalateToERSS}
          style={styles.escalationPrimaryButton}
        >
          <Icon
            name="external-link"
            size={20}
            color={SAFETY_RED}
            style={styles.buttonIcon}
          />
          <Text style={styles.escalationPrimaryButtonText}>Connect Now</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  confirmationContainer: {
    flex: 1,
    backgroundColor: "rgba(220,38,38,0.1)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  cardContainer: {
    width: "100%",
    maxWidth: 400,
  },
  card: {
    backgroundColor: BACKGROUND,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: SAFETY_RED,
    marginBottom: 16,
  },
  centerContent: {
    alignItems: "center",
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: SAFETY_RED,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  titleBlock: {
    alignItems: "center",
    marginBottom: 16,
  },
  titleText: {
    fontSize: 20,
    fontWeight: "700",
    color: SAFETY_RED,
  },
  subtitleText: {
    marginTop: 8,
    fontSize: 14,
    color: MUTED_TEXT,
    textAlign: "center",
  },
  infoList: {
    width: "100%",
    marginTop: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#111827",
    flex: 1,
  },
  actionColumn: {
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: SAFETY_RED,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  outlineButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  outlineButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
  },
  buttonIcon: {
    marginRight: 8,
  },
  detailsRoot: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  detailsHeader: {
    backgroundColor: SAFETY_RED,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  detailsHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailsHeaderTextBlock: {
    marginLeft: 8,
  },
  detailsHeaderTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  detailsHeaderSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    marginTop: 2,
  },
  detailsScroll: {
    flex: 1,
  },
  detailsScrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#111827",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: 14,
    color: "#111827",
    flexShrink: 1,
  },
  badge: {
    marginLeft: "auto",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#F3F4F6",
  },
  badgeText: {
    fontSize: 12,
    color: "#111827",
    fontWeight: "500",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 10,
    minHeight: 96,
    textAlignVertical: "top",
    fontSize: 14,
    color: "#111827",
  },
  evidenceRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  outlineSmallButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  outlineSmallButtonText: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  recordingButton: {
    backgroundColor: "rgba(220,38,38,0.1)",
    borderColor: SAFETY_RED,
  },
  ghostButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
  },
  escalationRoot: {
    flex: 1,
    backgroundColor: SAFETY_RED,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  escalationContent: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  pulseCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  innerCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  escalationTextBlock: {
    alignItems: "center",
    marginBottom: 16,
  },
  escalationTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
    textAlign: "center",
  },
  escalationSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  escalationCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderColor: "rgba(255,255,255,0.2)",
  },
  countdownRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  countdownText: {
    fontSize: 18,
    color: "#FFFFFF",
    marginLeft: 8,
  },
  escalationCardText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  escalationPrimaryButton: {
    marginTop: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  escalationPrimaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: SAFETY_RED,
  },
  helperText: {
    fontSize: 12,
    color: MUTED_TEXT,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    marginRight: 6,
    marginBottom: 6,
  },
  chipSelected: {
    backgroundColor: SAFETY_RED,
    borderColor: SAFETY_RED,
  },
  chipText: {
    fontSize: 12,
    color: "#111827",
  },
  chipTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  childToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: SAFETY_RED,
    borderColor: SAFETY_RED,
  },
  childToggleText: {
    fontSize: 13,
    color: "#111827",
    flexShrink: 1,
  },

});



