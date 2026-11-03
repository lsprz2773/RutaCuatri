import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("datos", () => {
  it("existen las 3 mallas de 28 materias", () => {
    const datos = JSON.parse(readFileSync("public/datos/mallas.json", "utf-8"));
    expect(datos.mallas.map((m: { materias: unknown[] }) => m.materias.length)).toEqual([
      28, 28, 28,
    ]);
  });
});
