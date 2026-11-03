import type { EstadoMateria } from "../datos/csv.ts";
import type { Cuatrimestre, Materia, NombrePeriodo, ResumenPasada } from "../motor/tipos.ts";
import type { Perfil } from "../motor/problema.ts";

export type { EstadoMateria };

/** Las 4 metas de la pantalla 4. */
export type TipoMeta = "malla" | "estadia" | "especialidad" | "especificas";

export interface Borrador {
  titulo: string;
  descripcion: string;
  mallaId: string | null;
  nombreMalla: string;
  planMalla: string;
  especialidades: { A: string; B: string };
  materias: Materia[];
  estados: Record<string, EstadoMateria>;
  periodo: NombrePeriodo;
  meta: { tipo: TipoMeta; especialidad: "A" | "B"; claves: string[] };
  parametros: Perfil;
  pesos: number[];
  /** Segundos; null = sin límite. */
  tiempoMax: number | null;
}

export interface ResultadoPlan {
  costo: number;
  plan: Cuatrimestre[];
  pasadas: ResumenPasada[];
  optimo: boolean;
  /** Peso de la pasada que dio el plan: costo ≤ garantia · C*. */
  garantia: number;
  hInicio: number;
  tiempoMs: number;
  detenido: boolean;
}

export interface PlanGuardado {
  id: string;
  fecha: string;
  etiqueta: "óptimo" | "mejor" | "análisis" | "sin plan";
  borrador: Borrador;
  resultado: ResultadoPlan | null;
}

export interface PasadaEnVivo extends Partial<ResumenPasada> {
  H: number;
  estado: "pendiente" | "corriendo" | "hecha";
}

export interface EstadoBusqueda {
  estado: "inactiva" | "corriendo" | "terminada" | "detenida";
  pasadas: PasadaEnVivo[];
  mejor: { costo: number; plan: Cuatrimestre[]; H: number; tiempoMs: number } | null;
  hInicio: number;
  inicio: number;
}
