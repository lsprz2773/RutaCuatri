import { describe, expect, it } from "vitest";
import {
  NOMBRES_PERIODO,
  anytime,
  crearProblema,
  esSinPlan,
  h,
  validar,
  type Cuatrimestre,
  type Materia,
  type Problema,
} from "../src/motor/index.ts";
import { alumnoPorId, casos, escenarios, mallaPorId, metaPorId } from "./utilidades.ts";
import { verificarPlan, type Parametros } from "./verificador.ts";

const TOL = 1e-9;

interface Escenario {
  id: string;
  perfil: "regular" | "medio_tiempo";
  alumno: string;
  meta: string;
  h_inicio: number;
  costo_optimo: number;
  cuatrimestres: number;
  creditos_sobrecarga: number;
}

interface CasoEspecial {
  id: string;
  malla: string;
  parametros: Parametros;
  inicio: { aprobadas: string[]; periodo: "Ene" | "May" | "Sep" };
  meta: string | string[];
  esperado: {
    costo: number | null;
    cuatrimestres?: number;
    h_inicio?: number;
    plan?: { periodo: string; materias: string[]; creditos: number; costo: number }[];
  };
  materias_mini?: Materia[];
  modificacion?: Record<string, Partial<Materia>>;
}

const plano = (plan: Cuatrimestre[]) =>
  plan.map((q) => ({ periodo: NOMBRES_PERIODO[q.periodo], materias: q.materias }));

function comprobarPlan(
  pb: Problema,
  par: Parametros,
  aprobadas: string[],
  periodo: "Ene" | "May" | "Sep",
  meta: string[],
  plan: Cuatrimestre[],
  costo: number,
) {
  const recalculado = verificarPlan(pb.materias, par, aprobadas, periodo, meta, plano(plan));
  expect(Math.abs(recalculado - costo)).toBeLessThan(TOL);
}

describe("los 72 escenarios", () => {
  const lista = casos.escenarios as Escenario[];
  it("son 72", () => expect(lista).toHaveLength(72));

  for (const e of lista) {
    it(`${e.id} ${e.alumno} ${e.meta} ${e.perfil}`, () => {
      const alumno = alumnoPorId(e.alumno);
      const meta = metaPorId(e.meta);
      const perfil = escenarios.perfiles[e.perfil];
      const materias = mallaPorId(alumno.malla).materias as Materia[];
      const pb = crearProblema(
        materias,
        perfil,
        alumno.aprobadas,
        alumno.periodo_inicio,
        meta.materias,
      );

      expect(validar(pb)).toEqual([]);
      expect(h(pb, pb.inicio.A)).toBe(e.h_inicio);

      const r = anytime(pb, undefined, undefined, { tiempoMaxMs: Infinity });
      expect(r.optimo).toBe(true);
      expect(Math.abs(r.costo! - e.costo_optimo)).toBeLessThan(TOL);
      expect(r.plan!.length).toBe(e.cuatrimestres);

      // Garantía: cada pasada con peso H da un costo ≤ H·C*.
      for (const p of r.pasadas) {
        if (p.costo !== null) expect(p.costo).toBeLessThanOrEqual(p.H * e.costo_optimo + TOL);
      }

      comprobarPlan(
        pb,
        perfil,
        alumno.aprobadas,
        alumno.periodo_inicio,
        meta.materias,
        r.plan!,
        r.costo!,
      );
      const sobrecarga = r.plan!.reduce((s, q) => s + Math.max(0, q.creditos - perfil.Cnorm), 0);
      expect(sobrecarga).toBe(e.creditos_sobrecarga);
    });
  }
});

