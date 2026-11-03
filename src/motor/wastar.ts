// Una pasada de Weighted A* con f = g + H·h, sección 3.2 de docs/decisiones.md.
import { h as heuristica } from "./heuristica.ts";
import { Monticulo } from "./monticulo.ts";
import { clavesDe, contiene, creditosDe, compilar } from "./problema.ts";
import { sucesores } from "./sucesores.ts";
import { MAX_EXPANSIONES } from "./tipos.ts";
import type {
  Cuatrimestre,
  Limite,
  OpcionesBusqueda,
  Periodo,
  Problema,
  Resultado,
} from "./tipos.ts";

const EPS = 1e-9;

interface Nodo {
  f: number;
  /** Créditos aprobados en el estado, para el desempate. */
  cred: number;
  g: number;
  orden: number;
  A: number;
  p: Periodo;
}

interface Padre {
  clave: number;
  S: number;
  creditos: number;
  costo: number;
  p: Periodo;
}

// Desempate: menor f; luego más créditos aprobados; luego menor g; luego orden de entrada.
const antes = (a: Nodo, b: Nodo): boolean =>
  a.f !== b.f
    ? a.f < b.f
    : a.cred !== b.cred
      ? a.cred > b.cred
      : a.g !== b.g
        ? a.g < b.g
        : a.orden < b.orden;

export const clave = (A: number, p: Periodo): number => A * 3 + p;

export function sinLimite(): Limite {
  return { maxExpansiones: MAX_EXPANSIONES, fechaLimite: Infinity };
}

export function wastar(
  pb: Problema,
  H: number,
  cota = Infinity,
  limite: Limite = sinLimite(),
  opciones: OpcionesBusqueda = {},
): Resultado {
  const t0 = performance.now();
  const reglas = opciones.reglas ?? true;
  const conH = opciones.heuristica ?? true;
  const hv = (A: number) => (conH ? heuristica(pb, A) : 0);
  const c = compilar(pb.materias);

  const { A: A0, p: p0 } = pb.inicio;
  const frontera = new Monticulo<Nodo>(antes);
  const mejorG = new Map<number, number>();
  const padres = new Map<number, Padre | null>();
  const cerrados = new Set<number>();
  let orden = 0;
  let expansiones = 0;
  let generados = 0;
  let memoria = 1;

  frontera.meter({ f: H * hv(A0), cred: creditosDe(c, A0), g: 0, orden: 0, A: A0, p: p0 });
  mejorG.set(clave(A0, p0), 0);
  padres.set(clave(A0, p0), null);

  const terminar = (
    fin: Resultado["fin"],
    costo: number | null,
    plan: Cuatrimestre[] | null,
  ): Resultado => ({
    costo,
    plan,
    expansiones,
    generados,
    memoria,
    fin,
    tiempoMs: performance.now() - t0,
  });

  for (;;) {
    const nodo = frontera.sacar();
    if (!nodo) return terminar("agotada", null, null);
    const k = clave(nodo.A, nodo.p);
    if (cerrados.has(k) || nodo.g > mejorG.get(k)! + 1e-12) continue;
    if (contiene(nodo.A, pb.meta)) return terminar("meta", nodo.g, reconstruir(pb, padres, k));
    if (expansiones >= limite.maxExpansiones) return terminar("limite", null, null);
    if ((expansiones & 63) === 0 && performance.now() >= limite.fechaLimite)
      return terminar("tiempo", null, null);
    cerrados.add(k);
    expansiones++;

    for (const s of sucesores(pb, nodo.A, nodo.p, reglas)) {
      const t = clave(s.A, s.p);
      const ng = nodo.g + s.costo;
      const ht = hv(s.A);
      if (ng + ht >= cota - EPS || cerrados.has(t)) continue;
      const previo = mejorG.get(t);
      if (previo === undefined || ng < previo - 1e-12) {
        mejorG.set(t, ng);
        padres.set(t, { clave: k, S: s.S, creditos: s.creditos, costo: s.costo, p: nodo.p });
        orden++;
        generados++;
        frontera.meter({
          f: ng + H * ht,
          cred: nodo.cred + s.creditos,
          g: ng,
          orden,
          A: s.A,
          p: s.p,
        });
      }
    }
    memoria = Math.max(memoria, mejorG.size);
  }
}

function reconstruir(pb: Problema, padres: Map<number, Padre | null>, k: number): Cuatrimestre[] {
  const plan: Cuatrimestre[] = [];
  for (let x = padres.get(k); x; x = padres.get(x.clave)) {
    plan.unshift({
      periodo: x.p,
      S: x.S,
      materias: clavesDe(pb.materias, x.S),
      creditos: x.creditos,
      costo: x.costo,
    });
  }
  return plan;
}

/** A* (una pasada con H = 1). */
export function aEstrella(
  pb: Problema,
  limite?: Limite,
  opciones: OpcionesBusqueda = {},
): Resultado {
  return wastar(pb, 1, Infinity, limite, opciones);
}

/** Costo Uniforme: h = 0. */
export function costoUniforme(pb: Problema, limite?: Limite): Resultado {
  return wastar(pb, 1, Infinity, limite, { heuristica: false });
}
