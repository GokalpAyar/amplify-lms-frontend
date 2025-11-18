// src/config.ts

// Get env variable safely and normalize (remove trailing slash)
const envValue = (import.meta.env.VITE_API_URL || "").trim();
const normalizedEnv = envValue.replace(/\/$/, "");

// Fallback backend URL (Render)
const FALLBACK_BASE_URL = "https://amplify-lms-backend.onrender.com";

// Final API base URL (env → fallback)
export const API_BASE_URL = normalizedEnv || FALLBACK_BASE_URL;

// Alias for older code
export const BASE_URL = API_BASE_URL;

// Utility for building full API URLs
export const apiUrl = (path = ""): string => {
  if (!path) return API_BASE_URL;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

console.log("🔗 API Base URL:", API_BASE_URL);
