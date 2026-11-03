import { describe, expect, it } from "vitest";
import { ESCENARIOS, MALLAS } from "../src/datos/cargar.ts";
import { exportarMallaCsv, importarKardexCsv, importarMallaCsv } from "../src/datos/csv.ts";
import {
  aniosDelPlan,
  borradorDeAlumno,
  clavesMeta,
  formatoCosto,
  problemaDe,
} from "../src/estado/derivados.ts";
import { explicar } from "../src/estado/explicacion.ts";
import { aEstrella, anytime, correrMetodo } from "../src/motor/index.ts";
import { alternativas, metaSin, variantesSensibilidad } from "../src/estado/analisis.ts";
import type { Materia } from "../src/motor/tipos.ts";

describe("metas de la pantalla 4", () => {
  it("reproducen las 9 metas de escenarios.json", () => {
    for (const meta of ESCENARIOS.metas) {
      const materias = MALLAS.find((m) => m.id === meta.malla)!.materias as Materia[];
      const tipo = meta.id.endsWith("M1")
        ? "malla"
        : meta.id.endsWith("M2")
          ? "estadia"
          : "especialidad";
      const esp = meta.id.endsWith("M3") ? "B" : "A";
      expect(clavesMeta(materias, tipo, esp, []).sort()).toEqual([...meta.materias].sort());
    }
  });
});

describe("alumnos de ejemplo", () => {
  it("Ana Ruiz (ISW-E3, M1, regular) llega a 5.0 en 5 cuatrimestres", () => {
    const b = borradorDeAlumno(ESCENARIOS.alumnos.find((a) => a.id === "ISW-E3")!);
    expect(b.estados["ISW01"]).toBe("reprobada");
    const pb = problemaDe(b);
    const r = anytime(pb);
    expect(r.costo).toBeCloseTo(5.0, 9);
    expect(r.plan).toHaveLength(5);
    const e = explicar(pb, r.plan!);
    expect(e.n).toBe(5);
    expect(e.h).toBeLessThanOrEqual(5);
    expect(e.cadena.every((c) => c.cuatrimestre !== null)).toBe(true);
  });
});

describe("CSV", () => {
  it("la malla exportada se vuelve a importar igual", () => {
    const materias = MALLAS[0].materias as Materia[];
    const r = importarMallaCsv(exportarMallaCsv(materias));
    expect(r.errores).toEqual([]);
    expect(r.datos).toEqual(materias);
  });
  it("marca filas inválidas del kárdex", () => {
    const r = importarKardexCsv("clave,estado\nISW01,aprobada\nXXX,aprobada\nISW02,quizá\n", [
      "ISW01",
      "ISW02",
    ]);
    expect(r.datos).toEqual({ ISW01: "aprobada" });
    expect(r.errores).toHaveLength(2);
  });
});

describe("textos", () => {
  it("años del plan y formato de costo", () => {
    expect(aniosDelPlan(2, 5)).toEqual([1, 2, 2, 2, 3]);
    expect(aniosDelPlan(1, 3)).toEqual([1, 1, 2]);
    expect(formatoCosto(7)).toBe("7.0");
    expect(formatoCosto(6.4000000000000004)).toBe("6.4");
    expect(formatoCosto(6.65)).toBe("6.65");
  });
});

describe("pantallas 7 a 9", () => {
  const e1 = () => borradorDeAlumno(ESCENARIOS.alumnos.find((a) => a.id === "ISW-E1")!);

  it("la sensibilidad de ISW-E1 coincide con los valores de referencia del experimento D", () => {
    const esperado: Record<string, [number, number, number]> = {
      base: [6.4, 6, 4],
      "Penalización β = 0.05": [6.2, 6, 4],
      "Penalización β = 0.2": [6.8, 6, 4],
      "Penalización β = 0.5": [7.0, 7, 0],
      "Carga normal = 27": [7.4, 7, 4],
      "Carga normal = 33": [6.0, 6, 0],
      "Carga máxima = 30": [7.0, 7, 0],
      "Carga máxima = 33": [6.4, 6, 4],
      "Carga máxima = 40": [6.4, 6, 4],
    };
    const b = e1();
    const pb = problemaDe(b);
    const filas = variantesSensibilidad(b.parametros);
    expect(filas).toHaveLength(9);
    for (const v of filas) {
      const r = correrMetodo({ ...pb, ...v.parametros }, "astar", null);
      const [costo, n, sobre] = esperado[v.base ? "base" : v.etiqueta];
      expect(r.costo).toBeCloseTo(costo, 9);
      expect(r.cuatrimestres).toBe(n);
      expect(r.sobrecarga).toBe(sobre);
    }
  });

  it("en cada cuatrimestre del plan, la alternativa elegida tiene el menor costo total", () => {
    const pb = problemaDe(e1());
    const r = anytime(pb);
    let g = 0;
    r.plan!.forEach((q, i) => {
      const alts = alternativas(pb, r.plan!, i + 1);
      expect(alts[0].elegida).toBe(true);
      const total = (a: (typeof alts)[number]) =>
        g + a.costo + aEstrella({ ...pb, inicio: a.despues }).costo!;
      const elegida = total(alts[0]);
      expect(elegida).toBeCloseTo(r.costo!, 9);
      for (const a of alts.slice(1)) expect(total(a)).toBeGreaterThanOrEqual(elegida - 1e-9);
      g += q.costo;
    });
  });

  it("metaSin quita la materia y lo que depende de ella", () => {
    const b = e1();
    const meta = clavesMeta(b.materias, "malla", "A", []);
    const sin = metaSin(b.materias, meta, "ISW23");
    expect(sin).not.toContain("ISW23");
    expect(sin).not.toContain("ISW28");
    expect(sin).toContain("ISW22");
  });
});
