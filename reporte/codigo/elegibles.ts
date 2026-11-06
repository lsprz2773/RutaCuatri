/** Elegibles de la regla 1: disponibles que además necesita la meta. */
export function elegibles(pb: Problema, A: number, p: Periodo): number {
  return (disponibles(pb, A, p) & necesarias(pb, A)) >>> 0;
}
