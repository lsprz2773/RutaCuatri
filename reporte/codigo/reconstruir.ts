function reconstruir(pb: Problema, padres: Map<number, Padre | null>, k: number): Cuatrimestre[] {
  const plan: Cuatrimestre[] = [];
  for (let x = padres.get(k); x; x = padres.get(x.clave)) {
    plan.unshift({
      periodo: x.p,
      S: x.S,
      materias: clavesDe(pb.materias, x.S),
      creditos: x.creditos,
      costo: x.costo,
    });
  }
  return plan;
}
