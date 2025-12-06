



// // src/components/MapComponent.tsx
// import { useEffect, useRef } from "react";
// import L, { Map as LeafletMap, Marker, Layer } from "leaflet";
// import "leaflet/dist/leaflet.css";
// import { useUserData } from "@/context/UserDataContext";
// import { io, Socket } from "socket.io-client";

// const SOCKET_URL = "http://localhost:3000"; // or import.meta.env.VITE_TOURIST_SOCKET_URL
// const MAPTILER_KEY = import.meta.env?.VITE_MAPTILER_KEY || "K183PqmMToR2O89INJ40";

// // Fix Leaflet default marker icons
// delete (L.Icon.Default.prototype as any)._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
//   iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
//   shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
// });

// type Props = {
//   userLocation?: { lat: number; lng: number };
//   onGeofenceAlert?: (payload: { type: "zone" | "boundary"; name: string; risk?: string }) => void;
//   isFullscreen?: boolean;
//   onToggleFullscreen?: () => void;
// };

// export default function MapComponent({ userLocation, onGeofenceAlert, isFullscreen, onToggleFullscreen }: Props) {
//   const mapRef = useRef<LeafletMap | null>(null);
//   const meMarkerRef = useRef<Marker | null>(null);
//   const meCenteredRef = useRef(false);

//   const socketRef = useRef<Socket | null>(null);
//   const geoWatchIdRef = useRef<number | null>(null);

//   const markersRef = useRef<Record<string, Marker>>({});
//   const zonesRef = useRef<Record<string, { layer: Layer }>>({});
//   const boundariesRef = useRef<Record<string, Layer>>({});
//   const heatLayerRef = useRef<Layer | null>(null);

//   const { personal, tourist } = useUserData();
//   const personalRef = useRef(personal);
//   const touristRef = useRef(tourist);

//   // keep refs updated
//   useEffect(() => {
//     personalRef.current = personal;
//     touristRef.current = tourist;
//   }, [personal, tourist]);

//   useEffect(() => {
//     // --- Initialize Map ---
//     const map = L.map("map", { zoomControl: true }).setView([20.5937, 78.9629], 5);
//     mapRef.current = map;

//     const baseLayers = {
//       Street: L.tileLayer(
//         `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`,
//         { attribution: "&copy; <a href='https://www.maptiler.com/'>MapTiler</a>" }
//       ),
//       Satellite: L.tileLayer(
//         `https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=${MAPTILER_KEY}`,
//         { attribution: "&copy; <a href='https://www.maptiler.com/'>MapTiler</a>" }
//       ),
//       Hybrid: L.tileLayer(
//         `https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`,
//         { attribution: "&copy; <a href='https://www.maptiler.com/'>MapTiler</a>" }
//       ),
//     };

//     baseLayers.Street.addTo(map);
//     L.control.layers(baseLayers).addTo(map);

//     // --- Initialize Socket ---
//     const socket = io(SOCKET_URL, {
//       transports: ["websocket"],
//       reconnection: true,
//       reconnectionAttempts: Infinity,
//       reconnectionDelay: 2000,
//       timeout: 10000,
//     });
//     socketRef.current = socket;

//     socket.on("connect", () => {
//       console.log("[socket] Connected:", socket.id);
//       const p = personalRef.current;
//       const t = touristRef.current;
//       socket.emit("register-tourist", {
//         touristId: t?.id || localStorage.getItem("current_tid"),
//         personalId: p?.id,
//         name: p?.name || "Unknown",
//         email: p?.email || "-",
//         phone: p?.phone || "-",
//         nationality: p?.pid_nationality || "Indian",
//       });
//     });

//     // --- Other tourists' locations ---
//     socket.on("receive-location", ({ id, latitude, longitude }: { id: string; latitude: number; longitude: number }) => {
//       if (!mapRef.current) return;
//       const ll = L.latLng(latitude, longitude);
//       if (markersRef.current[id]) markersRef.current[id].setLatLng(ll);
//       else markersRef.current[id] = L.marker(ll).addTo(mapRef.current);
//     });

//     socket.on("user-disconnected", (id: string) => {
//       const mk = markersRef.current[id];
//       if (mk && mapRef.current) {
//         mapRef.current.removeLayer(mk);
//         delete markersRef.current[id];
//       }
//     });

//     // --- Zones ---
//     socket.on("zone-update", (data: any) => {
//       if (!mapRef.current) return;
//       const { id, name, risk, type, coords, radius } = data;
//       const old = zonesRef.current[id]?.layer;
//       if (old) mapRef.current.removeLayer(old);

//       let layer: Layer | null = null;
//       if (type === "circle") layer = L.circle([coords.lat, coords.lng], { radius, color: riskColor(risk), fillColor: riskColor(risk), fillOpacity: 0.3 }).addTo(mapRef.current);
//       else if (type === "polygon") {
//         const latlngs = coords.map((c: any) => [c.lat, c.lng]) as [number, number][];
//         layer = L.polygon(latlngs, { color: riskColor(risk), fillColor: riskColor(risk), fillOpacity: 0.3 }).addTo(mapRef.current);
//       }

