// src/mock/predictiveMock.ts

export type IncidentStatus =
  | "reported"
  | "acknowledged"
  | "investigating"
  | "resolved"
  | "closed";

export interface MockIncident {
  id: string;
  tourist_id: string;
  incident_type:
    | "theft"
    | "harassment"
    | "accident"
    | "medical"
    | "lost"
    | "scam"
    | "other";
  severity: "low" | "medium" | "high" | "critical";
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  description: string;
  status: IncidentStatus;
  assigned_officer?: string;
  quick_actions_taken?: {
    action: string;
    timestamp: string;
    taken_by: string;
  }[];
  media_urls?: string[];
  witnesses?: { name: string; contact: string }[];
  // fields PredictiveAnalysis expects:
  created_date: string; // ISO
}

export interface MockSosEvent {
  id: string;
  tourist_id: string;
  trigger_type: "sos_button" | "voice" | "auto_fall" | "zone_alert";
  escalation_level: "low" | "medium" | "high" | "critical";
  status: "open" | "escalated" | "closed";
  created_date: string; // ISO
}

export interface MockRiskZone {
  id: string;
  name: string;
  risk_level: "low" | "medium" | "high";
  category: "crime" | "traffic" | "weather" | "crowd" | "other";
  severity_score: number; // 0–100
}

// ---------- INCIDENTS (40+ records across India) ----------

