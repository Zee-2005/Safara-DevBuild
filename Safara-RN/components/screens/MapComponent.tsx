// src/components/MapComponent.tsx

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MapLibreGL from "@maplibre/maplibre-react-native";
import * as Location from "expo-location";
import { io, Socket } from "socket.io-client";

import { useUserData } from "@/context/UserDataContext";

const SOCKET_URL = "http://192.168.0.106:3000"; // your backend socket URL
const MAPTILER_KEY = "K183PqmMToR2O89INJ40";   // same key as web, change if needed

// Required by MapLibre RN; Mapbox token not needed, set to null to avoid crash. [web:113][web:129]
MapLibreGL.setAccessToken(null);

type LatLng = { lat: number; lng: number };

type Props = {
  userLocation?: LatLng;
  onGeofenceAlert?: (payload: {
    type: "zone" | "boundary";
    name: string;
    risk?: string;
  }) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
};

type ZoneUpdatePayload = {
  id: string;
  name: string;
  risk?: string;
  type: "circle" | "polygon";
  coords: any;
  radius?: number;
};

type BoundaryUpdatePayload = {
  id: string;
  name: string;
  type: "circle" | "polygon";
  center?: { lat: number; lng: number };
  coords?: { lat: number; lng: number }[];
  radius?: number;
};

type HeatmapPoint = [number, number]; // [lng, lat]

type TimerHandle = ReturnType<typeof setInterval>;

const DEFAULT_CENTER: [number, number] = [78.9629, 20.5937]; // India center [lng, lat]

// Repeating zone reminder timers (keyed by `${tid}_${zoneOrBoundaryName}`)
const zoneAlertTimers: Record<string, TimerHandle> = {};

function stopZoneAlert(zoneKey: string) {
  const t = zoneAlertTimers[zoneKey];
  if (t) {
    clearInterval(t);
    delete zoneAlertTimers[zoneKey];
    console.log("🛑 Zone alert stopped =>", zoneKey);
  }
}

// Risk → color helper (for layers)
function riskColor(risk?: string): string {
  if (!risk) return "#22c55e";
  const r = risk.toLowerCase();
  if (r === "high") return "#ef4444";
  if (r === "medium") return "#f97316";
  return "#22c55e";
}