//       if (layer) (layer as any).bindPopup(`Zone: ${name} | Risk: ${risk}`);
//       zonesRef.current[id] = { layer: layer! };
//     });

//     socket.on("zone-alert", ({ touristId, zoneName, risk }: { touristId: string; zoneName: string; risk: string }) => {
//       if (touristId !== socket.id) return;
//       playAlertSound(risk);
//       onGeofenceAlert?.({ type: "zone", name: zoneName, risk });
//       alert(`⚠️ You entered zone "${zoneName}" (Risk: ${risk})`);
      
//     });

//     // --- Heatmap ---
//     socket.on("heatmap-update", async (points: Array<[number, number]>) => {
//       if (!mapRef.current) return;
//       const plugin = await import("leaflet.heat").catch(() => null);
//       if (!plugin) return;

//       if (heatLayerRef.current) mapRef.current.removeLayer(heatLayerRef.current);

//       const latlngs = points.map(([lng, lat]) => [lat, lng]) as [number, number][];
//       // @ts-ignore
//       heatLayerRef.current = (L as any).heatLayer(latlngs, { radius: 25, blur: 15, maxZoom: 10 }).addTo(mapRef.current);
//     });

//     // --- Boundaries ---
//     socket.on("boundary-update", (b: any) => {
//       if (!mapRef.current) return;
//       const prev = boundariesRef.current[b.id];
//       if (prev) mapRef.current.removeLayer(prev);

//       let layer: Layer | null = null;
//       if (b.type === "circle") layer = L.circle([b.center.lat, b.center.lng], { radius: b.radius, color: "blue", fillOpacity: 0.1 }).addTo(mapRef.current);
//       else if (b.type === "polygon") {
//         const latlngs = b.coords.map((c: any) => [c.lat, c.lng]) as [number, number][];
//         layer = L.polygon(latlngs, { color: "blue", fillOpacity: 0.1 }).addTo(mapRef.current);
//       }

//       if (layer) boundariesRef.current[b.id] = layer;
//     });

//     socket.on("outside-boundary-alert", (data: { touristId: string; boundaryName: string }) => {
//       if (data.touristId !== socket.id) return;
//       playAlertSound("high");
//       onGeofenceAlert?.({ type: "boundary", name: data.boundaryName });
//       alert(`🚨 You went outside allowed boundary: ${data.boundaryName}`);
//     });

//     // --- Watch Geolocation ---
//     if ("geolocation" in navigator) {
//       geoWatchIdRef.current = navigator.geolocation.watchPosition(
//         (pos) => {
//           const { latitude, longitude } = pos.coords;
//           const ll = L.latLng(latitude, longitude);

//           if (meMarkerRef.current) meMarkerRef.current.setLatLng(ll);
//           else meMarkerRef.current = L.marker(ll).addTo(mapRef.current!);

//           if (!meCenteredRef.current) {
//             mapRef.current?.setView(ll, 15);
//             meCenteredRef.current = true;
//           }

//           if (socket.connected) {
//             const p = personalRef.current;
//             const t = touristRef.current;
//             //console.log(personalRef);
// //console.log(t);
//             socket.emit("live-tourist-data", {
//               latitude,
//               longitude,
//               timestamp: new Date().toISOString(),
//               touristId: t?.tid || localStorage.getItem("current_tid"),
//               personalId: p?.pid_personal_id,
//               name: p?.pid_full_name || "Unknown",
//               phone: p?.pid_mobile || "-",
//               email: p?.pid_email ||t?.email|| "-",
//               nationality: p?.pid_nationality || "-",
//               destination: t?.trip.destination || "-",
//               tripStart: t?.trip.startDate || "-",
//               tripEnd: t?.trip.endDate || "-",
//               status: t?.tid_status || "active",
//             });
//           }
//         },
//         (err) => console.error("[MapComponent] Geolocation error:", err),
//         { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 }
//       );
//     } else alert("Geolocation not supported by this device.");

//     // --- Cleanup ---
//     return () => {
//       if (geoWatchIdRef.current !== null) navigator.geolocation.clearWatch(geoWatchIdRef.current);
//       if (socketRef.current) {
//         socketRef.current.disconnect();
//         socketRef.current.off();
//       }
//       if (mapRef.current) mapRef.current.remove();
//     };
//   }, []);

//   return (
//     <div id="map" className="h-full w-full rounded-xl shadow-md border border-gray-200 relative">
//       {isFullscreen && (
//         <button
//           onClick={onToggleFullscreen}
//           className="absolute top-3 right-3 bg-white shadow-md rounded-md px-3 py-1 text-sm font-medium"
//         >
//           Exit Fullscreen
//         </button>
//       )}
//     </div>
//   );
// }

// // --- Helper functions ---
// function riskColor(risk?: string) {
//   if (!risk) return "green";
//   const r = risk.toLowerCase();
//   if (r === "high") return "red";
//   if (r === "medium") return "orange";
//   return "green";
// }

// function playAlertSound(risk?: string) {
//   const audio = new Audio(getAlertSound(risk));
//   audio.play().catch(() => {});
// }

