// libs/tourist.service.ts (React Native)
import {API_BASE} from '../config/api';

// const BASE = "http://192.168.0.100:3000/api/v1/tourist";

type TripStatus = "active" | "scheduled" | "expired";
export type TravelerType = "indian" | "international";

export type CreateTripPayload = {
  // Send userId in body (backend also accepts x-user-id header)
  userId: string;
  holderPid: string; // PID applicationId (_id) used as holderPid
  startDate: string; // yyyy-mm-dd
  endDate: string;   // yyyy-mm-dd
  destination?: string | null;
  itinerary?: string | null;
  agencyId?: string | null;
  homeCity?: string | null;
  travelerType?: TravelerType;
};

export type TripResponse = {
  tid: string;
  status: TripStatus;
  startDate: string;
  endDate: string;
  destination: string | null;
  itinerary: string | null;
  agencyId: string | null;
  homeCity: string | null;
  travelerType: TravelerType;
  createdAt: string;
};

async function parse(res: Response) {
  if (!res.ok) {
    const ct = res.headers.get("content-type") || "";
    let msg = `${res.status} ${res.statusText}`;
    try {
      if (ct.includes("application/json")) {
        const body = (await res.json()) as any;
        msg = body?.error || msg;
      } else {
        const text = await res.text();
        msg = text || msg;
      }
    } catch {
      // ignore parse errors; fall back to default msg
    }
    throw new Error(msg);
  }

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return res.json();
  }
  return res.text();
}

export async function createTrip(
  payload: CreateTripPayload
): Promise<TripResponse> {
  const res = await fetch(`${API_BASE}/tourist/trips`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return (parse(res) as Promise<TripResponse>);
}

// React Native file-like type for uploads
export type UploadableFile = {
  uri: string;
  name: string;
  type: string;
};

export type UploadTripDocsFiles = {
  passport?: UploadableFile | null;
  visa?: UploadableFile | null;
  ticket?: UploadableFile | null;
  hotel?: UploadableFile | null;
  permits?: UploadableFile | null;
};

export async function uploadTripDocs(
  tid: string,
  travelerType: TravelerType,
  files: UploadTripDocsFiles
): Promise<{ ok: true; tid: string; travelerType: TravelerType }> {
  const fd = new FormData();

  if (travelerType === "international") {
    if (files.passport) {
      fd.append("passport", files.passport as any);
    }
    if (files.visa) {
      fd.append("visa", files.visa as any);
    }
  }

  if (files.ticket) {
    fd.append("ticket", files.ticket as any);
  }

  if (files.hotel) {
    fd.append("hotel", files.hotel as any);
  }

  if (travelerType === "indian" && files.permits) {
    fd.append("permits", files.permits as any);
  }

  const res = await fetch(`${API_BASE}/tourist/trips/${encodeURIComponent(tid)}/docs`, {
    method: "POST",
    // Do NOT set Content-Type manually for FormData in React Native
    body: fd,
  });

  return (parse(res) as Promise<{ ok: true; tid: string; travelerType: TravelerType }>);
}

export async function getMyTrips(
  userId: string
): Promise<{
  trips: Array<TripResponse>;
}> {
  const url = `${API_BASE}/tourist/trips?userId=${encodeURIComponent(userId)}`;
  const res = await fetch(url, {
    method: "GET",
  });

  return (parse(res) as Promise<{
    trips: Array<TripResponse>;
  }>);
}

export async function getTrip(tid: string): Promise<TripResponse> {
  const res = await fetch(`${API_BASE}/tourist/trips/${encodeURIComponent(tid)}`, {
    method: "GET",
  });

  return (parse(res) as Promise<TripResponse>);
}
