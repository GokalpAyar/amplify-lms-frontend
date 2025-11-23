// src/config.ts

// Backend API base URL
const apiEnvValue = (import.meta.env.VITE_API_URL || "").trim();
const normalizedApiEnv = apiEnvValue.replace(/\/$/, "");
const FALLBACK_BASE_URL = "https://amplify-lms-backend.onrender.com";
export const API_BASE_URL = normalizedApiEnv || FALLBACK_BASE_URL;
export const BASE_URL = API_BASE_URL;

// Frontend base URL (used for shareable links)
const frontendEnvValue = (import.meta.env.VITE_FRONTEND_URL || "").trim();
const normalizedFrontendEnv = frontendEnvValue.replace(/\/$/, "");
const FALLBACK_FRONTEND_URL = "https://amplify-lms-frontend.vercel.app";
export const FRONTEND_BASE_URL = normalizedFrontendEnv || FALLBACK_FRONTEND_URL;
export const FRONTEND_ASSIGNMENT_URL = `${FRONTEND_BASE_URL}/student`;

// Utility for building full API URLs
export const apiUrl = (path = ""): string => {
  if (!path) return API_BASE_URL;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

console.log("🔗 API Base URL:", API_BASE_URL);