describe("casos especiales T01 a T05", () => {
  for (const t of casos.casos_especiales as CasoEspecial[]) {
    it(`${t.id}`, () => {
      const materias: Materia[] = structuredClone(
        t.materias_mini ?? (mallaPorId(t.malla).materias as Materia[]),
      );
      for (const [clave, cambio] of Object.entries(t.modificacion ?? {})) {
        Object.assign(
          materias.find((m) => m.clave === clave)!,
          cambio,
        );
      }
      const metaClaves = Array.isArray(t.meta) ? t.meta : metaPorId(t.meta).materias;
      const pb = crearProblema(
        materias,
        t.parametros,
        t.inicio.aprobadas,
        t.inicio.periodo,
        metaClaves,
      );

      if (t.esperado.costo === null) {
        const errores = validar(pb);
        expect(errores.length).toBeGreaterThan(0);
        expect(esSinPlan(errores)).toBe(true);
        const r = anytime(pb);
        expect(r.costo).toBeNull();
        expect(r.pasadas).toHaveLength(0);
        return;
      }

      expect(validar(pb)).toEqual([]);
      if (t.esperado.h_inicio !== undefined) expect(h(pb, pb.inicio.A)).toBe(t.esperado.h_inicio);
      const r = anytime(pb, undefined, undefined, { tiempoMaxMs: Infinity });
      expect(Math.abs(r.costo! - t.esperado.costo)).toBeLessThan(TOL);
      expect(r.plan!.length).toBe(t.esperado.cuatrimestres);
      comprobarPlan(
        pb,
        t.parametros,
        t.inicio.aprobadas,
        t.inicio.periodo,
        metaClaves,
        r.plan!,
        r.costo!,
      );
      if (t.esperado.plan) {
        expect(
          r.plan!.map((q) => ({
            periodo: NOMBRES_PERIODO[q.periodo],
            materias: q.materias,
            creditos: q.creditos,
            costo: q.costo,
          })),
        ).toEqual(t.esperado.plan);
      }
    });
  }

  it("T03 marca a ISW23 y T04 a ISW28", () => {
    const especiales = casos.casos_especiales as CasoEspecial[];
    const causa = (id: string) => {
      const t = especiales.find((x) => x.id === id)!;
      const materias: Materia[] = structuredClone(mallaPorId(t.malla).materias as Materia[]);
      for (const [clave, cambio] of Object.entries(t.modificacion ?? {})) {
        Object.assign(
          materias.find((m) => m.clave === clave)!,
          cambio,
        );
      }
      const pb = crearProblema(
        materias,
        t.parametros,
        t.inicio.aprobadas,
        t.inicio.periodo,
        metaPorId(t.meta as string).materias,
      );
      return validar(pb).map((e) => e.clave);
    };
    expect(causa("T03")).toEqual(["ISW23"]);
    expect(causa("T04")).toEqual(["ISW28"]);
  });
});

describe("validación", () => {
  const base = mallaPorId("ISW").materias as Materia[];
  const pbDe = (
    materias: Materia[],
    aprobadas: string[] = [],
    perfil = escenarios.perfiles.regular,
  ) => crearProblema(materias, perfil, aprobadas, "Sep", metaPorId("ISW-M1").materias);

  it("detecta prerrequisitos inexistentes", () => {
    const m = structuredClone(base);
    m[5].prerrequisitos = ["XXX"];
    expect(validar(pbDe(m)).map((e) => e.regla)).toEqual(["malla"]);
  });
  it("detecta ciclos", () => {
    const m = structuredClone(base);
    m[0].prerrequisitos = ["ISW06"];
    const err = validar(pbDe(m));
    expect(err[0].regla).toBe("malla");
    expect(err[0].mensaje).toContain("ciclo");
  });
  it("detecta un kárdex incoherente", () => {
    const err = validar(pbDe(base, ["ISW06"]));
    expect(err).toEqual([expect.objectContaining({ regla: "kardex", clave: "ISW06" })]);
  });
  it("detecta parámetros inválidos", () => {
    const err = validar(pbDe(base, [], { Cnorm: 40, Cmax: 36, beta: -1, K: 0 }));
    expect(err.filter((e) => e.regla === "parametros")).toHaveLength(3);
  });
});

describe("eventos de anytime", () => {
  it("emite pasada-inicio, plan, pasada-fin y fin en orden", () => {
    const alumno = alumnoPorId("ISW-E1");
    const pb = crearProblema(
      mallaPorId("ISW").materias as Materia[],
      escenarios.perfiles.medio_tiempo,
      alumno.aprobadas,
      alumno.periodo_inicio,
      metaPorId("ISW-M1").materias,
    );
    const tipos: string[] = [];
    anytime(pb, undefined, (e) => tipos.push(e.tipo));
    expect(tipos[0]).toBe("pasada-inicio");
    expect(tipos.at(-1)).toBe("fin");
    expect(tipos.filter((t) => t === "pasada-fin")).toHaveLength(4);
    expect(tipos.filter((t) => t === "plan").length).toBeGreaterThanOrEqual(1);
  });
});
