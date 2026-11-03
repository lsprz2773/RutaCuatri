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
import { anytime } from "../src/motor/index.ts";
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
