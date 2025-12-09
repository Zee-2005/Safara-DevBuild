// server/src/types/sos.ts

export type EmergencyType =
  | "medical"
  | "harassment"
  | "accident"
  | "lost"
  | "theft"
  | "natural_disaster"
  | "suspicious_activity"
  | "other";

export interface SosPayload {
  touristId: string | null;
  touristName: string;
  touristPhone: string;
  location?: {
    lat: number;
    lng: number;
  };
  description: string;
  media: {
    audio?: string; // data URL or link
    photo?: string;
    video?: string;
  };
  isDemo: boolean;
  timestamp: string;

  emergencyType: EmergencyType;
  isChildInvolved: boolean;
}

export type SosUrgency =
  | "life_threatening"
  | "high"
  | "medium"
  | "low";

export type SosIncidentType =
  | "medical"
  | "harassment"
  | "accident"
  | "lost"
  | "theft"
  | "natural_disaster"
  | "suspicious_activity"
  | "other";

export interface SosTriageResult {
  urgency: SosUrgency;
  incident_type: SosIncidentType;
  summary: string;
  needs_police: boolean;
  needs_medical: boolean;
  needs_fire: boolean;
  contains_child: boolean;
  possibly_false_report: boolean;
  emergency_score: number;         // 0–1
  likely_non_emergency: boolean;
}