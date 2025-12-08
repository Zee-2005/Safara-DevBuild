// // src/services/personalId.ts
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import {API_BASE} from "../config/api";

// // const BASE = "http://192.168.0.100:3000/api/v1/pid";

// type PersonalApiResponse = {
//   _id: string;           // Mongo ObjectId – used as holderPid
//   personalId: string;    // public PID
//   fullName: string;
//   email: string;
//   mobile: string;
//   dob?: string | null;
// };

// export async function fetchAndSyncPersonalIdByEmail(
//   email: string
// ): Promise<PersonalApiResponse | null> {
//   try {
//     const res = await fetch(`${API_BASE}/pid/mine?email=${encodeURIComponent(email)}`);
//     if (!res.ok) {
//       // 404 is fine => no PID yet
//       return null;
//     }
//     const data = (await res.json()) as PersonalApiResponse;

//     // ✅ Persist BOTH internal _id and public personalId with email-scoped keys
//     await AsyncStorage.setItem(`pid_application_id:${email}`, data._id || "");
//     await AsyncStorage.setItem(`pid_personal_id:${email}`, data.personalId || "");
//     await AsyncStorage.setItem(`pid_full_name:${email}`, data.fullName || "");
//     await AsyncStorage.setItem(`pid_email:${email}`, data.email || "");
//     await AsyncStorage.setItem(`pid_mobile:${email}`, data.mobile || "");
//     await AsyncStorage.setItem(`pid_dob:${email}`, data.dob || "");

//     return data;
//   } catch {
//     return null;
//   }
// }


// src/services/personalId.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "../config/api";
import { getSession, setUserItem } from "@/lib/session";

type PersonalApiResponse = {
  _id: string;
  personalId: string;
  fullName: string;
  email: string;
  mobile: string;
  dob?: string | null;
};

export async function fetchAndSyncPersonalIdByEmail(
  email: string
): Promise<PersonalApiResponse | null> {
  try {
    const res = await fetch(
      `${API_BASE}/pid/mine?email=${encodeURIComponent(email)}`
    );
    if (!res.ok) return null;

    const data = (await res.json()) as PersonalApiResponse;

    // email-scoped keys (existing)
    await Promise.all([
      AsyncStorage.setItem(`pid_application_id:${email}`, data._id || ""),
      AsyncStorage.setItem(`pid_personal_id:${email}`, data.personalId || ""),
      AsyncStorage.setItem(`pid_full_name:${email}`, data.fullName || ""),
      AsyncStorage.setItem(`pid_email:${email}`, data.email || ""),
      AsyncStorage.setItem(`pid_mobile:${email}`, data.mobile || ""),
      AsyncStorage.setItem(`pid_dob:${email}`, data.dob || ""),
    ]);

    // 🔹 ALSO write into session-scoped keys used by UserDataContext
    const s = await getSession();
    if (s) {
      await Promise.all([
        setUserItem("pid_application_id", data._id || "", s),
        setUserItem("pid_personal_id", data.personalId || "", s),
        setUserItem("pid_full_name", data.fullName || "", s),
        setUserItem("pid_email", data.email || "", s),
        setUserItem("pid_mobile", data.mobile || "", s),
      ]);
    }

    return data;
  } catch {
    return null;
  }
}
