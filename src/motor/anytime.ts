// Anytime A*: pasadas de Weighted A* con pesos decrecientes, sección 3.2 de docs/decisiones.md.
import { h } from "./heuristica.ts";
import { validar } from "./validacion.ts";
import { wastar } from "./wastar.ts";
import { MAX_EXPANSIONES, PESOS_POR_OMISION } from "./tipos.ts";
import type {
  Cuatrimestre,
  EventoMotor,
  Problema,
  ResultadoAnytime,
  ResumenPasada,
} from "./tipos.ts";

export interface OpcionesAnytime {
  /** Tiempo máximo total en ms; Infinity = sin límite. */
  tiempoMaxMs?: number;
  maxExpansiones?: number;
}

export const TIEMPO_POR_OMISION_MS = 60_000;

export function anytime(
  pb: Problema,
  pesos: number[] = PESOS_POR_OMISION,
  alEvento: (e: EventoMotor) => void = () => {},
  opciones: OpcionesAnytime = {},
): ResultadoAnytime {
  const t0 = performance.now();
  const errores = validar(pb);
  if (errores.length > 0) {
    alEvento({ tipo: "error", errores });
    return {
      costo: null,
      plan: null,
      pasadas: [],
      optimo: false,
      garantia: null,
      tiempoMs: 0,
      tiempoPrimerPlanMs: null,
      errores,
    };
  }
  const limite = {
    maxExpansiones: opciones.maxExpansiones ?? MAX_EXPANSIONES,
    fechaLimite: t0 + (opciones.tiempoMaxMs ?? TIEMPO_POR_OMISION_MS),
  };
  let mejor = Infinity;
  let plan: Cuatrimestre[] | null = null;
  let garantia: number | null = null;
  let optimo = false;
  let tiempoPrimerPlanMs: number | null = null;
  const pasadas: ResumenPasada[] = [];

  for (let i = 0; i < pesos.length; i++) {
    const H = pesos[i];
    alEvento({ tipo: "pasada-inicio", H, indice: i });
    const r = wastar(pb, H, mejor, limite);
    if (r.costo !== null && r.costo < mejor) {
      mejor = r.costo;
      plan = r.plan;
      garantia = H;
      const ahora = performance.now() - t0;
      tiempoPrimerPlanMs ??= ahora;
      alEvento({ tipo: "plan", H, costo: r.costo, plan: r.plan!, tiempoMs: ahora });
    }
    const pasada: ResumenPasada = {
      H,
      costo: r.costo,
      expansiones: r.expansiones,
      generados: r.generados,
      memoria: r.memoria,
      tiempoMs: r.tiempoMs,
      fin: r.fin,
    };
    pasadas.push(pasada);
    alEvento({ tipo: "pasada-fin", indice: i, pasada, mejor: mejor === Infinity ? null : mejor });
    // Una pasada con H = 1 que termina (encuentra la meta o agota la frontera) demuestra el óptimo.
    if (H === 1 && (r.fin === "meta" || r.fin === "agotada")) {
      optimo = true;
      garantia = 1;
    }
    if (r.fin === "tiempo") break;
  }

  const costo = mejor === Infinity ? null : mejor;
  const tiempoMs = performance.now() - t0;
  alEvento({
    tipo: "fin",
    costo,
    plan,
    optimo,
    cotaInferior: optimo && costo !== null ? costo : h(pb, pb.inicio.A),
    garantia,
    pasadas,
    tiempoMs,
  });
  return { costo, plan, pasadas, optimo, garantia, tiempoMs, tiempoPrimerPlanMs, errores: [] };
}
