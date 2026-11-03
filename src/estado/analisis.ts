// Funciones de las pantallas 7, 8 y 9: variantes de sensibilidad, alternativas de un cuatrimestre y metas sin una materia.
import {
  compilar,
  costoCuatrimestre,
  creditosDe,
  estadosDelPlan,
  indices,
} from "../motor/problema.ts";
import { elegibles, sucesores } from "../motor/sucesores.ts";
import type { Cuatrimestre, Materia, Periodo, Problema } from "../motor/tipos.ts";
import type { Perfil } from "../motor/problema.ts";

export interface Variante {
  etiqueta: string;
  parametros: Perfil;
  base?: boolean;
}

export type ParametroVariable = "beta" | "Cnorm" | "Cmax" | "K";

export const NOMBRE_PARAMETRO: Record<ParametroVariable, string> = {
  beta: "Penalización β",
  Cnorm: "Carga normal",
  Cmax: "Carga máxima",
  K: "Materias por cuatrimestre K",
};

export function variante(base: Perfil, p: ParametroVariable, valor: number): Variante {
  return { etiqueta: `${NOMBRE_PARAMETRO[p]} = ${valor}`, parametros: { ...base, [p]: valor } };
}

/** Filas de la tabla de sensibilidad (pantalla 8): β 0.05, 0.2 y 0.5; Cnorm ±3; Cmax 30, 33 y 40. */
export function variantesSensibilidad(base: Perfil): Variante[] {
  const filas: Variante[] = [
    {
      etiqueta: `Base · β ${base.beta} · normal ${base.Cnorm} · máx. ${base.Cmax}`,
      parametros: { ...base },
      base: true,
    },
  ];
  for (const b of [0.05, 0.2, 0.5]) if (b !== base.beta) filas.push(variante(base, "beta", b));
  for (const c of [base.Cnorm - 3, base.Cnorm + 3]) filas.push(variante(base, "Cnorm", c));
  for (const c of [30, 33, 40]) if (c !== base.Cmax) filas.push(variante(base, "Cmax", c));
  return filas;
}

export interface Alternativa {
  etiqueta: string;
  S: number;
  materias: string[];
  creditos: number;
  costo: number;
  elegida: boolean;
  /** Estado que deja la elección, para calcular el óptimo desde ahí. */
  despues: { A: number; p: Periodo };
}

/**
 * Alternativas del cuatrimestre n (desde 1): la elegida, los otros sucesores (hasta `max`),
 * «Ninguna» y «Todas» si caben en Cmax y K.
 */
export function alternativas(
  pb: Problema,
  plan: Cuatrimestre[],
  n: number,
  max = 40,
): Alternativa[] {
  const c = compilar(pb.materias);
  const { A, p } = estadosDelPlan(pb, plan)[n - 1];
  const q = ((p + 1) % 3) as Periodo;
  const elegido = plan[n - 1];
  const nombre = (S: number) =>
    S === 0
      ? "Ninguna"
      : indices(S)
          .map((i) => pb.materias[i].clave)
          .join(", ");
  const crear = (S: number, etiqueta?: string): Alternativa => {
    const cr = creditosDe(c, S);
    return {
      etiqueta: etiqueta ?? nombre(S),
      S,
      materias: indices(S).map((i) => pb.materias[i].clave),
      creditos: cr,
      costo: costoCuatrimestre(pb, cr),
      elegida: S === elegido.S,
      despues: { A: (A | S) >>> 0, p: q },
    };
  };
  const filas: Alternativa[] = [crear(elegido.S)];
  for (const s of sucesores(pb, A, p)) {
    if (filas.length > max) break;
    if (s.S !== elegido.S && s.S !== 0) filas.push(crear(s.S));
  }
  if (elegido.S !== 0) filas.push(crear(0));
  const todas = elegibles(pb, A, p);
  const indTodas = indices(todas);
  const hayExclusiva = indTodas.some((i) => (c.exclusivas >>> i) & 1);
  if (
    todas !== 0 &&
    !filas.some((f) => f.S === todas) &&
    creditosDe(c, todas) <= pb.Cmax &&
    indTodas.length <= pb.K &&
    !(hayExclusiva && indTodas.length > 1)
  ) {
    filas.push(crear(todas, indTodas.length === 1 ? undefined : `Todas (${indTodas.length})`));
  }
  return filas;
}

/** Quita una materia de G junto con las materias de G que la necesitan (directa o indirectamente). */
export function metaSin(materias: Materia[], meta: string[], clave: string): string[] {
  const quitar = new Set([clave]);
  let cambio = true;
  while (cambio) {
    cambio = false;
    for (const m of materias) {
      if (!quitar.has(m.clave) && m.prerrequisitos.some((p) => quitar.has(p))) {
        quitar.add(m.clave);
        cambio = true;
      }
    }
  }
  return meta.filter((k) => !quitar.has(k));
}

/** Materias que tienen a `clave` como prerrequisito directo. */
export function habilita(materias: Materia[], clave: string): Materia[] {
  return materias.filter((m) => m.prerrequisitos.includes(clave));
}
