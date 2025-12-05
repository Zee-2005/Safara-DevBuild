//context/UserDataContext.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  getSession,
  getUserItem,
  setUserItem,
  removeUserItem,
  clearUserPidData,
  Session,
} from "@/lib/session";
import { readTripDraft, clearTripDraft } from "@/lib/trip";

interface PersonalData {
  id: string;
  pid_application_id?: string | null;
  pid_full_name?: string | null;
  pid_mobile?: string | null;
  pid_email?: string | null;
  pid_personal_id?: string | null;
  pid_nationality?: string | null;
}

interface TouristData {
  tid?: string | null;
  tid_status?: string | null;
  trip?: any;
}

interface UserDataContextType {
  personal: PersonalData;
  tourist: TouristData;
  updatePersonal: (data: Partial<PersonalData>) => void;
  updateTourist: (data: Partial<TouristData>) => void;
  clearAll: () => void;
}

const UserDataContext = createContext<UserDataContextType | undefined>(
  undefined
);

export const UserDataProvider = ({ children }: { children: ReactNode }) => {
  const [personal, setPersonal] = useState<PersonalData>({});
  const [tourist, setTourist] = useState<TouristData>({});

  // 1️⃣ Load from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      const s = await getSession();
      console.log("🟦 Loaded session:", s);
      if (!s) {
        console.warn("⚠️ No session found — user is not logged in.");
        return;
      }

      // Load PID-related data
      const savedPersonal: PersonalData = {
        pid_application_id: await getUserItem("pid_application_id", s),
        pid_full_name: await getUserItem("pid_full_name", s),
        pid_mobile: await getUserItem("pid_mobile", s),
        pid_email: await getUserItem("pid_email", s),
        pid_personal_id: await getUserItem("pid_personal_id", s),
        pid_nationality: await getUserItem("pid_nationality", s),
      };
      console.log("🟩 Personal (AsyncStorage):", savedPersonal);
      setPersonal(savedPersonal);

      // Load Tourist ID + trip draft
      const tid = await getUserItem("current_tid", s);
      const tid_status = await getUserItem("current_tid_status", s);
      let tripDraft: any = null;
      const tripRaw = await getUserItem("trip_draft", s);
      if (tripRaw) {
        try {
          tripDraft = JSON.parse(tripRaw);
        } catch {
          tripDraft = null;
        }
      } else {
        // Fallback to computed draft from trip lib
        tripDraft = await readTripDraft();
      }

      const savedTourist: TouristData = {
        tid: tid || null,
        tid_status: tid_status || null,
        trip: tripDraft,
      };
      console.log("🟧 Tourist (AsyncStorage):", savedTourist);
      setTourist(savedTourist);
    })();
  }, []);

  // 4️⃣ Update personal
  const updatePersonal = (data: Partial<PersonalData>) => {
    console.log("🔵 Updating Personal:", data);
    setPersonal((prev) => {
      const updated = { ...prev, ...data };
      // fire-and-forget persistence
      (async () => {
        const s = await getSession();
        if (!s) return;
        for (const key in data) {
          const value = data[key as keyof PersonalData];
          if (value !== undefined) {
            await setUserItem(key, String(value ?? ""), s);
          }
        }
      })();
      return updated;
    });
  };

  // 5️⃣ Update tourist
  const updateTourist = (data: Partial<TouristData>) => {
    console.log("🟣 Updating Tourist:", data);
    setTourist((prev) => {
      const updated = { ...prev, ...data };
      (async () => {
        const s = await getSession();
        if (!s) return;
        if (data.tid !== undefined) {
          await setUserItem("current_tid", data.tid ?? "", s);
        }
        if (data.tid_status !== undefined) {
          await setUserItem("current_tid_status", data.tid_status ?? "", s);
        }
        if (data.trip !== undefined) {
          await setUserItem(
            "trip_draft",
            data.trip ? JSON.stringify(data.trip) : "",
            s
          );
        }
      })();
      return updated;
    });
  };

  // 6️⃣ Clear all (per-user)
  const clearAll = () => {
    console.log("🧹 Clearing All Data");
    setPersonal({});
    setTourist({});
    (async () => {
      const s: Session | null = await getSession();
      if (!s) return;
      await clearUserPidData(s);
      // Clear trip-related keys
      await clearTripDraft();
      await removeUserItem("current_tid", s);
      await removeUserItem("current_tid_status", s);
      await removeUserItem("trip_draft", s);
    })();
  };

  return (
    <UserDataContext.Provider
      value={{ personal, tourist, updatePersonal, updateTourist, clearAll }}
    >
      {children}
    </UserDataContext.Provider>
  );
};

export const useUserData = (): UserDataContextType => {
  const ctx = useContext(UserDataContext);
  if (!ctx) throw new Error("useUserData must be used inside UserDataProvider");
  return ctx;
};
