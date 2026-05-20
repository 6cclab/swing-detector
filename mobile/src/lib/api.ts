import { API_BASE_URL } from "./config";
import { getToken } from "./auth";

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export async function apiGet<T>(path: string): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}${path}`, { headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status}: ${body}`);
  }
  return res.json();
}

export async function apiPost<T>(
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

export async function apiPatch<T>(
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

export async function apiUpload<T>(
  path: string,
  fileUri: string,
  fileName: string,
  fields?: Record<string, string>
): Promise<T> {
  const headers = await authHeaders();
  const formData = new FormData();

  formData.append("video", {
    uri: fileUri,
    name: fileName,
    type: "video/mp4",
  } as unknown as Blob);

  if (fields) {
    for (const [key, value] of Object.entries(fields)) {
      formData.append(key, value);
    }
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}
