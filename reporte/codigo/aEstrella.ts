/** A* (una pasada con H = 1). */
export function aEstrella(
  pb: Problema,
  limite?: Limite,
  opciones: OpcionesBusqueda = {},
): Resultado {
  return wastar(pb, 1, Infinity, limite, opciones);
}