// function getAlertSound(risk?: string) {
//   if (!risk) return "/sounds/soft-alert.mp3";
//   const r = risk.toLowerCase();
//   if (r === "high") return "/sounds/loud-alert.mp3";
//   if (r === "medium") return "/sounds/medium-alert.mp3";
//   return "/sounds/soft-alert.mp3";
// }







// // src/components/MapComponent.tsx
// import { useEffect, useRef } from 'react';
// import L, { Map as LeafletMap, Layer, Marker } from 'leaflet';
// import 'leaflet/dist/leaflet.css';

// type Props = {
//   userLocation?: { lat: number; lng: number };
//   onGeofenceAlert?: (payload: { type: 'zone' | 'boundary'; name: string; risk?: string }) => void;
//   isFullscreen?: boolean;
//   onToggleFullscreen?: () => void;
// };

// // IMPORTANT: no fallback — undefined means “offline mode”
// const SOCKET_URL = (import.meta as any).env?.VITE_TOURIST_SOCKET_URL as string || "http://localhost:3000";
// const MAPTILER_KEY = (import.meta as any).env?.VITE_MAPTILER_KEY || 'K183PqmMToR2O89INJ40';

// // Leaflet icon fix for Vite
// // @ts-ignore
// delete (L.Icon.Default as any).prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
//   iconUrl:      'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
//   shadowUrl:    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
// });

// export default function MapComponent({ userLocation, onGeofenceAlert, isFullscreen, onToggleFullscreen }: Props) {
//   const mapRef = useRef<LeafletMap | null>(null);
//   const meMarkerRef = useRef<Marker | null>(null);
//   const meCenteredRef = useRef(false);

//   // Optional realtime bits
//   const socketRef = useRef<import('socket.io-client').Socket | null>(null);
//   const markersRef = useRef<Record<string, Marker>>({});
//   const zonesRef = useRef<Record<string, { layer: Layer }>>({});
//   const boundariesRef = useRef<Record<string, Layer>>({});
//   const heatLayerRef = useRef<Layer | null>(null);
//   const geoWatchIdRef = useRef<number | null>(null);

//   useEffect(() => {
//     const map = L.map('map', { zoomControl: true }).setView([20.5937, 78.9629], 5);
//     mapRef.current = map;

//     const street = L.tileLayer(
//       `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`,
//       { attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a>' }
//     );
//     const satellite = L.tileLayer(
//       `https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=${MAPTILER_KEY}`,
//       { attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a>' }
//     );
//     const hybrid = L.tileLayer(
//       `https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`,
//       { attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a>' }
//     );
//     street.addTo(map);
//     L.control.layers({ 'Street View': street, 'Satellite (No Labels)': satellite, 'Satellite + Labels (Hybrid)': hybrid }).addTo(map);

//     // Always center from the browser GPS (works with no backend)
//     if ('geolocation' in navigator) {
//       geoWatchIdRef.current = navigator.geolocation.watchPosition(
//         (pos) => {
//           const { latitude, longitude } = pos.coords;
//           const ll = L.latLng(latitude, longitude);

//           if (meMarkerRef.current) meMarkerRef.current.setLatLng(ll);
//           else meMarkerRef.current = L.marker(ll).addTo(mapRef.current!);

//           if (!meCenteredRef.current) {
//             mapRef.current?.setView(ll, 14);
//             meCenteredRef.current = true;
//           }

//           if (socketRef.current?.connected) {
//             socketRef.current.emit('send-location', { latitude, longitude });
//           }
//         },
//         (err) => console.error('Geolocation error:', err),
//         { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
//       );
//     }

//     // Only initialize Socket.IO when a server URL is provided
//     (async () => {
//       if (!SOCKET_URL) {
//         console.info('[map] Offline mode (no VITE_TOURIST_SOCKET_URL); skipping Socket.IO connect');
//         return;
//       }
//       const { io } = await import('socket.io-client');
//       const socket = io(SOCKET_URL, {
//         transports: ['websocket', 'polling'],
//         reconnection: true,
//         reconnectionAttempts: Infinity,
//         reconnectionDelay: 1000,
//         reconnectionDelayMax: 8000,
//         timeout: 10000,
//         forceNew: true,
//       });
//       socketRef.current = socket;

//       socket.on('connect', () => console.log('[socket] connected', socket.id));
//       socket.on('connect_error', (err) => console.warn('[socket] connect_error', err.message));
//       socket.on('disconnect', (reason) => console.log('[socket] disconnected', reason));

//       socket.on('receive-location', ({ id, latitude, longitude }: { id: string; latitude: number; longitude: number }) => {
//         if (!mapRef.current) return;
//         const ll = L.latLng(latitude, longitude);
//         if (markersRef.current[id]) markersRef.current[id].setLatLng(ll);
//         else markersRef.current[id] = L.marker(ll).addTo(mapRef.current);
//       });

//       socket.on('user-disconnected', (id: string) => {
//         if (!mapRef.current) return;
//         const mk = markersRef.current[id];
//         if (mk) {
//           mapRef.current.removeLayer(mk);
//           delete markersRef.current[id];
//         }
//       });

