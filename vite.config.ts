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
      // non-minified sources, bypassing the "exports" of package.json
      pmtiles: new URL("node_modules/pmtiles/src/index.ts", import.meta.url).pathname,
    },
  },
});
