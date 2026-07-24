import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import path from "node:path";


const pkgPath = path.resolve(process.cwd(), "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

function createCustomManifest(): Plugin {
  return {
    name: "custom-manifest",
    async writeBundle(options) {
      const outDir = options.dir || "dist";

      const possibleManifestPaths = [
        path.resolve(outDir, "manifest.json"),
        path.resolve(outDir, ".vite/manifest.json"),
      ];

      const originalManifestPath = possibleManifestPaths.find((p) =>
        fs.existsSync(p),
      );

      if (!originalManifestPath) return;

      const viteManifest = JSON.parse(
        fs.readFileSync(originalManifestPath, "utf-8"),
      );

      const entryKey = Object.keys(viteManifest).find(
        (key) => viteManifest[key].isEntry,
      );

      const entryItem = entryKey ? viteManifest[entryKey] : null;

      const entryFile = entryItem?.file || "";
      const styles = entryItem?.css || [];

      const getAllFiles = (dirPath: string, arrayOfFiles: string[] = []) => {
        const files = fs.readdirSync(dirPath);

        files.forEach((file) => {
          const fullPath = path.join(dirPath, file);
          if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
          } else {
            // Get path relative to outDir
            const relativePath = path
              .relative(outDir, fullPath)
              .replace(/\\/g, "/"); // Normalize Windows path slashes

            // Exclude manifest file itself from files array
            if (!relativePath.endsWith("manifest.json")) {
              arrayOfFiles.push(relativePath);
            }
          }
        });

        return arrayOfFiles;
      };

      const allFiles = getAllFiles(outDir);

      const customManifest = {
        schemaVersion: "1",
        framework: "react",
        application: {
          id: pkg.name || "mini-revenue-app",
          name: pkg.name || "revenue-app",
          version: pkg.version || "1.2.3",
          type: "mini-app",
        },
        platform: {
          runtime: "^1.0.0",
          sdk: "^2.0.0",
        },
        bundle: {
          entry: entryFile,
          styles: styles,
          files: allFiles,
        },
      };

      const finalManifestPath = path.resolve(outDir, "manifest.json");

      if (
        originalManifestPath.includes(".vite") &&
        fs.existsSync(originalManifestPath)
      ) {
        fs.unlinkSync(originalManifestPath);
      }

      fs.writeFileSync(
        finalManifestPath,
        JSON.stringify(customManifest, null, 2),
      );
    },
  };
}

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: "automatic",
    }),
    tailwindcss(),
    createCustomManifest(),
  ],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    target: "chrome89",
    manifest: "manifest.json",
    outDir: "dist",
    cssCodeSplit: true,
    lib: {
      entry: "./src/main.tsx",
      name: "RevenueMiniApp",
      formats: ["es"],
      fileName: () => "[name][hash].js",
    },
    rollupOptions: {
      output: {
        codeSplitting: false,
        format: "es",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
  server: {
    host: "0.0.0.0",
    cors: true,
    headers: { "Access-Control-Allow-Origin": "*" },
  },
});