//       socket.on('zone-update', (data: any) => {
//         if (!mapRef.current) return;
//         const { id, name, risk, type, coords, radius } = data;
//         const old = zonesRef.current[id]?.layer;
//         if (old) mapRef.current.removeLayer(old);
//         let layer: Layer | null = null;
//         if (type === 'circle') {
//           layer = L.circle([coords.lat, coords.lng], { radius, color: riskColor(risk), fillColor: riskColor(risk), fillOpacity: 0.3 }).addTo(mapRef.current);
//         } else if (type === 'polygon') {
//           const latlngs = coords.map((c: any) => [c.lat, c.lng]) as [number, number][];
//           layer = L.polygon(latlngs, { color: riskColor(risk), fillColor: riskColor(risk), fillOpacity: 0.3 }).addTo(mapRef.current);
//         }
//         if (layer) (layer as any).bindPopup(`Zone: ${name} | Risk: ${risk}`);
//         zonesRef.current[id] = { layer: layer! };
//       });

//       socket.on('zone-alert', ({ touristId, zoneName, risk }: { touristId: string; zoneName: string; risk: string }) => {
//         if (touristId !== socket.id) return;
//         try { new Audio(alertSound(risk)).play().catch(() => {}); } catch {}
//         onGeofenceAlert?.({ type: 'zone', name: zoneName, risk });
//         alert(`⚠️ You entered zone "${zoneName}" (Risk: ${risk})`);
//       });

//       socket.on('heatmap-update', async (points: Array<[number, number]>) => {
//         if (!mapRef.current) return;
//         const plugin = await import('leaflet.heat').catch(() => null);
//         if (!plugin) return;
//         if (heatLayerRef.current) mapRef.current.removeLayer(heatLayerRef.current);
//         const latlngs = points.map(([lng, lat]) => [lat, lng]) as [number, number][];
//         // @ts-ignore
//         heatLayerRef.current = (L as any).heatLayer(latlngs, { radius: 25, blur: 15, maxZoom: 10 }).addTo(mapRef.current);
//       });

//       socket.on('boundary-update', (b: any) => {
//         if (!mapRef.current) return;
//         const prev = boundariesRef.current[b.id];
//         if (prev) mapRef.current.removeLayer(prev);
//         let layer: Layer | null = null;
//         if (b.type === 'circle') layer = L.circle([b.center.lat, b.center.lng], { radius: b.radius, color: 'blue', fillOpacity: 0.1 }).addTo(mapRef.current);
//         else if (b.type === 'polygon') {
//           const latlngs = b.coords.map((c: any) => [c.lat, c.lng]) as [number, number][];
//           layer = L.polygon(latlngs, { color: 'blue', fillOpacity: 0.1 }).addTo(mapRef.current);
//         }
//         if (layer) boundariesRef.current[b.id] = layer;
//       });

//       socket.on('outside-boundary-alert', (data: { touristId: string; boundaryName: string }) => {
//         if (data.touristId !== socket.id) return;
//         try { new Audio('/sounds/alert-boundary.mp3').play().catch(() => {}); } catch {}
//         onGeofenceAlert?.({ type: 'boundary', name: data.boundaryName });
//         alert(`🚨 You went outside allowed boundary: ${data.boundaryName}`);
//       });
//     })();

//     return () => {
//       try { if (geoWatchIdRef.current !== null) navigator.geolocation.clearWatch(geoWatchIdRef.current); } catch {}
//       if (socketRef.current) { try { socketRef.current.disconnect(); } catch {} socketRef.current = null; }
//       if (mapRef.current) {
//         Object.values(markersRef.current).forEach((mk) => mapRef.current?.removeLayer(mk));
//         Object.values(zonesRef.current).forEach((z) => z.layer && mapRef.current?.removeLayer(z.layer));
//         Object.values(boundariesRef.current).forEach((b) => mapRef.current?.removeLayer(b));
//         if (heatLayerRef.current) mapRef.current.removeLayer(heatLayerRef.current);
//         if (meMarkerRef.current) mapRef.current.removeLayer(meMarkerRef.current);
//         mapRef.current.remove();
//         mapRef.current = null;
//       }
//       markersRef.current = {};
//       zonesRef.current = {};
//       boundariesRef.current = {};
//       heatLayerRef.current = null;
//       meMarkerRef.current = null;
//       meCenteredRef.current = false;
//     };
//   }, [onGeofenceAlert]);

//   return <div id="map" className="h-full w-full" />;
// }

// function riskColor(risk?: string) {
//   if (!risk) return 'green';
//   const r = risk.toLowerCase();
//   if (r === 'high') return 'red';
//   if (r === 'medium') return 'orange';
//   return 'green';
// }
// function alertSound(risk?: string) {
//   if (!risk) return '/sounds/soft-alert.mp3';
//   const r = risk.toLowerCase();
//   if (r === 'high') return '/sounds/loud-alert.mp3';
//   if (r === 'medium') return '/sounds/medium-alert.mp3';
//   return '/sounds/soft-alert.mp3';
// }






// src/components/MapComponent.tsx
import { useEffect, useRef } from "react";
import L, { Map as LeafletMap, Marker, Layer } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useUserData } from "@/context/UserDataContext";
import { io, Socket } from "socket.io-client";
import { TouristIdRecord,saveTouristIdFromDraft } from '@/lib/touristId';
const SOCKET_URL = "http://localhost:3000";
const MAPTILER_KEY = import.meta.env?.VITE_MAPTILER_KEY || "K183PqmMToR2O89INJ40";

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});


