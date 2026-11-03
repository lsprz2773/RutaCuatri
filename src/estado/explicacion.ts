// Explicación de por qué el plan tiene N cuatrimestres, a partir de la cota h y la cadena crítica.
import { detalleH } from "../motor/heuristica.ts";
import type { Cuatrimestre, Problema } from "../motor/tipos.ts";
import { aniosDelPlan, nombrePeriodo } from "./derivados.ts";

export interface PasoCadena {
  clave: string;
  nombre: string;
  /** Número de cuatrimestre (desde 1) en que se inscribe, o null si no está en el plan. */
  cuatrimestre: number | null;
  periodo: string;
  anio: number | null;
}

export interface Explicacion {
  n: number;
  h: number;
  R: number;
  L: number;
  porCreditos: number;
  cadena: PasoCadena[];
  /** Cuatrimestres extra sobre la cota h, con su causa. */
  esperas: string[];
  sobrecarga: number;
}

export function explicar(pb: Problema, plan: Cuatrimestre[]): Explicacion {
  const d = detalleH(pb, pb.inicio.A);
  const anios = aniosDelPlan(pb.inicio.p, plan.length);
  const dondeVa = (clave: string) => plan.findIndex((q) => q.materias.includes(clave));
  const cadena: PasoCadena[] = d.cadena.map((i) => {
    const m = pb.materias[i];
    const k = dondeVa(m.clave);
    return {
      clave: m.clave,
      nombre: m.nombre,
      cuatrimestre: k >= 0 ? k + 1 : null,
      periodo: k >= 0 ? nombrePeriodo(plan[k].periodo).slice(0, 3) : "",
      anio: k >= 0 ? anios[k] : null,
    };
  });
  const esperas: string[] = [];
  const primera = cadena[0];
  if (primera?.cuatrimestre && primera.cuatrimestre > 1) {
    const m = pb.materias.find((x) => x.clave === primera.clave)!;
    esperas.push(
      `${m.nombre} encabeza la cadena y se abre en ${m.oferta.join(", ")}; entra hasta el cuatrimestre ${primera.cuatrimestre}.`,
    );
  }
  for (let i = 1; i < cadena.length; i++) {
    const a = cadena[i - 1];
    const b = cadena[i];
    if (a.cuatrimestre && b.cuatrimestre && b.cuatrimestre - a.cuatrimestre > 1) {
      const m = pb.materias.find((x) => x.clave === b.clave)!;
      esperas.push(
        `Entre ${a.clave} y ${b.clave} hay ${b.cuatrimestre - a.cuatrimestre - 1} cuatrimestre(s) de espera: ${b.clave} se abre en ${m.oferta.join(", ")}.`,
      );
    }
  }
  const vacios = plan.filter((q) => q.materias.length === 0).length;
  if (vacios > 0) {
    esperas.push(
      `${vacios} cuatrimestre(s) sin inscripción porque no se abre ninguna materia necesaria.`,
    );
  }
  return {
    n: plan.length,
    h: d.h,
    R: d.R,
    L: d.L,
    porCreditos: Math.ceil(d.R / pb.Cmax),
    cadena,
    esperas,
    sobrecarga: plan.reduce((s, q) => s + Math.max(0, q.creditos - pb.Cnorm), 0),
  };
}
