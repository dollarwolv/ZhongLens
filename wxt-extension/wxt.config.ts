import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "ZhongLens",
    permissions: ["tabs", "activeTab", "storage", "offscreen"],
    web_accessible_resources: [
      {
        resources: [
          "tesseract/worker.min.js",
          "tesseract/core/*",
          // if you bundle traineddata:
          // "tesseract/lang/*",
        ],
        matches: ["<all_urls>"],
      },
    ],
  },
  vite: () => ({
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./"), // or "./src" if using src directory
      },
    },
  }),
});
