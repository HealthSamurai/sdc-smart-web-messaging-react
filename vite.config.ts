import { resolve } from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  resolve: {
    alias: {
      "sdc-swm-protocol/src": resolve(__dirname, "vendor/sdc-smart-web-messaging/src/index.ts"),
    },
  },
  plugins: [
    dts({
      rollupTypes: true,
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "SdcSmartWebMessagingReact",
      formats: ["es"],
      fileName: "index.js",
    },
    rollupOptions: {
      external: ["react"],
    },
  },
});