// ⭐⭐⭐ ADDITION A — GLOBAL TRACKER (DO NOT REMOVE YOUR OLD CODE)


let globalSocket: Socket | null = null;
let globalGeoWatchId: number | null = null;

function startGlobalLiveTracking(getPersonal: () => any, getTourist: () => any) {
  if (globalSocket) return; // Prevent duplicate sockets

  globalSocket = io(SOCKET_URL, {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
  });

  globalSocket.on("connect", () => {
    const p = getPersonal();
    const t = getTourist();

    globalSocket?.emit("register-tourist", {
      touristId: t?.tid || localStorage.getItem("current_tid"),
      personalId: p?.pid_personal_id,
      name: p?.pid_full_name || "Unknown",
      email: p?.pid_email || "-",
      phone: p?.pid_mobile || "-",
      nationality: p?.pid_nationality || "Indian",
    });

    console.log("🌍 Global tracking started");
  });

  if ("geolocation" in navigator) {
    globalGeoWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        const p = getPersonal();
        const t = getTourist();
console.log(t);
        globalSocket?.emit("live-tourist-data", {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          timestamp: new Date().toISOString(),

          touristId: t?.tid || localStorage.getItem("current_tid"),
          personalId: p?.pid_personal_id,
          name: p?.pid_full_name,
          phone: p?.pid_mobile,
          email: p?.pid_email || t?.email,
          nationality: p?.pid_nationality || "-",
          destination: t?.trip?.destination || "-",
          tripStart: t?.trip?.startDate || "-",
          tripEnd: t?.trip?.endDate || "-",
          status: t?.tid_status || "active",
        });

        console.log("📡 location sent:", pos.coords.latitude, pos.coords.longitude);
      },
      (err) => console.log("❌ Global geo error:", err),
      { enableHighAccuracy: true }
    );
  }
}




// -----------------------------------------------------------------------
// ORIGINAL COMPONENT BELOW (NO REMOVAL)
// -----------------------------------------------------------------------

type Props = {
  userLocation?: { lat: number; lng: number };
  onGeofenceAlert?: (payload: { type: "zone" | "boundary"; name: string; risk?: string }) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
};

