import type { Metodo, ResultadoMetodo } from "../motor/metodos.ts";
import type { EventoMotor, Problema } from "../motor/tipos.ts";

export interface Trabajo {
  problema: Problema;
  metodo: Metodo;
  /** ms; null = sin límite. */
  tiempoMaxMs: number | null;
}

export type Pedido =
  | { tipo: "anytime"; problema: Problema; pesos: number[]; tiempoMaxMs: number | null }
  | { tipo: "lote"; trabajos: Trabajo[] };

export type Respuesta =
  | EventoMotor
  | { tipo: "lote-resultado"; indice: number; resultado: ResultadoMetodo }
  | { tipo: "lote-fin" };
