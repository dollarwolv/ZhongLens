import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "ZhongLens",
    permissions: ["storage", "offscreen"],
    version: "0.0.1",
    key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA5QX0bnk8nrI56AcRAVQhbDH53JESy9vamUSsEPcLhoVOwuKbyy2PUUDU6SYWB17e4WK6rB6zvs97LuuaG1sAWSak+DpMR1hOINjHe+bU7zS0ScYJXFuktC4iO4H5zIvhQJyokXo9/o/soAHBakdb7zC4TynO1CuVRzaI9NB671U7pTSHsDikXqheQE8xoCRQ4b2Gjd9s4ufNQOo7yh9gal+W+HEXYEDfH6ovj1egYMncZVIMc2mQ0fSg5EmkTY5W/NEEf5RDL6x4+9UpAr4kwu/J+RZiBYEYoS22jBo7LvsdTmDNuR4axwWqqO9Dq0eeTfLATYjOiWWk8mWgdi/h2QIDAQAB",
    host_permissions: ["<all_urls>"],
    content_security_policy: {
      extension_pages:
        "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'",
    },
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
