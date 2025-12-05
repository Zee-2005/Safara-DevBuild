import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_BASE} from "../config/api";

type Tokens = { access: string; refresh: string };
type User = { id: string; email?: string | null; phone?: string | null };

// const BASE = 'https://safara-backend.onrender.com/api/v1/auth';
// const BASE = 'http://192.168.0.100:3000/api/v1/auth';

export async function signup(email: string, password: string, phone?: string) {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, phone }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Signup failed');
  const data: { user: User } & Tokens = await res.json();
  await saveTokens(data);
  return data.user;
}

export async function loginEmail(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Login failed');
  const data: { user: User } & Tokens = await res.json();
  await saveTokens(data);
  return data.user;
}

export async function requestOtp(phone: string) {
  const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
  const res = await fetch(`${API_BASE}/auth/otp/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: formattedPhone }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'OTP request failed');
  return (await res.json()) as { requestId: string };
}

export async function verifyOtp(requestId: string, code: string) {
  const res = await fetch(`${API_BASE}/auth/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId, code }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'OTP verification failed');
  const data: { user: User } & Tokens = await res.json();
  await saveTokens(data);
  return data.user;
}

export async function getMe() {
  const tokens = await loadTokens();
  if (!tokens?.access) return null;
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${tokens.access}` },
  });
  if (!res.ok) return null;
  return (await res.json()).user as User;
}

async function saveTokens({ access, refresh }: Tokens) {
  await AsyncStorage.setItem('sft_access', access);
  await AsyncStorage.setItem('sft_refresh', refresh);
}

async function loadTokens() {
  const access = (await AsyncStorage.getItem('sft_access')) || '';
  const refresh = (await AsyncStorage.getItem('sft_refresh')) || '';
  return { access, refresh };
}
