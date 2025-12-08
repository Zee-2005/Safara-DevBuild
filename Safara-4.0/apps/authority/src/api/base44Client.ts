// src/api/base44Client.ts

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

async function postJSON(path: string, body: unknown) {
  const apiKey = import.meta.env.BASE44_API_KEY ?? "";

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Base44-Key": apiKey, // always a string
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed: ${res.status} ${text}`);
  }
  return res.json();
}




async function patchJSON(path: string, body: unknown) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed: ${res.status} ${text}`);
  }
  return res.json();
}

export const base44 = {
  integrations: {
    Core: {
      InvokeLLM: (payload: {
        prompt: string;
        response_json_schema: any;
      }) => postJSON("/ai/invoke-llm", payload),
    },
  },
  entities: {
    Incident: {
      update: (id: string, body: any) => patchJSON(`/incidents/${id}`, body),
    },
  },
};