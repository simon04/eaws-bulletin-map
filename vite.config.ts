import { defineConfig } from "vite-plus";

export default defineConfig({
  build: {
    rolldownOptions: {
      input: {
        main: "index.html",
        "new-ava-times": "new-ava-times.html",
      },
    },
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
});
