// Corre un método de búsqueda completo y resume el resultado (Worker, análisis y experimento).
import { anytime } from "./anytime.ts";
import { validar } from "./validacion.ts";
import { aEstrella, costoUniforme, wastar } from "./wastar.ts";
import { MAX_EXPANSIONES } from "./tipos.ts";
import type { FinPasada, Problema } from "./tipos.ts";

export type Metodo = "anytime" | "astar" | "wastar2" | "uniforme";

export const NOMBRE_METODO: Record<Metodo, string> = {
  anytime: "Anytime A*",
  astar: "A*",
  wastar2: "Weighted A* (H = 2)",
  uniforme: "Costo Uniforme",
};

export interface ResultadoMetodo {
  costo: number | null;
  cuatrimestres: number | null;
  sobrecarga: number | null;
  expansiones: number;
  memoria: number;
  tiempoMs: number;
  tiempoPrimerPlanMs: number | null;
  fin: FinPasada | "error";
}

export function correrMetodo(
  pb: Problema,
  metodo: Metodo,
  tiempoMaxMs: number | null = 60_000,
): ResultadoMetodo {
  if (validar(pb).length > 0) {
    return {
      costo: null,
      cuatrimestres: null,
      sobrecarga: null,
      expansiones: 0,
      memoria: 0,
      tiempoMs: 0,
      tiempoPrimerPlanMs: null,
      fin: "error",
    };
  }
  const t0 = performance.now();
  const limite = { maxExpansiones: MAX_EXPANSIONES, fechaLimite: t0 + (tiempoMaxMs ?? Infinity) };
  if (metodo === "anytime") {
    const r = anytime(pb, undefined, undefined, { tiempoMaxMs: tiempoMaxMs ?? Infinity });
    const ultima = r.pasadas.at(-1);
    return {
      costo: r.costo,
      cuatrimestres: r.plan?.length ?? null,
      sobrecarga: r.plan
        ? r.plan.reduce((s, q) => s + Math.max(0, q.creditos - pb.Cnorm), 0)
        : null,
      expansiones: r.pasadas.reduce((s, p) => s + p.expansiones, 0),
      memoria: Math.max(0, ...r.pasadas.map((p) => p.memoria)),
      tiempoMs: r.tiempoMs,
      tiempoPrimerPlanMs: r.tiempoPrimerPlanMs,
      fin: r.optimo ? "meta" : (ultima?.fin ?? "agotada"),
    };
  }
  const r =
    metodo === "astar"
      ? aEstrella(pb, limite)
      : metodo === "uniforme"
        ? costoUniforme(pb, limite)
        : wastar(pb, 2, Infinity, limite);
  return {
    costo: r.costo,
    cuatrimestres: r.plan?.length ?? null,
    sobrecarga: r.plan ? r.plan.reduce((s, q) => s + Math.max(0, q.creditos - pb.Cnorm), 0) : null,
    expansiones: r.expansiones,
    memoria: r.memoria,
    tiempoMs: r.tiempoMs,
    tiempoPrimerPlanMs: r.costo !== null ? r.tiempoMs : null,
    fin: r.fin,
  };
}
