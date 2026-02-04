import { resolve } from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  resolve: {
    alias: {
      "sdc-smart-web-messaging": resolve(__dirname, "vendor/sdc-smart-web-messaging/src/index.ts"),
    },
  },
  plugins: [
    dts({
      rollupTypes: true,
      beforeWriteFile: (filePath, content) => {
        if (filePath.endsWith("dist/index.d.ts") && content.trim() === "export {}") {
          return { filePath, content: "export * from './src/index';\n" };
        }
      },
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "SdcSmartWebMessagingReact",
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      external: ["react"],
    },
  },
});
