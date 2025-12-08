// libs/touristId.ts (React Native)

import AsyncStorage from "@react-native-async-storage/async-storage";
import { readTripDraft, TripDraft } from "./trip";

export type TouristIdStatus = "active" | "scheduled" | "expired";

export type TouristIdRecord = {
  id: string; // TID-...
  holderPid: string | null; // PID applicationId (_id)
  destination: string | null;
  startDate: string | null; // yyyy-mm-dd
  endDate: string | null;   // yyyy-mm-dd
  status: TouristIdStatus;
  createdAt: string;
  itinerary?: string | null;
  agencyId?: string | null;
  homeCity?: string | null;
};

function computeStatus(
  start?: string | null,
  end?: string | null
): TouristIdStatus {
  const now = new Date();
  const s = start ? new Date(start) : null;
  const e = end ? new Date(end) : null;

  if (s && e) {
    if (now < s) return "scheduled";
    if (now > e) return "expired";
    return "active";
  }

  return "scheduled";
}

/**
 * Generate and persist a local Tourist ID record from the per-user trip draft.
 * userKey should match the email used in your PID storage (pid_...:${email}).
 * For holderPid this uses the PID *applicationId* (`pid_application_id:${email}`)
 * so it stays consistent with the backend holderPid field.
 */
export async function saveTouristIdFromDraft(
  userKey: string
): Promise<TouristIdRecord> {
  const draft: TripDraft = await readTripDraft(userKey);

  // Use PID applicationId as holderPid to match backend expectations
  const pidApplicationId =
    (await AsyncStorage.getItem(`pid_application_id:${userKey}`)) || null;

  const start = draft.startNow
    ? new Date().toISOString().slice(0, 10)
    : draft.startDate || null;

  const end = draft.endDate || null;

  const id = `TID-${new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "")}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;
console.log(id);

  const status = computeStatus(start, end);
  const rec: TouristIdRecord = {
    id,
    holderPid: pidApplicationId,
    destination: draft.destination || null,
    startDate: start,
    endDate: end,
    status,
    createdAt: new Date().toISOString(),
    itinerary: draft.itinerary || null,
    agencyId: draft.agencyId || null,
    homeCity: draft.homeCity || null,
  };

  // Persist under user namespace using same pattern as PID services
  await Promise.all([
    AsyncStorage.setItem(`tourist_id:${userKey}`, rec.id),
    AsyncStorage.setItem(
      `tourist_id_start:${userKey}`,
      rec.startDate || ""
    ),
    AsyncStorage.setItem(
      `tourist_id_end:${userKey}`,
      rec.endDate || ""
    ),
    AsyncStorage.setItem(
      `tourist_id_destination:${userKey}`,
      rec.destination || ""
    ),
    AsyncStorage.setItem(
      `tourist_id_status:${userKey}`,
      rec.status
    ),
    AsyncStorage.setItem(
      `tourist_id_created:${userKey}`,
      rec.createdAt
    ),
    AsyncStorage.setItem(
      `tourist_id_itinerary:${userKey}`,
      rec.itinerary || ""
    ),
    AsyncStorage.setItem(
      `tourist_id_agency:${userKey}`,
      rec.agencyId || ""
    ),
    AsyncStorage.setItem(
      `tourist_id_home:${userKey}`,
      rec.homeCity || ""
    ),
  ]);

  return rec;
}
