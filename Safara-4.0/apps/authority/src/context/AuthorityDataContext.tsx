


// src/context/AuthorityDataContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

// -------------------- Interfaces --------------------
interface PersonalData {
  pid_application_id?: string | null;
  pid_full_name?: string | null;
  pid_mobile?: string | null;
  pid_email?: string | null;
  pid_personal_id?: string | null;
  pid_nationality?: string | null;
}

interface TouristData {
  touristId?: string | null;
  tid_status?: string | null;
  tid_userId?: string | null;
  trip?: any;
}

interface TouristIdData {
  id: string;
  destination: string;
  validUntil: Date | string;
  status: "active" | "expiring" | "expired";
  holderName: string;
  issueDate: Date | string;
}

interface TouristLocation {
  id: string;
  latitude: number;
  longitude: number;
  name?: string;
  phone?: string;
  email?: string;
  nationality?: string;
  destination?: string;
  status?: string;
  tripStart?: string;
  tripEnd?: string;
  timestamp?: number;
  personalId?: string;
}

interface Incident {
  id: string;
  type?: string;
  touristSocketId?: string;
  touristId?: string;
  touristName?: string;
  touristPhone?: string;
  touristEmail?:string;
  location?: { lat: number; lng: number };
  description?: string;
  media?: { audio?: string; video?: string; photo?: string };
  createdAt?: number;
  time?: string;
  status?: "new" | "acknowledged" | "resolved";
  officer?: { id?: string; name?: string };
  [key: string]: any;
}

// -------------------- Context Type --------------------
interface AuthorityDataContextType {
  tourists: Record<string, TouristLocation>;
  incidents: Incident[];
  zones: any[];
  boundaries: any[];
  liveAlerts: any[];
  stats: any;
  socket: Socket | null;

  personal: PersonalData;
  touristInfo: TouristData;
  touristId?: TouristIdData;

  updatePersonal: (data: Partial<PersonalData>) => void;
  updateTouristInfo: (data: Partial<TouristData>) => void;
  updateTouristId: (data: Partial<TouristIdData>) => void;
}

const AuthorityDataContext = createContext<AuthorityDataContextType | undefined>(undefined);

// -------------------- Provider --------------------
export const AuthorityDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tourists, setTourists] = useState<Record<string, TouristLocation>>({});
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [boundaries, setBoundaries] = useState<any[]>([]);
  const [liveAlerts, setLiveAlerts] = useState<any[]>([]);
  const [stats, setStats] = useState({ activeTourists: 0, activeIncidents: 0 });
  const [socket, setSocket] = useState<Socket | null>(null);

  const [personal, setPersonal] = useState<PersonalData>({});
  const [touristInfo, setTouristInfo] = useState<TouristData>({});
  const [touristId, setTouristId] = useState<TouristIdData | undefined>(undefined);

  // -------------------- Update functions --------------------
  const updatePersonal = (data: Partial<PersonalData>) => setPersonal(prev => ({ ...prev, ...data }));
  const updateTouristInfo = (data: Partial<TouristData>) => setTouristInfo(prev => ({ ...prev, ...data }));
  const updateTouristId = (data: Partial<TouristIdData>) => setTouristId(prev => ({ ...prev, ...data } as TouristIdData));