export default function MapComponent({ userLocation, onGeofenceAlert, isFullscreen, onToggleFullscreen }: Props) {
  const mapRef = useRef<LeafletMap | null>(null);
  const meMarkerRef = useRef<Marker | null>(null);
  const meCenteredRef = useRef(false);

  const socketRef = useRef<Socket | null>(null);
  const geoWatchIdRef = useRef<number | null>(null);

  const markersRef = useRef<Record<string, Marker>>({});
  const zonesRef = useRef<Record<string, { layer: Layer }>>({});
  const boundariesRef = useRef<Record<string, Layer>>({});
  const heatLayerRef = useRef<Layer | null>(null);

  const { personal, tourist } = useUserData();
  const personalRef = useRef(personal);
  const touristRef = useRef(tourist);
const rec = saveTouristIdFromDraft();
console.log( rec);
  useEffect(() => {
    personalRef.current = personal;
    touristRef.current = tourist;
  }, [personal, tourist]);

  useEffect(() => {

    // ⭐⭐⭐ ADDITION B — START GLOBAL LIVE TRACKING
    startGlobalLiveTracking(
      () => personalRef.current,
      () => touristRef.current
    );

    // --- Initialize Map ---
    const map = L.map("map", { zoomControl: true }).setView([20.5937, 78.9629], 5);
    mapRef.current = map;

    const baseLayers = {
      Street: L.tileLayer(
        `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`,
        { attribution: "&copy; <a href='https://www.maptiler.com/'>MapTiler</a>" }
      ),
      Satellite: L.tileLayer(
        `https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=${MAPTILER_KEY}`,
        { attribution: "&copy; <a href='https://www.maptiler.com/'>MapTiler</a>" }
      ),
      Hybrid: L.tileLayer(
        `https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`,
        { attribution: "&copy; <a href='https://www.maptiler.com/'>MapTiler</a>" }
      ),
    };

    baseLayers.Street.addTo(map);
    L.control.layers(baseLayers).addTo(map);

    // --- Initialize Socket ---
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      timeout: 10000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      const p = personalRef.current;
      const t = touristRef.current;
      socket.emit("register-tourist", {
        touristId: t?.id || localStorage.getItem("tourist_id"),
        personalId: p?.id,
        name: p?.name || "Unknown",
        email: p?.email || "-",
        phone: p?.phone || "-",
        nationality: p?.pid_nationality || "Indian",
      });
    });

    // --- Other tourists' locations ---
    socket.on("receive-location", ({ id, latitude, longitude }) => {
      if (!mapRef.current) return;
      const ll = L.latLng(latitude, longitude);
      if (markersRef.current[id]) markersRef.current[id].setLatLng(ll);
      else markersRef.current[id] = L.marker(ll).addTo(mapRef.current);
    });

    socket.on("user-disconnected", (id) => {
      const mk = markersRef.current[id];
      if (mk && mapRef.current) {
        mapRef.current.removeLayer(mk);
        delete markersRef.current[id];
      }
    });

    // --- Zones ---
    socket.on("zone-update", (data) => {
      if (!mapRef.current) return;
      const { id, name, risk, type, coords, radius } = data;
      const old = zonesRef.current[id]?.layer;
      if (old) mapRef.current.removeLayer(old);

      let layer: Layer | null = null;
      if (type === "circle")
        layer = L.circle([coords.lat, coords.lng], { radius, color: riskColor(risk), fillColor: riskColor(risk), fillOpacity: 0.3 }).addTo(mapRef.current);
      else if (type === "polygon") {
        const latlngs = coords.map((c: any) => [c.lat, c.lng]);
        layer = L.polygon(latlngs, { color: riskColor(risk), fillColor: riskColor(risk), fillOpacity: 0.3 }).addTo(mapRef.current);
      }

      if (layer) (layer as any).bindPopup(`Zone: ${name} | Risk: ${risk}`);
      zonesRef.current[id] = { layer: layer! };
    });

    // ⭐⭐⭐ ADDITION C — FIX ZONE ALERT ID CHECK
    // socket.on("zone-alert", ({ touristId, zoneName, risk }) => {
    //   const myTid = touristRef.current?.tid || localStorage.getItem("current_tid");
    //   if (touristId !== myTid) return;

    //   playAlertSound(risk);
    //   onGeofenceAlert?.({ type: "zone", name: zoneName, risk });
    //   alert(`⚠️ You entered zone "${zoneName}" (Risk: ${risk})`);
    // });


// ===============================
// 🔔 REPEATING ALERT TIMER STORAGE
// ===============================
const zoneAlertTimers: Record<string, NodeJS.Timeout> = {};

function stopZoneAlert(zoneKey: string) {
  if (zoneAlertTimers[zoneKey]) {
    clearInterval(zoneAlertTimers[zoneKey]);
    delete zoneAlertTimers[zoneKey];
    console.log("🛑 Zone alert stopped =>", zoneKey);
  }
}



socket.on("zone-alert", ({ touristId, zoneName, risk }) => {
  const myTid = touristRef.current?.tid || localStorage.getItem("current_tid");
  //if (touristId !== myTid) return;

  const zoneKey = `${myTid}_${zoneName}`;

  // Play Sound
  playAlertSound(risk);

  onGeofenceAlert?.({ type: "zone", name: zoneName, risk });

  // ===============================
  // MAIN POPUP UI
  // ===============================
  const alertDiv = document.createElement("div");
  alertDiv.className =
    "fixed inset-0 flex items-center justify-center bg-black/40 z-[9999]";

  alertDiv.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl w-80 p-5 animate-bounce-in">
      <h2 class="text-red-600 font-bold text-lg mb-2 flex items-center gap-2">
        ⚠ Zone Alert
      </h2>

      <p class="text-gray-700 text-sm leading-relaxed mb-4">
        You entered a restricted zone:
        <span class="font-semibold text-black">${zoneName}</span><br/>
        Risk Level:
        <span class="font-bold ${
          risk === "high"
            ? "text-red-600"
            : risk === "medium"
            ? "text-orange-500"
            : "text-green-600"
        }">
          ${risk}
        </span>
      </p>

      <button class="closeZoneAlert w-full py-2 rounded-lg bg-red-600 hover:bg-red-700 transition text-white font-medium">
        Close
      </button>
    </div>
  `;

  document.body.appendChild(alertDiv);

  // ⭐ FIX: attach event safely after rendering
  setTimeout(() => {
    const closeBtn = alertDiv.querySelector(".closeZoneAlert");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => alertDiv.remove());
    }
  }, 50);

  // ===============================
  // REPEATING REMINDER EVERY 10 MIN
  // ===============================
  if (!zoneAlertTimers[zoneKey]) {
    zoneAlertTimers[zoneKey] = setInterval(() => {
      playAlertSound(risk);

      const repeatDiv = document.createElement("div");
      repeatDiv.className =
        "fixed inset-0 flex items-center justify-center bg-black/40 z-[9999]";

      repeatDiv.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl w-80 p-5 animate-bounce-in">
          <h2 class="text-red-600 font-bold text-lg mb-2">⚠ Zone Alert</h2>
          <p class="text-gray-700 text-sm mb-4">
            You are STILL inside zone:
            <b>${zoneName}</b><br/>
            Risk: <b>${risk}</b>
          </p>
          <button class="closeRepeat w-full py-2 rounded-lg bg-red-600 hover:bg-red-700 transition text-white font-medium">
            OK
          </button>
        </div>
      `;

      document.body.appendChild(repeatDiv);

      repeatDiv.querySelector(".closeRepeat")?.addEventListener("click", () =>
        repeatDiv.remove()
      );
    }, 10 * 60 * 1000);
  }
});

    // --- Heatmap ---
    socket.on("heatmap-update", async (points) => {
      if (!mapRef.current) return;
      const plugin = await import("leaflet.heat").catch(() => null);
      if (!plugin) return;

      if (heatLayerRef.current) mapRef.current.removeLayer(heatLayerRef.current);

      const latlngs = points.map(([lng, lat]) => [lat, lng]);
      // @ts-ignore
      heatLayerRef.current = (L as any).heatLayer(latlngs, { radius: 25, blur: 15, maxZoom: 10 }).addTo(mapRef.current);
    });

    // --- Boundaries ---
    socket.on("boundary-update", (b) => {
      if (!mapRef.current) return;
      const prev = boundariesRef.current[b.id];
      if (prev) mapRef.current.removeLayer(prev);

      let layer: Layer | null = null;
      if (b.type === "circle")
        layer = L.circle([b.center.lat, b.center.lng], { radius: b.radius, color: "blue", fillOpacity: 0.1 }).addTo(mapRef.current);
      else if (b.type === "polygon") {
        const latlngs = b.coords.map((c: any) => [c.lat, c.lng]);
        layer = L.polygon(latlngs, { color: "blue", fillOpacity: 0.1 }).addTo(mapRef.current);
      }

      if (layer) boundariesRef.current[b.id] = layer;
    });

    // ⭐⭐⭐ ADDITION C — FIX BOUNDARY ALERT
    socket.on("outside-boundary-alert", (data) => {
      const myTid = touristRef.current?.tid || localStorage.getItem("current_tid");
      if (data.touristId !== myTid) return;

const zoneKey = `${myTid}_${data.boundaryName}`;
stopZoneAlert(zoneKey);

      playAlertSound("high");
      onGeofenceAlert?.({ type: "boundary", name: data.boundaryName });
      alert(`🚨 You went outside allowed boundary: ${data.boundaryName}`);
    });

    // --- Watch Geolocation (kept)
    if ("geolocation" in navigator) {
      geoWatchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const ll = L.latLng(latitude, longitude);

          if (meMarkerRef.current) meMarkerRef.current.setLatLng(ll);
          else meMarkerRef.current = L.marker(ll).addTo(mapRef.current!);

          if (!meCenteredRef.current) {
            mapRef.current?.setView(ll, 15);
            meCenteredRef.current = true;
          }

          if (socket.connected) {
            const p = personalRef.current;
            const t = touristRef.current;

            socket.emit("live-tourist-data", {
              latitude,
              longitude,
              timestamp: new Date().toISOString(),
              touristId: t?.id || localStorage.getItem("current_tid"),
              personalId: p?.pid_personal_id,
              name: p?.pid_full_name || "Unknown",
              phone: p?.pid_mobile || "-",
              email: p?.pid_email || t?.email || "-",
              nationality: p?.pid_nationality || "-",
              destination: t?.trip?.destination || "-",
              tripStart: t?.trip?.startDate || "-",
              tripEnd: t?.trip?.endDate || "-",
              status: t?.tid_status || "active",
            });
          }
        },
        (err) => console.error("[MapComponent] Geolocation error:", err),
        { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 }
      );
    } else alert("Geolocation not supported by this device.");

    // --- Cleanup ---
    return () => {
      if (geoWatchIdRef.current !== null) navigator.geolocation.clearWatch(geoWatchIdRef.current);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.off();
      }
      if (mapRef.current) mapRef.current.remove();
    };
  }, []);

  return (
    <div id="map" className="h-full w-full rounded-xl shadow-md border border-gray-200 relative">
      {isFullscreen && (
        <button
          onClick={onToggleFullscreen}
          className="absolute top-3 right-3 bg-white shadow-md rounded-md px-3 py-1 text-sm font-medium"
        >
          Exit Fullscreen
        </button>
      )}
    </div>
  );
}

