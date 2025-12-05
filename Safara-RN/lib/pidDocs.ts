// src/lib/pidDocs.ts
import {API_BASE} from '../config/api';
// const BASE = 'https://safara-backend.onrender.com/api/v1/auth';
// const BASE = 'http://192.168.0.100:3000/api/v1/pid';

async function parseError(res: Response) {
  let msg = 'Request failed';
  const ct = res.headers.get('content-type') || '';
  try {
    if (ct.includes('application/json')) {
      const j = await res.json();
      msg = j?.error || msg;
    } else {
      const t = await res.text();
      if (t) msg = t;
    }
  } catch {}
  return msg;
}

// react-native-document-picker or react-native-image-picker returns an object; pass that as `file`
export async function uploadAadhaarDoc(applicationId: string, file: { uri: string, name: string, type: string }) {
  const fd = new FormData();
  fd.append('applicationId', applicationId);
  fd.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.type
  } as any);

  const res = await fetch(`${API_BASE}/pid/docs/aadhaar`, {
    method: 'POST',
    headers: { 'Content-Type': 'multipart/form-data' },
    body: fd
  });
  if (!res.ok) throw new Error(await parseError(res));
  return await res.json() as { applicationId: string; uploaded: boolean; mime: string; size: number; status: string };
}

export async function verifyAadhaarServer(applicationId: string) {
  const res = await fetch(`${API_BASE}/pid/docs/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ applicationId })
  });
  if (!res.ok) throw new Error(await parseError(res));
  return await res.json() as {
    applicationId: string;
    extracted: { dob: string | null; aadhaarDigits: string | null };
    checks: { verhoeff: boolean };
    status: 'verified' | 'manual_review' | 'pending_verification' | 'rejected';
    documentVerified: boolean;
  };
}

export async function finalizePersonalId(applicationId: string) {
  const res = await fetch(`${API_BASE}/pid/finalize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ applicationId })
  });
  if (!res.ok) throw new Error(await parseError(res));
  return await res.json() as {
    personalId: string;
    name: string;
    aadhaarHash: string;
    dob: string | null;
    mobile: string;
    email: string;
    mobileVerified: boolean;
    emailVerified: boolean;
    documentVerified: boolean;
    status: 'verified';
    createdAt: string;
  };
}
