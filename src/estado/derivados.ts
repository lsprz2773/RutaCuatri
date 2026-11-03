// Funciones puras sobre el borrador: problema del motor, metas, textos de periodos.
import { MALLAS, ESCENARIOS } from "../datos/cargar.ts";
import type { Alumno, Malla } from "../datos/esquemas.ts";
import { crearProblema, mascara } from "../motor/problema.ts";
import { NOMBRES_PERIODO, PESOS_POR_OMISION } from "../motor/tipos.ts";
import type { Materia, NombrePeriodo, Periodo, Problema } from "../motor/tipos.ts";
import type { Borrador, TipoMeta } from "./tipos.ts";

export const PERFIL_REGULAR = ESCENARIOS.perfiles.regular;
export const PERFIL_MEDIO = ESCENARIOS.perfiles.medio_tiempo;

/** Claves del conjunto G según el tipo de meta (las 3 primeras reproducen M1, M2 y M3). */
export function clavesMeta(
  materias: Materia[],
  tipo: TipoMeta,
  especialidad: "A" | "B",
  especificas: string[],
): string[] {
  switch (tipo) {
    case "malla":
      return materias
        .filter(
          (m) => m.exclusiva || (m.tipo === "obligatoria" ? true : m.especialidad === especialidad),
        )
        .map((m) => m.clave);
    case "estadia":
      return materias.filter((m) => m.tipo === "obligatoria" && !m.exclusiva).map((m) => m.clave);
    case "especialidad":
      return materias
        .filter((m) => m.tipo === "optativa" && m.especialidad === especialidad)
        .map((m) => m.clave);
    case "especificas":
      return especificas.filter((k) => materias.some((m) => m.clave === k));
  }
}

export function aprobadasDe(b: Borrador): string[] {
  return b.materias.filter((m) => b.estados[m.clave] === "aprobada").map((m) => m.clave);
}

export function metaDe(b: Borrador): string[] {
  return clavesMeta(b.materias, b.meta.tipo, b.meta.especialidad, b.meta.claves);
}

export function problemaDe(b: Borrador): Problema {
  return crearProblema(b.materias, b.parametros, aprobadasDe(b), b.periodo, metaDe(b));
}

export function borradorVacio(malla?: Malla): Borrador {
  return {
    titulo: "Plan nuevo",
    descripcion: "",
    mallaId: malla?.id ?? null,
    nombreMalla: malla?.nombre ?? "Malla nueva",
    planMalla: malla?.plan ?? "",
    especialidades: malla?.especialidades ?? { A: "Especialidad A", B: "Especialidad B" },
    materias: malla ? structuredClone(malla.materias as Materia[]) : [],
    estados: {},
    periodo: "Sep",
    meta: { tipo: "malla", especialidad: "A", claves: [] },
    parametros: { ...PERFIL_REGULAR },
    pesos: [...PESOS_POR_OMISION],
    tiempoMax: 60,
  };
}

export function borradorDeAlumno(alumno: Alumno): Borrador {
  const malla = MALLAS.find((m) => m.id === alumno.malla)!;
  const b = borradorVacio(malla);
  b.titulo = alumno.nombre;
  b.descripcion = alumno.descripcion;
  b.estados = Object.fromEntries(alumno.aprobadas.map((k) => [k, "aprobada" as const]));
  // Las materias reprobadas de los alumnos tipo: E3 reprobó la 01 y E4 la 11 (decisiones.md, sección 1).
  const reprobada = alumno.tipo === "E3" ? "01" : alumno.tipo === "E4" ? "11" : null;
  if (reprobada) b.estados[`${alumno.malla}${reprobada}`] = "reprobada";
  b.periodo = alumno.periodo_inicio;
  return b;
}

const MESES: Record<NombrePeriodo, [string, string]> = {
  Ene: ["ene–abr", "Enero – abril"],
  May: ["may–ago", "Mayo – agosto"],
  Sep: ["sep–dic", "Septiembre – diciembre"],
};
const NOMBRE_LARGO: Record<NombrePeriodo, string> = {
  Ene: "enero",
  May: "mayo",
  Sep: "septiembre",
};

export const mesesCortos = (p: Periodo) => MESES[NOMBRES_PERIODO[p]][0];
export const mesesLargos = (p: NombrePeriodo) => MESES[p][1];
export const nombrePeriodo = (p: Periodo | NombrePeriodo) =>
  NOMBRE_LARGO[typeof p === "number" ? NOMBRES_PERIODO[p] : p];

/** Año relativo de cada cuatrimestre del plan: empieza en 1 y sube al llegar a enero. */
export function aniosDelPlan(inicio: Periodo, n: number): number[] {
  const r: number[] = [];
  let anio = 1;
  let p = inicio;
  for (let i = 0; i < n; i++) {
    if (i > 0 && p === 0) anio++;
    r.push(anio);
    p = ((p + 1) % 3) as Periodo;
  }
  return r;
}

export const formatoCosto = (x: number) =>
  Math.abs(x * 10 - Math.round(x * 10)) < 1e-6 ? x.toFixed(1) : String(Number(x.toFixed(3)));

export const formatoEntero = (x: number) => x.toLocaleString("en-US");

export function mascaraAprobadas(b: Borrador): number {
  return mascara(b.materias, aprobadasDe(b));
}
