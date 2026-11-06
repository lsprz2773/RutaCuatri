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
