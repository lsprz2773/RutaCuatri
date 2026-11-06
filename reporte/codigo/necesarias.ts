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
