// lib/trip.ts (React Native, backward‑compatible)

import AsyncStorage from "@react-native-async-storage/async-storage";

export type TripMode = "agencies" | "ai" | "direct";

export type TripDraft = {
  mode: TripMode;
  startNow?: boolean;
  startDate?: string | null; // yyyy-mm-dd
  endDate?: string | null;   // yyyy-mm-dd
  destination?: string | null;
  itinerary?: string | null;
  agencyId?: string | null;
  homeCity?: string | null;
};

const KEYS = [
  "trip_mode",
  "trip_start_now",
  "trip_start",
  "trip_end",
  "trip_destination",
  "trip_itinerary",
  "trip_agency",
  "trip_home_city",
];

// if userKey is omitted, fall back to a global namespace so older calls work
function k(base: string, userKey?: string) {
  const suffix = userKey ? `:${userKey}` : ":global";
  return `${base}${suffix}`;
}

/**
 * Save trip draft.
 * - New usage (preferred): saveTripDraft(userKey, draft)
 * - Old usage (still supported): saveTripDraft(draft)
 */
export async function saveTripDraft(
  userKeyOrDraft: string | TripDraft,
  maybeDraft?: TripDraft
): Promise<void> {
  let userKey: string | undefined;
  let d: TripDraft;

  if (typeof userKeyOrDraft === "string") {
    userKey = userKeyOrDraft;
    d = maybeDraft || { mode: "direct" };
  } else {
    userKey = undefined; // global namespace
    d = userKeyOrDraft;
  }

  const mode: TripMode = d.mode || "direct";

  const ops: Array<Promise<void>> = [];

  ops.push(AsyncStorage.setItem(k("trip_mode", userKey), mode));
  ops.push(
    AsyncStorage.setItem(
      k("trip_start_now", userKey),
      d.startNow ? "1" : "0"
    )
  );
  ops.push(
    AsyncStorage.setItem(
      k("trip_start", userKey),
      d.startDate || ""
    )
  );
  ops.push(
    AsyncStorage.setItem(
      k("trip_end", userKey),
      d.endDate || ""
    )
  );
  ops.push(
    AsyncStorage.setItem(
      k("trip_destination", userKey),
      d.destination || ""
    )
  );
  ops.push(
    AsyncStorage.setItem(
      k("trip_itinerary", userKey),
      d.itinerary || ""
    )
  );
  ops.push(
    AsyncStorage.setItem(
      k("trip_agency", userKey),
      d.agencyId || ""
    )
  );
  if (d.homeCity !== undefined) {
    ops.push(
      AsyncStorage.setItem(
        k("trip_home_city", userKey),
        d.homeCity || ""
      )
    );
  }

  await Promise.all(ops);
}

/**
 * Read trip draft.
 * - New usage (preferred): readTripDraft(userKey)
 * - Old usage (still supported): readTripDraft()
 */
export async function readTripDraft(userKey?: string): Promise<TripDraft> {
  const [
    mode,
    startNow,
    start,
    end,
    destination,
    itinerary,
    agencyId,
    homeCity,
  ] = await Promise.all([
    AsyncStorage.getItem(k("trip_mode", userKey)),
    AsyncStorage.getItem(k("trip_start_now", userKey)),
    AsyncStorage.getItem(k("trip_start", userKey)),
    AsyncStorage.getItem(k("trip_end", userKey)),
    AsyncStorage.getItem(k("trip_destination", userKey)),
    AsyncStorage.getItem(k("trip_itinerary", userKey)),
    AsyncStorage.getItem(k("trip_agency", userKey)),
    AsyncStorage.getItem(k("trip_home_city", userKey)),
  ]);

  return {
    mode: (mode as TripMode) || "direct",
    startNow: startNow === "1",
    startDate: start || null,
    endDate: end || null,
    destination: destination || null,
    itinerary: itinerary || null,
    agencyId: agencyId || null,
    homeCity: homeCity || null,
  };
}

/**
 * Clear trip draft.
 * - New usage (preferred): clearTripDraft(userKey)
 * - Old usage (still supported): clearTripDraft()
//  */
export async function clearTripDraft(userKey?: string): Promise<void> {
  await Promise.all(
    KEYS.map((base) => AsyncStorage.removeItem(k(base, userKey)))
  );
}
