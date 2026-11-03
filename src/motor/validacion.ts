// Validación antes de buscar, sección 3.4 de docs/decisiones.md.
import { compilar, indices, necesarias } from "./problema.ts";
import type { ErrorValidacion, Materia, Problema } from "./tipos.ts";

export const MAX_MATERIAS = 31;

/** Regla 1: claves únicas, prerrequisitos existentes y sin ciclos. También el límite de 31 materias. */
export function validarMalla(materias: Materia[]): ErrorValidacion[] {
  const err: ErrorValidacion[] = [];
  if (materias.length > MAX_MATERIAS) {
    err.push({
      regla: "malla",
      mensaje: `La malla tiene ${materias.length} materias; el máximo es ${MAX_MATERIAS}.`,
    });
  }
  const vistas = new Set<string>();
  for (const m of materias) {
    if (vistas.has(m.clave))
      err.push({ regla: "malla", clave: m.clave, mensaje: `La clave ${m.clave} está repetida.` });
    vistas.add(m.clave);
  }
  for (const m of materias) {
    for (const p of m.prerrequisitos) {
      if (!vistas.has(p)) {
        err.push({
          regla: "malla",
          clave: m.clave,
          mensaje: `${m.clave} tiene el prerrequisito ${p}, que no existe.`,
        });
      }
    }
  }
  const ciclo = buscarCiclo(materias);
  if (ciclo) {
    err.push({
      regla: "malla",
      clave: ciclo[0],
      mensaje: `Hay un ciclo de prerrequisitos: ${ciclo.join(" → ")}.`,
    });
  }
  return err;
}

function buscarCiclo(materias: Materia[]): string[] | null {
  const porClave = new Map(materias.map((m) => [m.clave, m]));
  const estado = new Map<string, number>();
  const camino: string[] = [];
  const visitar = (k: string): string[] | null => {
    const e = estado.get(k) ?? 0;
    if (e === 2) return null;
    if (e === 1) return [...camino.slice(camino.indexOf(k)), k];
    estado.set(k, 1);
    camino.push(k);
    for (const p of porClave.get(k)?.prerrequisitos ?? []) {
      if (!porClave.has(p)) continue;
      const r = visitar(p);
      if (r) return r;
    }
    camino.pop();
    estado.set(k, 2);
    return null;
  };
  for (const m of materias) {
    const r = visitar(m.clave);
    if (r) return r.reverse();
  }
  return null;
}

/** Regla 4: toda materia aprobada tiene sus prerrequisitos aprobados. */
export function validarKardex(pb: Problema): ErrorValidacion[] {
  const c = compilar(pb.materias);
  const A = pb.inicio.A;
  return indices(A)
    .filter((i) => i < c.n && (c.pre[i] & A) >>> 0 !== c.pre[i])
    .map((i) => {
      const m = pb.materias[i];
      const faltan = m.prerrequisitos.filter(
        (p) => !indices(A).some((j) => pb.materias[j]?.clave === p),
      );
      return {
        regla: "kardex" as const,
        clave: m.clave,
        mensaje: `${m.clave} está aprobada pero le falta ${faltan.join(", ")}.`,
      };
    });
}

/** Regla 5: K ≥ 1, Cnorm ≤ Cmax y β ≥ 0. */
export function validarParametros(pb: Problema): ErrorValidacion[] {
  const err: ErrorValidacion[] = [];
  if (!Number.isInteger(pb.K) || pb.K < 1)
    err.push({ regla: "parametros", mensaje: "K debe ser un entero mayor o igual a 1." });
  if (!(pb.Cnorm <= pb.Cmax))
    err.push({
      regla: "parametros",
      mensaje: "La carga normal no puede pasar de la carga máxima.",
    });
  if (!(pb.beta >= 0)) err.push({ regla: "parametros", mensaje: "β no puede ser negativa." });
  return err;
}

/** Reglas 2 y 3: toda materia necesaria se abre en algún periodo y cabe en Cmax. */
export function validarNecesarias(pb: Problema): ErrorValidacion[] {
  const err: ErrorValidacion[] = [];
  const need = necesarias(pb, pb.inicio.A);
  for (const i of indices(need)) {
    const m = pb.materias[i];
    if (m.oferta.length === 0) {
      err.push({
        regla: "oferta",
        clave: m.clave,
        mensaje: `${m.clave} ${m.nombre} no se abre en ningún periodo.`,
      });
    }
    if (m.creditos > pb.Cmax) {
      err.push({
        regla: "creditos",
        clave: m.clave,
        mensaje: `${m.clave} ${m.nombre} tiene ${m.creditos} créditos y la carga máxima es ${pb.Cmax}.`,
      });
    }
  }
  return err;
}

export function validar(pb: Problema): ErrorValidacion[] {
  const malla = validarMalla(pb.materias);
  if (malla.length > 0) return malla;
  return [...validarParametros(pb), ...validarKardex(pb), ...validarNecesarias(pb)];
}

/** true si los errores llevan a la pantalla Sin plan (y no a corregir la malla, el kárdex o los parámetros). */
export function esSinPlan(errores: ErrorValidacion[]): boolean {
  return errores.length > 0 && errores.every((e) => e.regla === "oferta" || e.regla === "creditos");
}
