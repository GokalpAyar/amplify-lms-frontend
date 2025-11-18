import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

const DEV_PROXY_TARGET =
  process.env.VITE_DEV_PROXY_TARGET ?? "http://localhost:8000";
const DEV_PROXY_WS_TARGET = DEV_PROXY_TARGET.replace(/^http/i, "ws");

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // so you can do import x from "@/components/..."
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      // dev proxy to FastAPI
      "/api": {
        target: DEV_PROXY_TARGET,
        changeOrigin: true,
      },
      "/ws": {
        target: DEV_PROXY_WS_TARGET,
        ws: true,
      },
    },
  },
});
