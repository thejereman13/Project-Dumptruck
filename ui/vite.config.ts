import { defineConfig, splitVendorChunkPlugin } from 'vite';
import solidPlugin from "vite-plugin-solid";
import checker from "vite-plugin-checker";
import basicssl from "@vitejs/plugin-basic-ssl";
import viteCompression from "vite-plugin-compression";

export default defineConfig({
  plugins: [solidPlugin(), checker({ typescript: true }), basicssl(), splitVendorChunkPlugin(), viteCompression()],
  server: {
    port: 8080,
    https: true,
    proxy: {
        "/api": {
            target: "https://localhost:8000",
            secure: false
        },
        "/api/ws": {
            target: "wss://localhost:8000",
            secure: false,
            ws: true,
        }
    }
  },
  build: {
    target: 'esnext',
    outDir: 'build',
  },
});
