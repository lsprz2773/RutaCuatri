import { readFileSync } from "node:fs";
import { esquemaEscenarios, esquemaMallas } from "../src/datos/esquemas.ts";

export const mallas = esquemaMallas.parse(
  JSON.parse(readFileSync("public/datos/mallas.json", "utf-8")),
);
export const escenarios = esquemaEscenarios.parse(
  JSON.parse(readFileSync("public/datos/escenarios.json", "utf-8")),
);
export const casos = JSON.parse(readFileSync("pruebas/casos-prueba.json", "utf-8"));

export const mallaPorId = (id: string) => mallas.mallas.find((m) => m.id === id)!;
export const alumnoPorId = (id: string) => escenarios.alumnos.find((a) => a.id === id)!;
export const metaPorId = (id: string) => escenarios.metas.find((m) => m.id === id)!;
