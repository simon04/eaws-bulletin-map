import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      pmtiles: "pmtiles/src/index.ts",
    },
  },
});
