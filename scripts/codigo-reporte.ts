// Copia las funciones del motor que documenta el reporte a reporte/codigo/, una por archivo.
// Uso: npm run codigo-reporte (volver a correrlo si cambia el motor).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const PIEZAS: [archivo: string, nombre: string][] = [
  ["problema.ts", "necesarias"],
  ["problema.ts", "costoCuatrimestre"],
  ["validacion.ts", "validar"],
  ["validacion.ts", "validarNecesarias"],
  ["heuristica.ts", "detalleH"],
  ["sucesores.ts", "disponibles"],
  ["sucesores.ts", "elegibles"],
  ["sucesores.ts", "sucesores"],
  ["monticulo.ts", "Monticulo"],
  ["wastar.ts", "antes"],
  ["wastar.ts", "wastar"],
  ["wastar.ts", "reconstruir"],
  ["wastar.ts", "aEstrella"],
  ["wastar.ts", "costoUniforme"],
  ["anytime.ts", "anytime"],
];

/** Devuelve la declaración `nombre` con su comentario previo, cortando cuando se cierran sus llaves. */
function extraer(texto: string, nombre: string): string {
  const lineas = texto.split("\n");
  const inicio = lineas.findIndex((l) =>
    new RegExp(`^(export )?(function|class|const) ${nombre}\\b`).test(l),
  );
  if (inicio < 0) throw new Error(`No se encontró ${nombre}`);
  let desde = inicio;
  while (desde > 0 && /^(\s*\/\/|\s*\/\*\*|\s*\*)/.test(lineas[desde - 1])) desde--;
  let nivel = 0;
  let abierto = false;
  for (let i = inicio; i < lineas.length; i++) {
    for (const ch of lineas[i]) {
      if ("({[".includes(ch)) {
        nivel++;
        abierto = true;
      } else if (")}]".includes(ch)) nivel--;
    }
    if (abierto && nivel === 0 && /[};]\s*$/.test(lineas[i])) {
      return lineas.slice(desde, i + 1).join("\n") + "\n";
    }
  }
  throw new Error(`No se cerró ${nombre}`);
}

mkdirSync("reporte/codigo", { recursive: true });
for (const [archivo, nombre] of PIEZAS) {
  const texto = readFileSync(`src/motor/${archivo}`, "utf-8");
  writeFileSync(`reporte/codigo/${nombre}.ts`, extraer(texto, nombre));
  console.log(`  reporte/codigo/${nombre}.ts`);
}