export default function MapComponent({
  userLocation,
  onGeofenceAlert,
  isFullscreen = true,
  onToggleFullscreen,
}: Props) {
  const { personal, tourist } = useUserData();
  const personalRef = useRef(personal);
  const touristRef = useRef(tourist);

  const socketRef = useRef<Socket | null>(null);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);

  // GeoJSON state for sources
  const [touristFeatures, setTouristFeatures] = useState<any[]>([]);
  const [zoneCircleFeatures, setZoneCircleFeatures] = useState<any[]>([]);
  const [zonePolygonFeatures, setZonePolygonFeatures] = useState<any[]>([]);
  const [boundaryFeatures, setBoundaryFeatures] = useState<any[]>([]);
  const [heatmapFeatures, setHeatmapFeatures] = useState<any[]>([]);

  const [currentLocation, setCurrentLocation] = useState<LatLng | undefined>(
    userLocation
  );

  const [requestingLocation, setRequestingLocation] = useState(false);

  // Alert UI state
  const [zoneAlertVisible, setZoneAlertVisible] = useState(false);
  const [zoneAlertData, setZoneAlertData] = useState<{
    zoneName: string;
    risk?: string;
  } | null>(null);

  const [boundaryAlertVisible, setBoundaryAlertVisible] = useState(false);
  const [boundaryAlertName, setBoundaryAlertName] = useState<string | null>(
    null
  );

  // Keep refs updated
  useEffect(() => {
    personalRef.current = personal;
    touristRef.current = tourist;
  }, [personal, tourist]);

  // Socket setup
  useEffect(() => {
    if (!SOCKET_URL) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on("connect", async () => {
      console.log("🛰️ Map socket connected", socket.id);
      const p: any = personalRef.current;
      const t: any = touristRef.current;

      // Fallback to stored TID if needed
      const storedTid = await AsyncStorage.getItem("current_tid");
      const touristId = t?.tid || storedTid || null;

      socket.emit("register-tourist", {
        touristId,
        personalId: p?.pid_personal_id,
        name: p?.pid_full_name || "Unknown",
        email: p?.pid_email || "-",
        phone: p?.pid_mobile || "-",
        nationality: p?.pid_nationality || "Indian",
      });
    });

    socket.on("connect_error", (err) => {
      console.log("❌ Map socket connect_error", err.message);
    });

    // Other tourists' locations
    socket.on("receive-location", (payload: any) => {
      const {
        id,
        socketId,
        touristId,
        latitude,
        longitude,
      } = payload || {};
      if (typeof latitude !== "number" || typeof longitude !== "number") {
        return;
      }
      const featureId = id || socketId || touristId || `unknown-${Date.now()}`;

      setTouristFeatures((prev) => {
        const next = [...prev];
        const idx = next.findIndex(
          (f) => f.properties && f.properties.id === featureId
        );
        const feature = {
          type: "Feature",
          id: featureId,
          properties: { id: featureId },
          geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
        };
        if (idx >= 0) {
          next[idx] = feature;
        } else {
          next.push(feature);
        }
        return next;
      });
    });

    socket.on("user-disconnected", (id: string) => {
      setTouristFeatures((prev) =>
        prev.filter((f) => f.properties?.id !== id)
      );
    });

    // Zones
    socket.on("zone-update", (data: ZoneUpdatePayload) => {
      const { id, name, risk, type, coords } = data;
      if (!coords) return;

      if (type === "circle") {
        const center =
          Array.isArray(coords) && coords.length > 0
            ? coords[0]
            : coords;
        const lat = center.lat;
        const lng = center.lng;
        if (typeof lat !== "number" || typeof lng !== "number") return;

        setZoneCircleFeatures((prev) => {
          const others = prev.filter((f) => f.properties?.id !== id);
          const feature = {
            type: "Feature",
            id,
            properties: {
              id,
              name,
              risk: risk || "low",
            },
            geometry: {
              type: "Point",
              coordinates: [lng, lat],
            },
          };
          return [...others, feature];
        });
      } else if (type === "polygon") {
        const coordsArr: { lat: number; lng: number }[] = coords || [];
        if (!coordsArr.length) return;
        const ring = coordsArr.map((c) => [c.lng, c.lat]);
        // Close ring
        if (
          ring.length > 0 &&
          (ring[0][0] !== ring[ring.length - 1][0] ||
            ring[0][1] !== ring[ring.length - 1][1])
        ) {
          ring.push(ring[0]);
        }

        setZonePolygonFeatures((prev) => {
          const others = prev.filter((f) => f.properties?.id !== id);
          const feature = {
            type: "Feature",
            id,
            properties: {
              id,
              name,
              risk: risk || "low",
            },
            geometry: {
              type: "Polygon",
              coordinates: [ring],
            },
          };
          return [...others, feature];
        });
      }
    });

    // Heatmap
    socket.on("heatmap-update", (points: HeatmapPoint[]) => {
      const features =
        points?.map(([lng, lat], idx) => ({
          type: "Feature",
          id: `heat-${idx}`,
          properties: {},
          geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
        })) || [];
      setHeatmapFeatures(features);
    });

    // Boundaries
    socket.on("boundary-update", (b: BoundaryUpdatePayload) => {
      const { id, name, type, center, coords } = b;

      if (type === "circle" && center) {
        const { lat, lng } = center;
        if (typeof lat !== "number" || typeof lng !== "number") return;

        setBoundaryFeatures((prev) => {
          const others = prev.filter((f) => f.properties?.id !== id);
          const feature = {
            type: "Feature",
            id,
            properties: {
              id,
              name,
              type: "circle",
            },
            geometry: {
              type: "Point",
              coordinates: [lng, lat],
            },
          };
          return [...others, feature];
        });
      } else if (type === "polygon" && coords && coords.length) {
        const ring = coords.map((c) => [c.lng, c.lat]);
        if (
          ring.length > 0 &&
          (ring[0][0] !== ring[ring.length - 1][0] ||
            ring[0][1] !== ring[ring.length - 1][1])
        ) {
          ring.push(ring[0]);
        }

        setBoundaryFeatures((prev) => {
          const others = prev.filter((f) => f.properties?.id !== id);
          const feature = {
            type: "Feature",
            id,
            properties: {
              id,
              name,
              type: "polygon",
            },
            geometry: {
              type: "Polygon",
              coordinates: [ring],
            },
          };
          return [...others, feature];
        });
      }
    });

    // Zone alerts (with repeating reminder)
    socket.on("zone-alert", ({ touristId, zoneName, risk }: any) => {
      const myTid = touristRef.current?.tid || null;
      // Note: web version currently does *not* filter by tid (commented out),
      // so all alerts are shown. That behavior is preserved here.

      const zoneKey = `${myTid || "unknown"}_${zoneName}`;

      onGeofenceAlert?.({ type: "zone", name: zoneName, risk });

      setZoneAlertData({ zoneName, risk });
      setZoneAlertVisible(true);

      if (!zoneAlertTimers[zoneKey]) {
        zoneAlertTimers[zoneKey] = setInterval(() => {
          onGeofenceAlert?.({ type: "zone", name: zoneName, risk });
          setZoneAlertData({ zoneName, risk });
          setZoneAlertVisible(true);
        }, 10 * 60 * 1000);
      }
    });

    // Outside boundary alerts (stop zone reminders + one-shot alert)
    socket.on("outside-boundary-alert", (data: any) => {
      const myTid = touristRef.current?.tid || null;
      if (data.touristId && myTid && data.touristId !== myTid) return;

      const zoneKey = `${myTid || "unknown"}_${data.boundaryName}`;
      stopZoneAlert(zoneKey);

      onGeofenceAlert?.({
        type: "boundary",
        name: data.boundaryName,
      });

      setBoundaryAlertName(data.boundaryName);
      setBoundaryAlertVisible(true);
    });

    return () => {
      Object.keys(zoneAlertTimers).forEach((key) => stopZoneAlert(key));
      socket.off();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [onGeofenceAlert]);

  // Location tracking → send live-tourist-data
  useEffect(() => {
    let isMounted = true;

    const startLocation = async () => {
      try {
        setRequestingLocation(true);
        const { status } =
          await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Location permission",
            "Location permission was denied. Live tracking will be limited."
          );
          return;
        }

        const sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Highest,
            timeInterval: 5000,
            distanceInterval: 5,
          },
          async (loc) => {
            if (!isMounted) return;
            const { latitude, longitude } = loc.coords;
            setCurrentLocation({ lat: latitude, lng: longitude });

            const p: any = personalRef.current;
            const t: any = touristRef.current;

            const storedTid = await AsyncStorage.getItem("current_tid");
            const touristId = t?.tid || storedTid || null;

            const payload = {
              latitude,
              longitude,
              timestamp: new Date().toISOString(),
              touristId,
              personalId: p?.pid_personal_id,
              name: p?.pid_full_name || "Unknown",
              phone: p?.pid_mobile || "-",
              email: p?.pid_email || "-",
              nationality: p?.pid_nationality || "-",
              destination: t?.trip?.destination || "-",
              tripStart: t?.trip?.startDate || "-",
              tripEnd: t?.trip?.endDate || "-",
              status: t?.tid_status || "active",
            };

            console.log("📡 live-tourist-data", payload);

            socketRef.current?.emit("live-tourist-data", payload);
          }
        );

        locationSubRef.current = sub;
      } catch (e) {
        console.log("❌ Location watch error", e);
      } finally {
        if (isMounted) setRequestingLocation(false);
      }
    };

    startLocation();

    return () => {
      isMounted = false;
      if (locationSubRef.current) {
        locationSubRef.current.remove();
        locationSubRef.current = null;
      }
    };
  }, []);

  // Camera initial center
  const initialCenter: [number, number] =
    currentLocation && !requestingLocation
      ? [currentLocation.lng, currentLocation.lat]
      : DEFAULT_CENTER;

  const initialZoom = currentLocation ? 13 : 5;

  // Layer styles
  const touristsCircleStyle = {
    circleRadius: 4,
    circleColor: "#2563eb",
    circleStrokeWidth: 1,
    circleStrokeColor: "#ffffff",
  };

  const zoneCircleStyle = {
    circleRadius: 18,
    circleColor: "#f97316",
    circleOpacity: 0.3,
    circleStrokeColor: "#f97316",
    circleStrokeWidth: 2,
  };

  const zonePolygonStyle = {
    fillColor: "#f97316",
    fillOpacity: 0.2,
    fillOutlineColor: "#f97316",
  };

  const boundaryStyle = {
    fillColor: "#3b82f6",
    fillOpacity: 0.12,
    fillOutlineColor: "#3b82f6",
  };

  const heatmapStyle = {
    heatmapRadius: 24,
    heatmapOpacity: 0.9,
  };

  return (
    <View style={styles.root}>
  <MapLibreGL.MapView
    style={styles.map}
    mapStyle={`https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`}
    logoEnabled={false}
    attributionEnabled={true}
  >
        <MapLibreGL.Camera
          defaultSettings={{
            centerCoordinate: initialCenter,
            zoomLevel: initialZoom,
          }}
        />

        {/* Other tourists */}
        {touristFeatures.length > 0 && (
          <MapLibreGL.ShapeSource
            id="tourists-source"
            shape={{
              type: "FeatureCollection",
              features: touristFeatures,
            }}
          >
            <MapLibreGL.CircleLayer
              id="tourists-layer"
              style={touristsCircleStyle}
            />
          </MapLibreGL.ShapeSource>
        )}

        {/* Zones: circles */}
        {zoneCircleFeatures.length > 0 && (
          <MapLibreGL.ShapeSource
            id="zones-circle-source"
            shape={{
              type: "FeatureCollection",
              features: zoneCircleFeatures,
            }}
          >
            <MapLibreGL.CircleLayer
              id="zones-circle-layer"
              style={zoneCircleStyle}
            />
          </MapLibreGL.ShapeSource>
        )}

        {/* Zones: polygons */}
        {zonePolygonFeatures.length > 0 && (
          <MapLibreGL.ShapeSource
            id="zones-polygon-source"
            shape={{
              type: "FeatureCollection",
              features: zonePolygonFeatures,
            }}
          >
            <MapLibreGL.FillLayer
              id="zones-polygon-layer"
              style={zonePolygonStyle}
            />
          </MapLibreGL.ShapeSource>
        )}

        {/* Boundaries */}
        {boundaryFeatures.length > 0 && (
          <MapLibreGL.ShapeSource
            id="boundaries-source"
            shape={{
              type: "FeatureCollection",
              features: boundaryFeatures,
            }}
          >
            <MapLibreGL.FillLayer
              id="boundaries-layer"
              style={boundaryStyle}
            />
          </MapLibreGL.ShapeSource>
        )}

        {/* Heatmap */}
        {heatmapFeatures.length > 0 && (
          <MapLibreGL.ShapeSource
            id="heatmap-source"
            shape={{
              type: "FeatureCollection",
              features: heatmapFeatures,
            }}
          >
            <MapLibreGL.HeatmapLayer
              id="heatmap-layer"
              style={heatmapStyle}
            />
          </MapLibreGL.ShapeSource>
        )}
      </MapLibreGL.MapView>

      {isFullscreen && onToggleFullscreen && (
        <Pressable
          style={styles.fullscreenButton}
          onPress={onToggleFullscreen}
        >
          <Text style={styles.fullscreenButtonText}>Exit Fullscreen</Text>
        </Pressable>
      )}

      {/* Zone alert modal */}
      <Modal
        visible={zoneAlertVisible && !!zoneAlertData}
        transparent
        animationType="fade"
        onRequestClose={() => setZoneAlertVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>⚠ Zone Alert</Text>
            <Text style={styles.alertMessage}>
              You entered a restricted zone:{" "}
              <Text style={styles.alertHighlight}>
                {zoneAlertData?.zoneName}
              </Text>
              {"\n"}
              Risk level:{" "}
              <Text
                style={[
                  styles.alertHighlight,
                  {
                    color:
                      zoneAlertData?.risk === "high"
                        ? "#ef4444"
                        : zoneAlertData?.risk === "medium"
                        ? "#f97316"
                        : "#16a34a",
                  },
                ]}
              >
                {zoneAlertData?.risk || "unknown"}
              </Text>
            </Text>
            <Pressable
              style={styles.alertButton}
              onPress={() => setZoneAlertVisible(false)}
            >
              <Text style={styles.alertButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Boundary alert modal */}
      <Modal
        visible={boundaryAlertVisible && !!boundaryAlertName}
        transparent
        animationType="fade"
        onRequestClose={() => setBoundaryAlertVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>🚨 Boundary Alert</Text>
            <Text style={styles.alertMessage}>
              You went outside allowed boundary:{" "}
              <Text style={styles.alertHighlight}>
                {boundaryAlertName}
              </Text>
            </Text>
            <Pressable
              style={styles.alertButton}
              onPress={() => setBoundaryAlertVisible(false)}
            >
              <Text style={styles.alertButtonText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  fullscreenButton: {
    position: "absolute",
    top: 16,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    elevation: 3,
  },
  fullscreenButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  alertCard: {
    width: 320,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    elevation: 5,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#dc2626",
    marginBottom: 8,
  },
  alertMessage: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 16,
  },
  alertHighlight: {
    fontWeight: "700",
    color: "#111827",
  },
  alertButton: {
    marginTop: 4,
    backgroundColor: "#dc2626",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  alertButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});
