// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// Never set ssr.external or resolve.external: the Worker has no runtime module resolution, so
// the build fails. Never add compression (compressPublicAssets, vite-plugin-compression):
// hosting already compresses at the edge.
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

// Server-only local credentials. Never add these keys to VITE_* or define.
const localParkingEnv = loadEnv("development", process.cwd(), ["CULTURE_", "SEOUL_OPEN_DATA_API_KEY"]);
for (const name of ["CULTURE_API_SERVICE_KEY", "CULTURE_PARKING_FLOW_API_SERVICE_KEY", "SEOUL_OPEN_DATA_API_KEY"]) {
  if (!process.env[name] && localParkingEnv[name]) process.env[name] = localParkingEnv[name];
}

export default defineConfig({
  vite: {
    build: {
      rolldownOptions: {
        output: {
          assetFileNames: (assetInfo) =>
            assetInfo.names.some((name) => name.endsWith(".css"))
              ? "app.css"
              : "assets/[name]-[hash][extname]",
        },
      },
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
