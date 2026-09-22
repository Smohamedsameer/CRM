import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In development, /api/* is proxied to the Spring Boot backend, so there are no CORS
// problems and no API URL to configure. In production, set VITE_API_BASE_URL (see .env.example).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:8080", changeOrigin: true },
    },
  },
});
