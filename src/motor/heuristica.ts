// h(A) = max(ceil(R / Cmax), L), sección 5 de docs/proyecto.md.
import { compilar, necesarias } from "./problema.ts";
import type { Problema } from "./tipos.ts";

export interface DetalleHeuristica {
  h: number;
  R: number;
  L: number;
  /** Cadena de prerrequisitos más larga entre las necesarias, en orden. */
  cadena: number[];
}

export function detalleH(pb: Problema, A: number): DetalleHeuristica {
  const c = compilar(pb.materias);
  const need = necesarias(pb, A);
  if (need === 0) return { h: 0, R: 0, L: 0, cadena: [] };
  let R = 0;
  const largo = new Array<number>(c.n).fill(0);
  const previo = new Array<number>(c.n).fill(-1);
  let L = 0;
  let fin = -1;
  for (const x of c.topo) {
    if (!((need >>> x) & 1)) continue;
    R += c.cr[x];
    let mejor = 0;
    const antes = (c.pre[x] & need) >>> 0;
    for (let q = 0; q < c.n; q++) {
      if ((antes >>> q) & 1 && largo[q] > mejor) {
        mejor = largo[q];
        previo[x] = q;
      }
    }
    largo[x] = mejor + 1;
    if (largo[x] > L) {
      L = largo[x];
      fin = x;
    }
  }
  const cadena: number[] = [];
  for (let x = fin; x >= 0; x = previo[x]) cadena.unshift(x);
  return { h: Math.max(Math.ceil(R / pb.Cmax), L), R, L, cadena };
}

export function h(pb: Problema, A: number): number {
  return detalleH(pb, A).h;
}