// --- Helper functions ---
function riskColor(risk?: string) {
  if (!risk) return "green";
  const r = risk.toLowerCase();
  if (r === "high") return "red";
  if (r === "medium") return "orange";
  return "green";
}

function playAlertSound(risk?: string) {
  const audio = new Audio(getAlertSound(risk));
  audio.play().catch(() => {});
}

function getAlertSound(risk?: string) {
  if (!risk) return "/sounds/soft-alert.mp3";
  const r = risk.toLowerCase();
  if (r === "high") return "/sounds/loud-alert.mp3";
  if (r === "medium") return "/sounds/medium-alert.mp3";
  return "/sounds/soft-alert.mp3";
}







// socket.on("zone-alert", ({ touristId, zoneName, risk }) => {
//   const myTid = touristRef.current?.tid || localStorage.getItem("tourist_id");

//   // FIXED ID CHECK
//   if (Array.isArray(touristId)) {
//     if (!touristId.includes(myTid)) return;
//   } else {
//     if (touristId !== myTid) return;
//   }

//   const zoneKey = `${myTid}_${zoneName}`;

//   playAlertSound(risk);
//   onGeofenceAlert?.({ type: "zone", name: zoneName, risk });

//   const alertDiv = document.createElement("div");
//   alertDiv.className = "fixed inset-0 flex items-center justify-center bg-black/40 z-[9999]";

