import { createReadStream } from "node:fs";
import { access, stat } from "node:fs/promises";
import { constants } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", process.argv[2] || "src");
const port = Number(process.env.PORT || 4173);
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  const requested = resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`);

  if (requested !== root && !requested.startsWith(`${root}${sep}`)) {
    response.writeHead(403).end("Acesso negado");
    return;
  }

  let file = requested;
  try {
    await access(file, constants.R_OK);
    if ((await stat(file)).isDirectory()) file = resolve(file, "index.html");
  } catch {
    file = resolve(root, "index.html");
  }

  response.writeHead(200, {
    "Content-Type": types[extname(file)] || "application/octet-stream",
    "Cache-Control": "no-cache"
  });
  createReadStream(file).pipe(response);
}).listen(port, "0.0.0.0", () => {
  console.log(`Ki Pastel disponível em http://localhost:${port}`);
});