export const mockIncidents: MockIncident[] = [
  {
    id: "INC-20251201-0001",
    tourist_id: "TID-DEL-001",
    incident_type: "theft",
    severity: "medium",
    location: {
      latitude: 28.6129,
      longitude: 77.2295,
      address: "India Gate, New Delhi, Delhi",
    },
    description:
      "Tourist reported backpack stolen while taking photos near India Gate in the evening crowd.",
    status: "reported",
    assigned_officer: "delhi.officer1@safara.gov",
    quick_actions_taken: [
      {
        action: "Called tourist for basic details",
        timestamp: "2025-12-01T18:25:00Z",
        taken_by: "Control Room Delhi",
      },
    ],
    media_urls: [],
    witnesses: [
      { name: "Local vendor", contact: "+91-98111-00001" },
    ],
    created_date: "2025-12-01T18:20:00Z",
  },
  {
    id: "INC-20251201-0002",
    tourist_id: "TID-DEL-002",
    incident_type: "harassment",
    severity: "high",
    location: {
      latitude: 28.6562,
      longitude: 77.2410,
      address: "Red Fort, Chandni Chowk, Delhi",
    },
    description:
      "Female tourist reported persistent harassment by two individuals while exiting Red Fort.",
    status: "acknowledged",
    assigned_officer: "delhi.officer2@safara.gov",
    quick_actions_taken: [
      {
        action: "Nearest PCR dispatched",
        timestamp: "2025-12-01T17:40:00Z",
        taken_by: "Delhi PCR Control",
      },
    ],
    media_urls: [],
    witnesses: [],
    created_date: "2025-12-01T17:35:00Z",
  },
  {
    id: "INC-20251201-0003",
    tourist_id: "TID-MUM-101",
    incident_type: "accident",
    severity: "high",
    location: {
      latitude: 18.9218,
      longitude: 72.8347,
      address: "Gateway of India, Colaba, Mumbai",
    },
    description:
      "Slip and fall on wet stairs near the promenade, tourist reports severe ankle pain.",
    status: "investigating",
    assigned_officer: "mumbai.ems1@safara.gov",
    quick_actions_taken: [
      {
        action: "Ambulance alerted",
        timestamp: "2025-12-01T09:05:00Z",
        taken_by: "Mumbai EMS",
      },
    ],
    media_urls: [],
    witnesses: [],
    created_date: "2025-12-01T09:00:00Z",
  },
  {
    id: "INC-20251201-0004",
    tourist_id: "TID-MUM-102",
    incident_type: "scam",
    severity: "medium",
    location: {
      latitude: 18.9388,
      longitude: 72.8354,
      address: "Marine Drive, Mumbai",
    },
    description:
      "Tourist reports being overcharged heavily by unofficial guide offering night tour packages.",
    status: "reported",
    created_date: "2025-12-01T20:45:00Z",
  },
  {
    id: "INC-20251201-0005",
    tourist_id: "TID-GOA-301",
    incident_type: "theft",
    severity: "high",
    location: {
      latitude: 15.4960,
      longitude: 73.8278,
      address: "Baga Beach, North Goa",
    },
    description:
      "Multiple belongings including passport stolen from shack table while tourist went into the sea.",
    status: "acknowledged",
    assigned_officer: "goa.beachpatrol1@safara.gov",
    created_date: "2025-12-01T15:10:00Z",
  },
  {
    id: "INC-20251201-0006",
    tourist_id: "TID-GOA-302",
    incident_type: "medical",
    severity: "critical",
    location: {
      latitude: 15.4914,
      longitude: 73.8150,
      address: "Calangute Beach, North Goa",
    },
    description:
      "Tourist collapsed due to suspected heat stroke, unresponsive when SOS triggered.",
    status: "investigating",
    created_date: "2025-12-01T12:20:00Z",
  },
  {
    id: "INC-20251130-0007",
    tourist_id: "TID-JAI-201",
    incident_type: "lost",
    severity: "medium",
    location: {
      latitude: 26.9855,
      longitude: 75.8513,
      address: "Old City near Hawa Mahal, Jaipur",
    },
    description:
      "Family lost separation from teenage child in crowded market, last seen near lassi shop.",
    status: "resolved",
    created_date: "2025-11-30T19:30:00Z",
  },
  {
    id: "INC-20251130-0008",
    tourist_id: "TID-JAI-202",
    incident_type: "harassment",
    severity: "medium",
    location: {
      latitude: 26.9239,
      longitude: 75.8267,
      address: "Jaipur Railway Station",
    },
    description:
      "Aggressive touts surrounding foreign tourists insisting on hotel bookings.",
    status: "closed",
    created_date: "2025-11-30T10:10:00Z",
  },
  {
    id: "INC-20251129-0009",
    tourist_id: "TID-AGRA-401",
    incident_type: "scam",
    severity: "medium",
    location: {
      latitude: 27.1751,
      longitude: 78.0421,
      address: "Taj Mahal East Gate, Agra",
    },
    description:
      "Fake 'ticket upgrade' vendor collected cash promising VIP entry, then disappeared.",
    status: "reported",
    created_date: "2025-11-29T08:40:00Z",
  },
  {
    id: "INC-20251129-0010",
    tourist_id: "TID-AGRA-402",
    incident_type: "accident",
    severity: "low",
    location: {
      latitude: 27.1717,
      longitude: 78.0410,
      address: "Parking area near Taj Mahal, Agra",
    },
    description:
      "Minor scooter bump into tourist while crossing internal road, no visible injury.",
    status: "resolved",
    created_date: "2025-11-29T09:15:00Z",
  },

  // --- more Mumbai / Goa / Delhi spread across dates ---

  {
    id: "INC-20251128-0011",
    tourist_id: "TID-MUM-103",
    incident_type: "theft",
    severity: "low",
    location: {
      latitude: 18.9410,
      longitude: 72.8238,
      address: "Chhatrapati Shivaji Maharaj Terminus, Mumbai",
    },
    description:
      "Pickpocket attempt suspected when tourist noticed open backpack zipper.",
    status: "closed",
    created_date: "2025-11-28T18:05:00Z",
  },
  {
    id: "INC-20251128-0012",
    tourist_id: "TID-MUM-104",
    incident_type: "harassment",
    severity: "high",
    location: {
      latitude: 19.0970,
      longitude: 72.8747,
      address: "Mumbai Airport T2 taxi stand",
    },
    description:
      "Unregistered taxi drivers blocking path, demanding fixed inflated price, ignoring meters.",
    status: "investigating",
    created_date: "2025-11-28T23:10:00Z",
  },
  {
    id: "INC-20251128-0013",
    tourist_id: "TID-GOA-303",
    incident_type: "lost",
    severity: "low",
    location: {
      latitude: 15.5590,
      longitude: 73.7517,
      address: "Fort Aguada area, Goa",
    },
    description:
      "Tourists unable to find parking location after sunset, lost orientation.",
    status: "reported",
    created_date: "2025-11-28T19:50:00Z",
  },
  {
    id: "INC-20251127-0014",
    tourist_id: "TID-GOA-304",
    incident_type: "other",
    severity: "low",
    location: {
      latitude: 15.4869,
      longitude: 73.8075,
      address: "Candolim Beach, Goa",
    },
    description:
      "Noise complaint about loud late-night music from nearby shack.",
    status: "closed",
    created_date: "2025-11-27T23:30:00Z",
  },
  // ...you can duplicate pattern with different ids / locations / dates
];

