import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  root: resolve(__dirname, "harness"),
  resolve: {
    alias: {
      "sdc-smart-web-messaging-react": resolve(__dirname, "../src/index.ts"),
      "sdc-swm-protocol/src": resolve(
        __dirname,
        "../vendor/sdc-smart-web-messaging/src/index.ts",
      ),
    },
  },
  server: {
    fs: {
      allow: [resolve(__dirname, "..")],
    },
  },
});
