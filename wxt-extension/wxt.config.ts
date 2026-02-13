import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "ZhongLens",
    permissions: ["tabs", "activeTab"],
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
