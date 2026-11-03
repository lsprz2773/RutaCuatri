// Verificador de planes independiente del motor: trabaja con claves y no usa máscaras de bits.
import type { Materia } from "../src/motor/tipos.ts";

export interface CuatrimestrePlano {
  periodo: "Ene" | "May" | "Sep";
  materias: string[];
}

export interface Parametros {
  Cnorm: number;
  Cmax: number;
  beta: number;
  K: number;
}

const ORDEN = ["Ene", "May", "Sep"] as const;

/** Devuelve el costo recalculado o lanza un error con la regla que no se cumple. */
export function verificarPlan(
  materias: Materia[],
  par: Parametros,
  aprobadas: string[],
  periodoInicio: "Ene" | "May" | "Sep",
  meta: string[],
  plan: CuatrimestrePlano[],
): number {
  const porClave = new Map(materias.map((m) => [m.clave, m]));
  const hechas = new Set(aprobadas);
  let periodo = ORDEN.indexOf(periodoInicio);
  let costo = 0;
  plan.forEach((q, n) => {
    const donde = `cuatrimestre ${n + 1}`;
    if (q.periodo !== ORDEN[periodo])
      throw new Error(`${donde}: periodo ${q.periodo}, se esperaba ${ORDEN[periodo]}`);
    if (q.materias.length > par.K) throw new Error(`${donde}: más de K materias`);
    let creditos = 0;
    for (const k of q.materias) {
      const m = porClave.get(k);
      if (!m) throw new Error(`${donde}: ${k} no existe`);
      if (hechas.has(k)) throw new Error(`${donde}: ${k} ya estaba aprobada`);
      if (!m.oferta.includes(q.periodo))
        throw new Error(`${donde}: ${k} no se ofrece en ${q.periodo}`);
      for (const p of m.prerrequisitos) {
        if (!hechas.has(p)) throw new Error(`${donde}: a ${k} le falta ${p}`);
      }
      if (m.exclusiva && q.materias.length > 1)
        throw new Error(`${donde}: ${k} es exclusiva y no va sola`);
      creditos += m.creditos;
    }
    if (creditos > par.Cmax) throw new Error(`${donde}: ${creditos} créditos pasan de Cmax`);
    for (const k of q.materias) hechas.add(k);
    costo += 1 + par.beta * Math.max(0, creditos - par.Cnorm);
    periodo = (periodo + 1) % 3;
  });
  for (const k of meta) if (!hechas.has(k)) throw new Error(`la meta no se cumple: falta ${k}`);
  return costo;
}
