// Representación compacta del problema: arreglos por índice de materia y máscaras de bits.
import { NOMBRES_PERIODO } from "./tipos.ts";
import type { Cuatrimestre, Materia, NombrePeriodo, Periodo, Problema } from "./tipos.ts";

export interface Compilado {
  n: number;
  cr: number[];
  /** Prerrequisitos de cada materia como máscara. */
  pre: number[];
  /** Materias ofrecidas en cada periodo como máscara. */
  oferta: [number, number, number];
  exclusivas: number;
  /** Índices en orden topológico (prerrequisitos primero). */
  topo: number[];
}

const cache = new WeakMap<Materia[], Compilado>();

export function compilar(materias: Materia[]): Compilado {
  const guardado = cache.get(materias);
  if (guardado) return guardado;
  const n = materias.length;
  const indice = new Map(materias.map((m, i) => [m.clave, i]));
  const cr = materias.map((m) => m.creditos);
  const pre = materias.map((m) => {
    let x = 0;
    for (const p of m.prerrequisitos) {
      const i = indice.get(p);
      if (i !== undefined) x |= 1 << i;
    }
    return x >>> 0;
  });
  const oferta: [number, number, number] = [0, 0, 0];
  let exclusivas = 0;
  materias.forEach((m, i) => {
    for (const o of m.oferta) {
      const p = NOMBRES_PERIODO.indexOf(o);
      if (p >= 0) oferta[p] = (oferta[p] | (1 << i)) >>> 0;
    }
    if (m.exclusiva) exclusivas = (exclusivas | (1 << i)) >>> 0;
  });
  const c: Compilado = { n, cr, pre, oferta, exclusivas, topo: ordenTopologico(n, pre) };
  cache.set(materias, c);
  return c;
}

function ordenTopologico(n: number, pre: number[]): number[] {
  const orden: number[] = [];
  const estado = new Array<number>(n).fill(0);
  const visitar = (i: number) => {
    if (estado[i] !== 0) return; // 1 = en curso (ciclo, lo reporta validar), 2 = listo
    estado[i] = 1;
    for (let q = 0; q < n; q++) if ((pre[i] >>> q) & 1) visitar(q);
    estado[i] = 2;
    orden.push(i);
  };
  for (let i = 0; i < n; i++) visitar(i);
  return orden;
}

export function bit(i: number): number {
  return (1 << i) >>> 0;
}

export function tiene(A: number, i: number): boolean {
  return ((A >>> i) & 1) === 1;
}

export function indices(A: number): number[] {
  const r: number[] = [];
  for (let i = 0; A >>> i !== 0 && i < 32; i++) if ((A >>> i) & 1) r.push(i);
  return r;
}

export function contiene(A: number, G: number): boolean {
  return (A & G) >>> 0 === G >>> 0;
}

export function creditosDe(c: Compilado, A: number): number {
  let s = 0;
  for (let i = 0; i < c.n; i++) if ((A >>> i) & 1) s += c.cr[i];
  return s;
}

export function costoCuatrimestre(pb: Problema, creditos: number): number {
  return 1 + pb.beta * Math.max(0, creditos - pb.Cnorm);
}

/** Materias necesarias: las de G no aprobadas más sus prerrequisitos pendientes (cierre). */
export function necesarias(pb: Problema, A: number): number {
  const c = compilar(pb.materias);
  let need = 0;
  const pila: number[] = indices((pb.meta & ~A) >>> 0);
  while (pila.length > 0) {
    const x = pila.pop()!;
    if ((need >>> x) & 1) continue;
    need = (need | (1 << x)) >>> 0;
    const faltan = (c.pre[x] & ~A) >>> 0;
    for (const q of indices(faltan)) pila.push(q);
  }
  return need;
}

export function mascara(materias: Materia[], claves: string[]): number {
  let x = 0;
  for (const k of claves) {
    const i = materias.findIndex((m) => m.clave === k);
    if (i >= 0) x |= 1 << i;
  }
  return x >>> 0;
}

export function clavesDe(materias: Materia[], A: number): string[] {
  return indices(A)
    .filter((i) => i < materias.length)
    .map((i) => materias[i].clave);
}

export function periodoDe(nombre: NombrePeriodo): Periodo {
  return NOMBRES_PERIODO.indexOf(nombre) as Periodo;
}

export function siguientePeriodo(p: Periodo): Periodo {
  return ((p + 1) % 3) as Periodo;
}

export interface Perfil {
  Cnorm: number;
  Cmax: number;
  beta: number;
  K: number;
}

export function crearProblema(
  materias: Materia[],
  perfil: Perfil,
  aprobadas: string[],
  periodo: NombrePeriodo,
  meta: string[],
): Problema {
  return {
    materias,
    Cnorm: perfil.Cnorm,
    Cmax: perfil.Cmax,
    beta: perfil.beta,
    K: perfil.K,
    meta: mascara(materias, meta),
    inicio: { A: mascara(materias, aprobadas), p: periodoDe(periodo) },
  };
}

/** Recorre un plan desde el inicio y devuelve el estado (A, p) antes de cada cuatrimestre. */
export function estadosDelPlan(pb: Problema, plan: Cuatrimestre[]): { A: number; p: Periodo }[] {
  const r: { A: number; p: Periodo }[] = [];
  let A = pb.inicio.A;
  let p = pb.inicio.p;
  for (const q of plan) {
    r.push({ A, p });
    A = (A | q.S) >>> 0;
    p = siguientePeriodo(p);
  }
  r.push({ A, p });
  return r;
}
