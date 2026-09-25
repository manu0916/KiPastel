import { access, cp, mkdir, rm } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "src");
const output = resolve(root, "dist");

const requiredFiles = [
  "index.html",
  "styles.css",
  "app.js",
  "favicon.svg",
  "assets/hero-pastel.webp",
  "assets/pasteis-salgados.webp",
  "assets/pasteis-doces.webp"
];

await Promise.all(
  requiredFiles.map((file) => access(resolve(source, file), constants.R_OK))
);

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(source, output, { recursive: true });

console.log(`Build concluído: ${output}`);
