// Generador de mallas al azar con semilla fija (mulberry32).
import type { Materia, NombrePeriodo, Problema } from "../src/motor/tipos.ts";

export function generador(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PERIODOS: NombrePeriodo[] = ["Ene", "May", "Sep"];

/** Malla válida de n materias: DAG, oferta no vacía, créditos ≤ Cmax y a lo sumo una exclusiva al final. */
export function problemaAlAzar(semilla: number): Problema {
  const r = generador(semilla);
  const ent = (a: number, b: number) => a + Math.floor(r() * (b - a + 1));
  const n = ent(8, 11);
  const Cmax = ent(12, 20);
  const Cnorm = ent(Math.max(8, Cmax - 8), Cmax);
  const materias: Materia[] = [];
  for (let i = 0; i < n; i++) {
    const exclusiva = i === n - 1 && r() < 0.3;
    const prerrequisitos: string[] = [];
    for (let j = 0; j < i; j++) if (r() < 0.2) prerrequisitos.push(`M${j}`);
    let oferta = PERIODOS.filter(() => r() < 0.55);
    if (oferta.length === 0) oferta = [PERIODOS[ent(0, 2)]];
    materias.push({
      clave: `M${i}`,
      nombre: `Materia ${i}`,
      creditos: exclusiva ? ent(Math.max(4, Cnorm - 2), Cmax) : ent(3, 8),
      nivel: 1,
      prerrequisitos,
      oferta,
      tipo: "obligatoria",
      especialidad: null,
      exclusiva,
    });
  }
  // Meta: casi siempre toda la malla; a veces un subconjunto.
  let meta = (1 << n) - 1;
  if (r() < 0.3) meta = ent(1, (1 << n) - 1);
  return {
    materias,
    Cnorm,
    Cmax,
    beta: [0.1, 0.2, 0.5][ent(0, 2)],
    K: ent(2, 5),
    meta: meta >>> 0,
    inicio: { A: 0, p: ent(0, 2) as 0 | 1 | 2 },
  };
}
