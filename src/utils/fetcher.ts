import { apiUrl } from "@/config";

export async function fetcher<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // Get token saved after login
  const token = localStorage.getItem("token");

  const res = await fetch(apiUrl(path), {
    ...options,

    // Important: DO NOT use cookies
    credentials: "omit",

    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("API Error:", res.status, body);
    throw new Error(body || `API error ${res.status}`);
  }

  // Handle empty response (for DELETE, etc.)
  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}
