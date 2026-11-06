export function validar(pb: Problema): ErrorValidacion[] {
  const malla = validarMalla(pb.materias);
  if (malla.length > 0) return malla;
  return [...validarParametros(pb), ...validarKardex(pb), ...validarNecesarias(pb)];
}
