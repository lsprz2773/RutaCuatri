import { describe, expect, it } from "vitest";
import {
  aEstrella,
  anytime,
  h,
  sucesores,
  validar,
  estadosDelPlan,
  type Problema,
} from "../src/motor/index.ts";
import { problemaAlAzar } from "./azar.ts";

const TOL = 1e-9;
const MALLAS = 200;

const desde = (pb: Problema, A: number, p: 0 | 1 | 2): Problema => ({ ...pb, inicio: { A, p } });

describe(`propiedades en ${MALLAS} mallas al azar de 8 a 11 materias`, () => {
  const problemas = Array.from({ length: MALLAS }, (_, i) => problemaAlAzar(1000 + i));

  it("todas pasan la validación y tienen plan", () => {
    for (const pb of problemas) {
      expect(validar(pb)).toEqual([]);
      expect(aEstrella(pb).costo).not.toBeNull();
    }
  });

  it("el costo con poda (D06 a D08) es igual al costo sin poda", () => {
    for (const pb of problemas) {
      const con = aEstrella(pb).costo!;
      const sin = aEstrella(pb, undefined, { reglas: false }).costo!;
      expect(Math.abs(con - sin)).toBeLessThan(TOL);
    }
  });

  it("h nunca supera el costo real", () => {
    for (const pb of problemas) {
      const r = aEstrella(pb);
      expect(h(pb, pb.inicio.A)).toBeLessThanOrEqual(r.costo! + TOL);
      // A lo largo del plan óptimo y desde cada sucesor del inicio.
      const estados = estadosDelPlan(pb, r.plan!);
      let resto = r.costo!;
      estados.forEach((e, i) => {
        expect(h(pb, e.A)).toBeLessThanOrEqual(resto + TOL);
        if (i < r.plan!.length) resto -= r.plan![i].costo;
      });
      for (const s of sucesores(pb, pb.inicio.A, pb.inicio.p, false).slice(0, 6)) {
        const real = aEstrella(desde(pb, s.A, s.p)).costo!;
        expect(h(pb, s.A)).toBeLessThanOrEqual(real + TOL);
      }
    }
  });

  it("h es consistente: h(A) ≤ c(S) + h(A ∪ S) en cada transición", () => {
    for (const pb of problemas) {
      // Recorrido en anchura de los estados alcanzables, sin poda, hasta 300 estados por malla.
      const vistos = new Set<number>();
      const cola: [number, 0 | 1 | 2][] = [[pb.inicio.A, pb.inicio.p]];
      while (cola.length > 0 && vistos.size < 300) {
        const [A, p] = cola.shift()!;
        if (vistos.has(A * 3 + p)) continue;
        vistos.add(A * 3 + p);
        const hA = h(pb, A);
        for (const s of sucesores(pb, A, p, false)) {
          expect(hA).toBeLessThanOrEqual(s.costo + h(pb, s.A) + TOL);
          cola.push([s.A, s.p]);
        }
      }
    }
  });

  it("cada pasada de anytime cumple costo ≤ H·C*", () => {
    for (const pb of problemas) {
      const optimo = aEstrella(pb).costo!;
      const r = anytime(pb, undefined, undefined, { tiempoMaxMs: Infinity });
      expect(Math.abs(r.costo! - optimo)).toBeLessThan(TOL);
      for (const p of r.pasadas)
        if (p.costo !== null) expect(p.costo).toBeLessThanOrEqual(p.H * optimo + TOL);
    }
  });
});