//   alertDiv.innerHTML = `
//     <div class="bg-white rounded-xl shadow-2xl w-80 p-5 animate-bounce-in">
//       <h2 class="text-red-600 font-bold text-lg mb-2 flex items-center gap-2">⚠ Zone Alert</h2>
//       <p class="text-gray-700 text-sm mb-4">
//         You entered restricted zone: <b>${zoneName}</b><br>
//         Risk: <b>${risk}</b>
//       </p>
//       <button class="closeZoneAlert w-full py-2 rounded-lg bg-red-600 text-white">Close</button>
//     </div>
//   `;
//   document.body.appendChild(alertDiv);

//   setTimeout(() => {
//     alertDiv.querySelector(".closeZoneAlert")?.addEventListener("click", () => alertDiv.remove());
//   }, 50);

//   // Repeat reminder every 10 mins
//   if (!zoneAlertTimers[zoneKey]) {
//     zoneAlertTimers[zoneKey] = setInterval(() => {
//       playAlertSound(risk);

//       const repeatDiv = document.createElement("div");
//       repeatDiv.className = "fixed inset-0 flex items-center justify-center bg-black/40 z-[9999]";
//       repeatDiv.innerHTML = `
//         <div class="bg-white rounded-xl shadow-2xl w-80 p-5 animate-bounce-in">
//           <h2 class="text-red-600 font-bold text-lg">⚠ Zone Warning</h2>
//           <p class="text-gray-700 text-sm mb-3">
//             You are still inside zone: <b>${zoneName}</b><br>
//             Risk: <b>${risk}</b>
//           </p>
//           <button class="closeRepeat w-full py-2 rounded-lg bg-red-600 text-white">OK</button>
//         </div>
//       `;
//       document.body.appendChild(repeatDiv);
//       repeatDiv.querySelector(".closeRepeat")?.addEventListener("click", () => repeatDiv.remove());
//     }, 10 * 60 * 1000);
//   }
// });







// ===============================
// 🚨 ZONE ALERT HANDLER
// ===============================
// socket.on("zone-alert", ({ touristId, zoneName, risk }) => {
//   const myTid = touristRef.current?.tid || localStorage.getItem("current_tid");
//   if (touristId !== myTid) return;

//   const zoneKey = `${myTid}_${zoneName}`;

//   // ===============================
//   // 🎵 PLAY SOUND
//   // ===============================
//   playAlertSound(risk);

//   // Call parent
//   onGeofenceAlert?.({ type: "zone", name: zoneName, risk });

//   // ===============================
//   // ⚠️ TAILWIND POPUP ALERT
//   // ===============================
//   const alertDiv = document.createElement("div");
//   alertDiv.className =
//     "fixed inset-0 flex items-center justify-center bg-black/40 z-[9999]";

//   alertDiv.innerHTML = `
//     <div class="bg-white rounded-xl shadow-2xl w-80 p-5 animate-bounce-in">
//       <h2 class="text-red-600 font-bold text-lg mb-2 flex items-center gap-2">
//         ⚠ Zone Alert
//       </h2>

//       <p class="text-gray-700 text-sm leading-relaxed mb-4">
//         You entered a restricted zone:
//         <span class="font-semibold text-black">${zoneName}</span><br/>
//         Risk Level:
//         <span class="font-bold ${risk === "high"
//           ? "text-red-600"
//           : risk === "medium"
//           ? "text-orange-500"
//           : "text-green-600"}">
//           ${risk}
//         </span>
//       </p>

//       <button id="closeZoneAlert" class="w-full py-2 rounded-lg bg-red-600 hover:bg-red-700 transition text-white font-medium">
//         Close
//       </button>
//     </div>
//   `;

//   document.body.appendChild(alertDiv);
// setTimeout(() => {
//     const btn = document.getElementById("closeZoneAlert");
//     if (btn) {
//       btn.onclick = () => {
//         alertDiv.remove();
//       };
//     }
//   }, 100);
//   // document.getElementById("closeZoneAlert")?.addEventListener("click", () => {
//   //   alertDiv.remove();
//   // });

//   // ===============================
//   // ⏱ REPEATING EVERY 10 MINUTES
//   // ===============================
//   if (!zoneAlertTimers[zoneKey]) {
//     zoneAlertTimers[zoneKey] = setInterval(() => {
//       // re-show popup
//       playAlertSound(risk);

//       const repeatDiv = document.createElement("div");
//       repeatDiv.className =
//         "fixed inset-0 flex items-center justify-center bg-black/40 z-[9999]";

//       repeatDiv.innerHTML = `
//         <div class="bg-white rounded-xl shadow-2xl w-80 p-5 animate-bounce-in">
//           <h2 class="text-red-600 font-bold text-lg mb-2">⚠ Zone Alert</h2>
//           <p class="text-gray-700 text-sm mb-4">
//             You are STILL inside zone:
//             <b>${zoneName}</b><br/>
//             Risk: <b>${risk}</b>
//           </p>
//           <button class="w-full py-2 rounded-lg bg-red-600 hover:bg-red-700 transition text-white font-medium closeRepeat">
//             OK
//           </button>
//         </div>
//       `;

//       document.body.appendChild(repeatDiv);

//       repeatDiv.querySelector(".closeRepeat")?.addEventListener("click", () =>
//         repeatDiv.remove()
//       );
//     }, 10 * 60 * 1000); // 10 minutes
//   }
// });
