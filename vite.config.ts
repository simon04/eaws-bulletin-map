import { defineConfig } from "vite-plus";

export default defineConfig({
  build: {
    license: { fileName: "assets/license.txt" },
  },
  staged: {
    "*": "vp check --fix",
  },
  fmt: {},
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
  resolve: {
    alias: {
      pmtiles: "pmtiles/src/index.ts",
    },
  },
});
