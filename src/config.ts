const envValue = (import.meta.env.VITE_API_URL || "").trim();
const normalizedEnv = envValue.replace(/\/$/, "");
const FALLBACK_BASE_URL = "http://localhost:8000";

export const API_BASE_URL = normalizedEnv || FALLBACK_BASE_URL;
export const BASE_URL = API_BASE_URL;

export const apiUrl = (path = ""): string => {
  if (!path) return API_BASE_URL;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};