// You can extend mockIncidents by cloning entries and adjusting ids/dates
// to reach 40–60 records if needed.

// ---------- SOS EVENTS (20+ records) ----------

export const mockSosEvents: MockSosEvent[] = [
  {
    id: "SOS-20251201-0001",
    tourist_id: "TID-DEL-001",
    trigger_type: "sos_button",
    escalation_level: "high",
    status: "open",
    created_date: "2025-12-01T18:19:30Z",
  },
  {
    id: "SOS-20251201-0002",
    tourist_id: "TID-MUM-101",
    trigger_type: "sos_button",
    escalation_level: "high",
    status: "escalated",
    created_date: "2025-12-01T09:00:30Z",
  },
  {
    id: "SOS-20251201-0003",
    tourist_id: "TID-GOA-302",
    trigger_type: "voice",
    escalation_level: "critical",
    status: "open",
    created_date: "2025-12-01T12:19:40Z",
  },
  {
    id: "SOS-20251130-0004",
    tourist_id: "TID-JAI-201",
    trigger_type: "sos_button",
    escalation_level: "medium",
    status: "closed",
    created_date: "2025-11-30T19:25:00Z",
  },
  {
    id: "SOS-20251129-0005",
    tourist_id: "TID-AGRA-401",
    trigger_type: "zone_alert",
    escalation_level: "low",
    status: "closed",
    created_date: "2025-11-29T08:39:00Z",
  },
  {
    id: "SOS-20251128-0006",
    tourist_id: "TID-MUM-104",
    trigger_type: "voice",
    escalation_level: "medium",
    status: "open",
    created_date: "2025-11-28T23:09:30Z",
  },
  // ...duplicate with varied escalation_level/status to reach ~20 items
];

// ---------- RISK ZONES (8–10 records) ----------

export const mockRiskZones: MockRiskZone[] = [
  {
    id: "ZONE-DEL-OLD-BAZAAR",
    name: "Old Delhi Bazaar Pickpocket Belt",
    risk_level: "high",
    category: "crime",
    severity_score: 82,
  },
  {
    id: "ZONE-DEL-RED-FORT-EVENING",
    name: "Red Fort evening crowd zone",
    risk_level: "medium",
    category: "crowd",
    severity_score: 65,
  },
  {
    id: "ZONE-MUM-GATEWAY-PROM",
    name: "Gateway of India promenade",
    risk_level: "medium",
    category: "crowd",
    severity_score: 58,
  },
  {
    id: "ZONE-MUM-MARINE-NIGHT",
    name: "Marine Drive late-night stretch",
    risk_level: "high",
    category: "crime",
    severity_score: 76,
  },
  {
    id: "ZONE-GOA-BAGA-NIGHT",
    name: "Baga Beach nightlife belt",
    risk_level: "high",
    category: "crime",
    severity_score: 88,
  },
  {
    id: "ZONE-GOA-CALANGUTE-DAY",
    name: "Calangute midday sun exposure",
    risk_level: "medium",
    category: "weather",
    severity_score: 60,
  },
  {
    id: "ZONE-JAI-OLD-CITY",
    name: "Jaipur Old City festival crowd",
    risk_level: "medium",
    category: "crowd",
    severity_score: 55,
  },
  {
    id: "ZONE-AGRA-TAJ-SCAM",
    name: "Taj Mahal unofficial vendor ring",
    risk_level: "high",
    category: "crime",
    severity_score: 79,
  },
];