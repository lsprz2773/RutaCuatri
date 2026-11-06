// Servidor estático mínimo para la exportación de out/ (lo usa Playwright). Uso: node scripts/servir.ts [puerto]
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const RAIZ = join(process.cwd(), "out");
const PUERTO = Number(process.argv[2] ?? 3100);
const TIPOS: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".png": "image/png",
};

createServer((pedido, respuesta) => {
  const ruta = decodeURIComponent(new URL(pedido.url ?? "/", "http://x").pathname);
  let archivo = normalize(join(RAIZ, ruta));
  if (!archivo.startsWith(RAIZ)) {
    respuesta.writeHead(403).end();
    return;
  }
  if (existsSync(archivo) && statSync(archivo).isDirectory()) archivo = join(archivo, "index.html");
  if (!existsSync(archivo)) {
    respuesta.writeHead(404, { "Content-Type": TIPOS[".html"] });
    createReadStream(join(RAIZ, "404.html")).pipe(respuesta);
    return;
  }
  respuesta.writeHead(200, {
    "Content-Type": TIPOS[extname(archivo)] ?? "application/octet-stream",
  });
  createReadStream(archivo).pipe(respuesta);
}).listen(PUERTO, () => console.log(`Sirviendo out/ en http://localhost:${PUERTO}`));
