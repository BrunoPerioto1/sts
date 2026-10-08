import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { readFileSync } from "fs";

// Versão do package.json, mostrada no fim do Perfil ("v1.4.0").
const { version } = JSON.parse(readFileSync(path.resolve(__dirname, "package.json"), "utf8"));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Com API_PROXY_TARGET, o dev chama /api e o Vite repassa pro backend: a API
  // no ar só libera CORS pro domínio de produção, não pro localhost.
  const { API_PROXY_TARGET } = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      host: "::",
      port: 8080,
      proxy: API_PROXY_TARGET
        ? {
            "/api": {
              target: API_PROXY_TARGET,
              changeOrigin: true,
              rewrite: (p) => p.replace(/^\/api/, ""),
            },
          }
        : undefined,
    },
    plugins: [react()],
    define: {
      __APP_VERSION__: JSON.stringify(version),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
