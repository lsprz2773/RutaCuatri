/** Materias que se pueden inscribir en p: no aprobadas, ofrecidas en p y con prerrequisitos en A. */
export function disponibles(pb: Problema, A: number, p: Periodo): number {
  const c = compilar(pb.materias);
  let el = 0;
  for (let i = 0; i < c.n; i++) {
    if ((A >>> i) & 1) continue;
    if (!((c.oferta[p] >>> i) & 1)) continue;
    if ((c.pre[i] & A) >>> 0 !== c.pre[i]) continue;
    el |= 1 << i;
  }
  return el >>> 0;
}
