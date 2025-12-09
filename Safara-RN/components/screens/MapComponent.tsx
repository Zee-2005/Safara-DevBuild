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

//const SOCKET_URL = "http://192.168.0.106:3000";
const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_API_URL;
const MAPTILER_KEY = "K183PqmMToR2O89INJ40";

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

type HeatmapPoint = [number, number];
type TimerHandle = ReturnType<typeof setInterval>;

const DEFAULT_CENTER: [number, number] = [78.9629, 20.5937]; // [lng, lat]
const DEFAULT_ZOOM = 5;

const zoneAlertTimers: Record<string, TimerHandle> = {};

function stopZoneAlert(zoneKey: string) {
  const t = zoneAlertTimers[zoneKey];
  if (t) {
    clearInterval(t);
    delete zoneAlertTimers[zoneKey];
    console.log("🛑 Zone alert stopped =>", zoneKey);
  }
}

// Approximate a geodesic circle as a polygon in lat/lng. [web:242]
function makeCircleRing(
  center: { lat: number; lng: number },
  radiusMeters: number,
  steps = 64
): [number, number][] {
  const R = 6378137; // Earth radius (m)
  const d = radiusMeters / R;
  const lat = (center.lat * Math.PI) / 180;
  const lng = (center.lng * Math.PI) / 180;

  const ring: [number, number][] = [];

  for (let i = 0; i < steps; i++) {
    const bearing = (2 * Math.PI * i) / steps;
    const lat2 = Math.asin(
      Math.sin(lat) * Math.cos(d) +
        Math.cos(lat) * Math.sin(d) * Math.cos(bearing)
    );
    const lng2 =
      lng +
      Math.atan2(
        Math.sin(bearing) * Math.sin(d) * Math.cos(lat),
        Math.cos(d) - Math.sin(lat) * Math.sin(lat2)
      );
    ring.push([(lng2 * 180) / Math.PI, (lat2 * 180) / Math.PI]);
  }

  // close ring
  ring.push(ring[0]);
  return ring;
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
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cameraRef = useRef<any>(null); // Camera ref for manual recenter

  const [touristFeatures, setTouristFeatures] = useState<any[]>([]);
  const [zonePolygonFeatures, setZonePolygonFeatures] = useState<any[]>([]);
  const [boundaryFeatures, setBoundaryFeatures] = useState<any[]>([]);
  const [heatmapFeatures, setHeatmapFeatures] = useState<any[]>([]);

  const [currentLocation, setCurrentLocation] = useState<LatLng | undefined>(
    userLocation
  );
  const [requestingLocation, setRequestingLocation] = useState(false);

  const [zoneAlertVisible, setZoneAlertVisible] = useState(false);
  const [zoneAlertData, setZoneAlertData] = useState<{
    zoneName: string;
    risk?: string;
  } | null>(null);

  const [boundaryAlertVisible, setBoundaryAlertVisible] = useState(false);
  const [boundaryAlertName, setBoundaryAlertName] = useState<string | null>(
    null
  );

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
socket.on("heatmap-update", (points: HeatmapPoint[]) => {
  console.log("🔥 tourist heatmap-update", points.length, points);
  // existing mapping code...
});

    socket.on("connect", async () => {
      console.log("🛰️ Map socket connected", socket.id);
      const p: any = personalRef.current;
      const t: any = touristRef.current;
     console.log(p);
     console.log( touristRef.current);
     
     
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

    // Other tourists
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
        if (idx >= 0) next[idx] = feature;
        else next.push(feature);
        return next;
      });
    });

    socket.on("user-disconnected", (id: string) => {
      setTouristFeatures((prev) =>
        prev.filter((f) => f.properties?.id !== id)
      );
    });

    // Zones (circle + polygon → always render as polygon in meters)
    socket.on("zone-update", (data: ZoneUpdatePayload) => {
      const { id, name, risk, type, coords, radius } = data;
      if (!coords) return;

      let ring: [number, number][] | null = null;

      if (type === "circle") {
        const center =
          Array.isArray(coords) && coords.length > 0 ? coords[0] : coords;
        const lat = center.lat;
        const lng = center.lng;
        if (typeof lat !== "number" || typeof lng !== "number") return;

        const r = typeof radius === "number" ? radius : 200; // fallback
        ring = makeCircleRing({ lat, lng }, r);
      } else if (type === "polygon") {
        const coordsArr: { lat: number; lng: number }[] = coords || [];
        if (!coordsArr.length) return;
        const tmp = coordsArr.map((c) => [c.lng, c.lat]) as [number, number][];
        if (
          tmp.length > 0 &&
          (tmp[0][0] !== tmp[tmp.length - 1][0] ||
            tmp[0][1] !== tmp[tmp.length - 1][1])
        ) {
          tmp.push(tmp[0]);
        }
        ring = tmp;
      }

      if (!ring) return;

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

    // Boundaries (also use polygons for circle so size is map‑fixed)
    socket.on("boundary-update", (b: BoundaryUpdatePayload) => {
      const { id, name, type, center, coords, radius } = b;

      let ring: [number, number][] | null = null;

      if (type === "circle" && center) {
        const { lat, lng } = center;
        if (typeof lat !== "number" || typeof lng !== "number") return;
        const r = typeof radius === "number" ? radius : 200;
        ring = makeCircleRing({ lat, lng }, r);
      } else if (type === "polygon" && coords && coords.length) {
        const tmp = coords.map(
          (c) => [c.lng, c.lat] as [number, number]
        );
        if (
          tmp.length > 0 &&
          (tmp[0][0] !== tmp[tmp.length - 1][0] ||
            tmp[0][1] !== tmp[tmp.length - 1][1])
        ) {
          tmp.push(tmp[0]);
        }
        ring = tmp;
      }

      if (!ring) return;

      setBoundaryFeatures((prev) => {
        const others = prev.filter((f) => f.properties?.id !== id);
        const feature = {
          type: "Feature",
          id,
          properties: {
            id,
            name,
          },
          geometry: {
            type: "Polygon",
            coordinates: [ring],
          },
        };
        return [...others, feature];
      });
    });

    // Zone alerts
    socket.on("zone-alert", ({ touristId, zoneName, risk }: any) => {
      const myTid = touristRef.current?.tid || null;
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

    // Outside boundary alerts
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

  // Location tracking + heartbeat (emits but does NOT move camera) [web:74]
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
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 5,
          },
          async (loc) => {
            if (!isMounted) return;
            const { latitude, longitude } = loc.coords;
            setCurrentLocation({ lat: latitude, lng: longitude });

            // const p: any = personalRef.current;
            // const t: any = touristRef.current;

            // const storedTid = await AsyncStorage.getItem("current_tid");
            // const touristId = t?.tid || storedTid || null;

            // const payload = {
            //   latitude,
            //   longitude,
            //   timestamp: new Date().toISOString(),
            //   touristId,
            //   personalId: p?.pid_personal_id,
            //   name: p?.pid_full_name || "Unknown",
            //   phone: p?.pid_mobile || "-",
            //   email: p?.pid_email || "-",
            //   nationality: p?.pid_nationality || "-",
            //   destination: t?.trip?.destination || "-",
            //   tripStart: t?.trip?.startDate || "-",
            //   tripEnd: t?.trip?.endDate || "-",
            //   status: t?.tid_status || "active",
            // };

             const storedFullName =
        (await AsyncStorage.getItem("pid_full_name")) || "Demo Tourist";
      const storedMobile =
        (await AsyncStorage.getItem("pid_mobile")) || "+911234567890";

      const p: any = personalRef.current;
      const t: any = touristRef.current;

      // const touristId =
 
const keys = await AsyncStorage.getAllKeys();
const touristKeys = keys.filter(key => key.startsWith('tourist_id:'));
let touristId = null;

if (touristKeys.length > 0) {
  const latestKey = touristKeys[0];
  const data = await AsyncStorage.getItem(latestKey);
  touristId = data ? JSON.parse(data).id : null;
}
 const location: LatLng | undefined =
        currentLocation ||
        (userLocation
          ? { lat: userLocation.lat, lng: userLocation.lng }
          : undefined);
console.log("✅ TOURIST ID:", touristId);

console.log(touristId);

      const touristName = p?.pid_full_name || storedFullName || "Unknown";
      const touristPhone = p?.pid_mobile || storedMobile || "-";

      const isDemo = !(await AsyncStorage.getItem("t_id"));

      const payload: any = {
        touristId,
        location,
        latitude,
        longitude,     
        personalId: p?.pid_personal_id ||  (await AsyncStorage.getItem("pid_personal_id")),
        name:  p?.pid_full_name || storedFullName || "Unknown",
        phone: p?.pid_mobile || storedMobile || "-",
        email: p?.pid_email || (await AsyncStorage.getItem("pid_email")),
        nationality: p?.pid_nationality || "-",
        destination: t?.trip?.destination || "-",
        tripStart: t?.trip?.startDate || (await AsyncStorage.getItem("trip_start"))|| (await AsyncStorage.getItem("trip_start_now"))|| (await AsyncStorage.getItem("tourist_id_start")),
        tripEnd: t?.trip?.endDate || (await AsyncStorage.getItem("trip_end")) || (await AsyncStorage.getItem("tourist_id_end")),
        status: t?.tid_status || (await AsyncStorage.getItem("current_tid_status")) ||"active" ,
       
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

    heartbeatRef.current = setInterval(async () => {
      if (!currentLocation) return;
      const p: any = personalRef.current;
      const t: any = touristRef.current;
console.log(p.pid_application_id);

      const storedTid = await AsyncStorage.getItem("current_tid");
      const touristId = t?.tid || storedTid || null;

      const payload = {
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
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

      console.log("❤️ heartbeat live-tourist-data", payload);
      socketRef.current?.emit("live-tourist-data", payload);
    }, 5000);

    return () => {
      isMounted = false;
      if (locationSubRef.current) {
        locationSubRef.current.remove();
        locationSubRef.current = null;
      }
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };
  }, [currentLocation]);

  // Map starts at a fixed center; camera only moves on button tap
  const initialCenter: [number, number] = DEFAULT_CENTER;
  const initialZoom = DEFAULT_ZOOM;

  const touristsCircleStyle = {
    circleRadius: 4,
    circleColor: "#2563eb",
    circleStrokeWidth: 1,
    circleStrokeColor: "#ffffff",
  };

  const zonePolygonStyle = {
    fillColor: "#f97316",
    fillOpacity: 0.2,
    fillOutlineColor: "#f97316",
  };

  const boundaryStyle = {
    fillColor: "#f5f6f9ff",
    fillOpacity: 0.12,
    fillOutlineColor: "#02050aff",
  };
const heatmapStyle = {
  heatmapRadius: [
    "interpolate",
    ["linear"],
    ["zoom"],
    5, 12,
    10, 24,
    14, 40,
  ],
  
  heatmapOpacity: 0.7,
  heatmapIntensity: 1,

  // gradient: low → high
  heatmapColor: [
    "interpolate",
    ["linear"],
    ["heatmap-density"],
    0, "rgba(0, 255, 0, 0)",    // transparent green
    0.6, "rgba(1, 3, 1, 0.6)",
    0.8, "rgba(255, 165, 0, 0.8)", // orange
    1, "rgba(249, 249, 249, 0.49)"        // red
  ],
};


  // Zoom only when user presses the button
  const handleRecenter = async () => {
    try {
      let loc = currentLocation;

      if (!loc) {
        const perm = await Location.getForegroundPermissionsAsync();
        if (!perm.granted) {
          const { status } =
            await Location.requestForegroundPermissionsAsync();
          if (status !== "granted") {
            Alert.alert(
              "Location permission",
              "Cannot center map without location permission."
            );
            return;
          }
        }

        const result = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        loc = {
          lat: result.coords.latitude,
          lng: result.coords.longitude,
        };
        setCurrentLocation(loc);
      }

      if (!cameraRef.current || !loc) return;

      cameraRef.current.setCamera({
        centerCoordinate: [loc.lng, loc.lat],
        zoomLevel: 14.5, // ~1–2 km radius view
        animationMode: "flyTo",
        animationDuration: 800,
      });
    } catch (e) {
      console.log("❌ recenter error", e);
      Alert.alert("Location error", "Could not center on your location.");
    }
  };

  return (
    <View style={styles.root}>
      <MapLibreGL.MapView
        style={styles.map}
        mapStyle={`https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`}
        logoEnabled={false}
        attributionEnabled
      >
        <MapLibreGL.Camera
          ref={cameraRef}
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

        {/* Zones as polygons (circle+polygon in meters) */}
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

        {/* Boundaries as polygons */}
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

      {/* My location button */}
      <Pressable style={styles.locateButton} onPress={handleRecenter}>
        <Text style={styles.locateButtonText}>◎</Text>
      </Pressable>

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
              <Text style={styles.alertHighlight}>{boundaryAlertName}</Text>
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
  root: { flex: 1 },
  map: { flex: 1 },
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
  locateButton: {
    position: "absolute",
    bottom: 24,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  locateButtonText: {
    fontSize: 20,
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