useEffect(() => {
  const SOCKET_URL = import.meta.env.VITE_AUTHORITY_SOCKET_URL || "http://localhost:3000";
  const s = io(SOCKET_URL, { transports: ["websocket", "polling"], reconnection: true });
  setSocket(s);

  // ----------- TOURIST LOCATION -----------
  s.on("receive-location", (raw: any) => {
    const data: TouristLocation = {
      id: raw.socketId || raw.id || raw.tid,
      latitude: raw.latitude ?? raw.lat,
      longitude: raw.longitude ?? raw.lng,
      name: raw.name,
      phone: raw.phone,
      email: raw.email,
      nationality: raw.nationality,
      destination: raw.destination,
      status: raw.status,
      tripStart: raw.tripStart,
      tripEnd: raw.tripEnd,
      timestamp: raw.timestamp || Date.now(),
      personalId: raw.personalId,
    };

    if (!data.id || !data.latitude || !data.longitude) return;

    setTourists((prev) => {
      const next = { ...prev, [data.id]: data };
      setStats((st) => ({ ...st, activeTourists: Object.keys(next).length }));
      return next;
    });
  });

  s.on("user-disconnected", (id: string) => {
    setTourists((prev) => {
      const copy = { ...prev };
      delete copy[id];
      setStats((st) => ({ ...st, activeTourists: Object.keys(copy).length }));
      return copy;
    });
  });

  // ----------- INCIDENT LIST (INITIAL LOAD) -----------
  s.on("incident-list", (list: Incident[]) => {
    setIncidents(list);

    setStats((st) => ({
      ...st,
      activeIncidents: list.filter((i) => i.status !== "resolved").length,
    }));
  });

  // ----------- INCIDENT NEW (NO DUPLICATE LISTENER) -----------
  s.on("incident-new", async (inc: Incident) => {
    // reverse geocode function
    async function getPlaceName(lat: number, lng: number) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
          {
            headers: {
              "User-Agent": "Safara/1.0 (your-email@example.com)",
              "Accept-Language": "en",
            },
          }
        );

        const data = await res.json();
        return data.display_name || "Unknown Location";
      } catch (err) {
        console.error("Reverse geocode error:", err);
        return "Unknown Location";
      }
    }

    const placeName = inc.location
      ? await getPlaceName(inc.location.lat, inc.location.lng)
      : "Unknown Location";

    const enhancedIncident = {
      ...inc,
      placeName,
      touristName: inc.touristName || "Unknown Tourist",
      touristPhone: inc.touristPhone || "",
      media: {
        audio: inc.media?.audio || null,
        video: inc.media?.video || null,
        photo: inc.media?.photo || null,
      },
    };

    // update incident list
    setIncidents((prev) => {
      const updated = [enhancedIncident, ...prev];

      setStats((st) => ({
        ...st,
        activeIncidents: updated.filter((i) => i.status !== "resolved").length,
      }));

      return updated;
    });

    // update live alerts
    // setLiveAlerts((prev) => [
    //   {
    //     id: Date.now(),
    //     message: `New SOS from ${enhancedIncident.touristName}`,
    //     type: "incident",
    //     time: new Date().toLocaleTimeString(),
    //   },
    //   ...prev,
    // ]);
    
    setLiveAlerts((prev) => [
  {
    id: Date.now() + Math.random(),

    // MAIN NOTIFICATION MESSAGE
    //message: `New SOS from ${enhancedIncident.touristName}`,
    message: `New SOS from ${enhancedIncident.touristName}`,
    time: new Date().toLocaleTimeString(),
    type: "incident",

    // FULL TOURIST DATA
    touristId: enhancedIncident.touristId,
    touristName: enhancedIncident.touristName,
    touristPhone: enhancedIncident.phone,
    touristEmail: enhancedIncident.email || "",
    touristNationality: enhancedIncident.nationality || "",
    touristDestination: enhancedIncident.destination || "",
    personalId: enhancedIncident.personalId || "",
    status: enhancedIncident.status || "",

    // INCIDENT LOCATION
    latitude: enhancedIncident.location?.lat || null,
    longitude: enhancedIncident.location?.lng || null,
    placeName: enhancedIncident.placeName || "Unknown Location",

    // MEDIA (audio, video, photo)
    audio: enhancedIncident.media.audio || null,
    video: enhancedIncident.media.video || null,
    photo: enhancedIncident.media.photo || null,

    // INCIDENT SPECIFIC
    incidentType: enhancedIncident.type || "",
    incidentDetails: enhancedIncident.details || "",
    incidentTime: enhancedIncident.timestamp || "",

    // EXTRA (if exists)
    risk: enhancedIncident.risk || "unknown",
  },
  ...prev,
]);
  });

  // ----------- INCIDENT UPDATED -----------
  s.on("incident-updated", (inc: Incident) => {
    setIncidents((prev) => prev.map((p) => (p.id === inc.id ? inc : p)));

    setStats((st) => ({
      ...st,
      activeIncidents: prev.filter((i) => i.status !== "resolved").length,
    }));
  });


  // ----------- ZONES -----------
  s.on("zone-update", (z: any) =>
    setZones((prev) => [...prev.filter((v) => v.id !== z.id), z])
  );

  s.on("zone-deleted", ({ id }: { id: string }) =>
    setZones((prev) => prev.filter((z) => z.id !== id))
  );

  // ----------- BOUNDARIES -----------
  s.on("boundary-update", (b: any) =>
    setBoundaries((prev) => [...prev.filter((v) => v.id !== b.id), b])
  );

  s.on("boundary-deleted", ({ id }: { id: string }) =>
    setBoundaries((prev) => prev.filter((b) => b.id !== id))
  );

  // ----------- GEO ALERTS -----------
  s.on("zone-alert", (data: any) =>
    setLiveAlerts((prev) => [
      {
        id: Date.now(),
        message: `Tourist ${data.touristsId} entered ${data.zoneName}`,
        type: "zone",
        time: new Date().toLocaleTimeString(),
      },
      ...prev,
    ])
  );

  return () => {
    s.disconnect();
  };
}, []);

  return (
    <AuthorityDataContext.Provider
      value={{
        tourists,
        incidents,
        zones,
        boundaries,
        liveAlerts,
        stats,
        socket,
        personal,
        touristInfo,
        touristId,
        updatePersonal,
        updateTouristInfo,
        updateTouristId
      }}
    >
      {children}
    </AuthorityDataContext.Provider>
  );
};

// -------------------- Hook --------------------
export const useAuthorityData = () => {
  const ctx = useContext(AuthorityDataContext);
  if (!ctx) throw new Error("useAuthorityData must be used within AuthorityDataProvider");
  return ctx;
};





