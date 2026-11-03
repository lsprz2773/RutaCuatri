// Generación de sucesores, sección 3.1 de docs/decisiones.md (reglas D06 a D09).
import { compilar, costoCuatrimestre, necesarias, siguientePeriodo } from "./problema.ts";
import type { Periodo, Problema, Sucesor } from "./tipos.ts";

/** Materias que se pueden inscribir en p: no aprobadas, ofrecidas en p y con prerrequisitos en A. */
export function disponibles(pb: Problema, A: number, p: Periodo): number {
  const c = compilar(pb.materias);
  let el = 0;
  for (let i = 0; i < c.n; i++) {
    if ((A >>> i) & 1) continue;
    if (!((c.oferta[p] >>> i) & 1)) continue;
    if ((c.pre[i] & A) >>> 0 !== c.pre[i]) continue;
    el |= 1 << i;
  }
  return el >>> 0;
}

/** Elegibles de la regla 1: disponibles que además necesita la meta. */
export function elegibles(pb: Problema, A: number, p: Periodo): number {
  return (disponibles(pb, A, p) & necesarias(pb, A)) >>> 0;
}

/**
 * Sucesores de (A, p). Con reglas = false se omiten D06 a D08: entran todas las disponibles,
 * no hay poda por dominancia y el cuatrimestre vacío siempre se genera.
 */
export function sucesores(pb: Problema, A: number, p: Periodo, reglas = true): Sucesor[] {
  const c = compilar(pb.materias);
  const el = reglas ? elegibles(pb, A, p) : disponibles(pb, A, p);
  const q = siguientePeriodo(p);
  const out: Sucesor[] = [];
  const normales: number[] = [];
  for (let i = 0; i < c.n; i++) {
    if (!((el >>> i) & 1)) continue;
    if ((c.exclusivas >>> i) & 1) {
      if (c.cr[i] <= pb.Cmax) {
        const S = (1 << i) >>> 0;
        out.push({
          A: (A | S) >>> 0,
          p: q,
          S,
          creditos: c.cr[i],
          costo: costoCuatrimestre(pb, c.cr[i]),
        });
      }
    } else normales.push(i);
  }

  const elegido: number[] = [];
  const emitir = (S: number, cr: number) => {
    if (reglas && cr <= pb.Cnorm && elegido.length < pb.K) {
      for (const x of normales) {
        if (!((S >>> x) & 1) && cr + c.cr[x] <= pb.Cnorm) return; // dominado por S ∪ {x}
      }
    }
    out.push({ A: (A | S) >>> 0, p: q, S, creditos: cr, costo: costoCuatrimestre(pb, cr) });
  };
  // Combinaciones de tamaño k en orden lexicográfico; se corta en cuanto se pasa de Cmax.
  const combinar = (k: number, desde: number, S: number, cr: number) => {
    if (elegido.length === k) {
      emitir(S, cr);
      return;
    }
    for (let j = desde; j <= normales.length - (k - elegido.length); j++) {
      const x = normales[j];
      const nc = cr + c.cr[x];
      if (nc > pb.Cmax) continue;
      elegido.push(x);
      combinar(k, j + 1, (S | (1 << x)) >>> 0, nc);
      elegido.pop();
    }
  };
  const maxK = Math.min(normales.length, pb.K);
  for (let k = 1; k <= maxK; k++) combinar(k, 0, 0, 0);

  if (out.length === 0 || !reglas) out.push({ A, p: q, S: 0, creditos: 0, costo: 1 });
  return out;
}
