// Tipos del motor de búsqueda (contrato de docs/decisiones.md, sección 5).

export type Periodo = 0 | 1 | 2; // Ene, May, Sep
export const NOMBRES_PERIODO = ["Ene", "May", "Sep"] as const;
export type NombrePeriodo = (typeof NOMBRES_PERIODO)[number];

export interface Materia {
  clave: string;
  nombre: string;
  creditos: number;
  nivel: number;
  prerrequisitos: string[];
  oferta: NombrePeriodo[];
  tipo: "obligatoria" | "optativa";
  especialidad: "A" | "B" | null;
  exclusiva: boolean;
}

export interface Problema {
  materias: Materia[];
  Cnorm: number;
  Cmax: number;
  beta: number;
  K: number;
  /** Conjunto G de la meta, una materia por bit. */
  meta: number;
  inicio: { A: number; p: Periodo };
}

export type ReglaValidacion = "malla" | "oferta" | "creditos" | "kardex" | "parametros";

export interface ErrorValidacion {
  regla: ReglaValidacion;
  clave?: string;
  mensaje: string;
}

export interface Sucesor {
  A: number;
  p: Periodo;
  /** Materias inscritas, una por bit (0 = cuatrimestre sin inscripción). */
  S: number;
  creditos: number;
  costo: number;
}

export interface Cuatrimestre {
  periodo: Periodo;
  S: number;
  materias: string[];
  creditos: number;
  costo: number;
}

/** meta: llegó a la meta; agotada: vació la frontera; limite: 200,000 expansiones; tiempo: se acabó el tiempo. */
export type FinPasada = "meta" | "agotada" | "limite" | "tiempo";

export interface Resultado {
  costo: number | null;
  plan: Cuatrimestre[] | null;
  expansiones: number;
  generados: number;
  /** Máximo de estados guardados a la vez (frontera y cerrados). */
  memoria: number;
  fin: FinPasada;
  tiempoMs: number;
}

export interface Limite {
  maxExpansiones: number;
  /** Instante (ms de performance.now) en que se corta; Infinity = sin límite. */
  fechaLimite: number;
}

export interface OpcionesBusqueda {
  /** false desactiva las reglas D06 a D08 (solo para experimentos y pruebas). */
  reglas?: boolean;
  /** false usa h = 0 (Costo Uniforme). */
  heuristica?: boolean;
}

export interface ResumenPasada {
  H: number;
  costo: number | null;
  expansiones: number;
  generados: number;
  memoria: number;
  tiempoMs: number;
  fin: FinPasada;
}

export type EventoMotor =
  | { tipo: "pasada-inicio"; H: number; indice: number }
  | { tipo: "plan"; H: number; costo: number; plan: Cuatrimestre[]; tiempoMs: number }
  | { tipo: "pasada-fin"; indice: number; pasada: ResumenPasada; mejor: number | null }
  | {
      tipo: "fin";
      costo: number | null;
      plan: Cuatrimestre[] | null;
      optimo: boolean;
      cotaInferior: number;
      garantia: number | null;
      pasadas: ResumenPasada[];
      tiempoMs: number;
    }
  | { tipo: "error"; errores: ErrorValidacion[] };

export interface ResultadoAnytime {
  costo: number | null;
  plan: Cuatrimestre[] | null;
  pasadas: ResumenPasada[];
  /** true si la pasada con H = 1 terminó y demostró el óptimo. */
  optimo: boolean;
  /** Peso de la pasada que produjo el mejor plan (costo ≤ garantia · C*). */
  garantia: number | null;
  tiempoMs: number;
  tiempoPrimerPlanMs: number | null;
  errores: ErrorValidacion[];
}

export const PESOS_POR_OMISION = [3, 2, 1.5, 1];
export const MAX_EXPANSIONES = 200_000;
