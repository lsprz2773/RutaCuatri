export function wastar(
  pb: Problema,
  H: number,
  cota = Infinity,
  limite: Limite = sinLimite(),
  opciones: OpcionesBusqueda = {},
): Resultado {
  const t0 = performance.now();
  const reglas = opciones.reglas ?? true;
  const conH = opciones.heuristica ?? true;
  const hv = (A: number) => (conH ? heuristica(pb, A) : 0);
  const c = compilar(pb.materias);

  const { A: A0, p: p0 } = pb.inicio;
  const frontera = new Monticulo<Nodo>(antes);
  const mejorG = new Map<number, number>();
  const padres = new Map<number, Padre | null>();
  const cerrados = new Set<number>();
  let orden = 0;
  let expansiones = 0;
  let generados = 0;
  let memoria = 1;

  frontera.meter({ f: H * hv(A0), cred: creditosDe(c, A0), g: 0, orden: 0, A: A0, p: p0 });
  mejorG.set(clave(A0, p0), 0);
  padres.set(clave(A0, p0), null);

  const terminar = (
    fin: Resultado["fin"],
    costo: number | null,
    plan: Cuatrimestre[] | null,
  ): Resultado => ({
    costo,
    plan,
    expansiones,
    generados,
    memoria,
    fin,
    tiempoMs: performance.now() - t0,
  });

  for (;;) {
    const nodo = frontera.sacar();
    if (!nodo) return terminar("agotada", null, null);
    const k = clave(nodo.A, nodo.p);
    if (cerrados.has(k) || nodo.g > mejorG.get(k)! + 1e-12) continue;
    if (contiene(nodo.A, pb.meta)) return terminar("meta", nodo.g, reconstruir(pb, padres, k));
    if (expansiones >= limite.maxExpansiones) return terminar("limite", null, null);
    if ((expansiones & 63) === 0 && performance.now() >= limite.fechaLimite)
      return terminar("tiempo", null, null);
    cerrados.add(k);
    expansiones++;

    for (const s of sucesores(pb, nodo.A, nodo.p, reglas)) {
      const t = clave(s.A, s.p);
      const ng = nodo.g + s.costo;
      const ht = hv(s.A);
      if (ng + ht >= cota - EPS || cerrados.has(t)) continue;
      const previo = mejorG.get(t);
      if (previo === undefined || ng < previo - 1e-12) {
        mejorG.set(t, ng);
        padres.set(t, { clave: k, S: s.S, creditos: s.creditos, costo: s.costo, p: nodo.p });
        orden++;
        generados++;
        frontera.meter({
          f: ng + H * ht,
          cred: nodo.cred + s.creditos,
          g: ng,
          orden,
          A: s.A,
          p: s.p,
        });
      }
    }
    memoria = Math.max(memoria, mejorG.size);
  }
}
