import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/",
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    forwardConsole: true,
  },

  resolve: {
    tsconfigPaths: true,
  },

  build: {
    rollupOptions: {
      input: "index.html",
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return id
              .toString()
              .split("node_modules/")[1]
              .split("/")[0]
              .toString();
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
