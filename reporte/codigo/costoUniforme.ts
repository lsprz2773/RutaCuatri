/** Costo Uniforme: h = 0. */
export function costoUniforme(pb: Problema, limite?: Limite): Resultado {
  return wastar(pb, 1, Infinity, limite, { heuristica: false });
}
