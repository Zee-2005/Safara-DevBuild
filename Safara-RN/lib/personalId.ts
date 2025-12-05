// src/services/personalId.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import {API_BASE} from "../config/api";

// const BASE = "http://192.168.0.100:3000/api/v1/pid";

type PersonalApiResponse = {
  _id: string;           // Mongo ObjectId – used as holderPid
  personalId: string;    // public PID
  fullName: string;
  email: string;
  mobile: string;
  dob?: string | null;
};

export async function fetchAndSyncPersonalIdByEmail(
  email: string
): Promise<PersonalApiResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/pid/mine?email=${encodeURIComponent(email)}`);
    if (!res.ok) {
      // 404 is fine => no PID yet
      return null;
    }
    const data = (await res.json()) as PersonalApiResponse;

    // ✅ Persist BOTH internal _id and public personalId with email-scoped keys
    await AsyncStorage.setItem(`pid_application_id:${email}`, data._id || "");
    await AsyncStorage.setItem(`pid_personal_id:${email}`, data.personalId || "");
    await AsyncStorage.setItem(`pid_full_name:${email}`, data.fullName || "");
    await AsyncStorage.setItem(`pid_email:${email}`, data.email || "");
    await AsyncStorage.setItem(`pid_mobile:${email}`, data.mobile || "");
    await AsyncStorage.setItem(`pid_dob:${email}`, data.dob || "");

    return data;
  } catch {
    return null;
  }
}
