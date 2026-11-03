// Datos oficiales de public/datos, validados con Zod al cargar (D17).
import mallasJson from "../../public/datos/mallas.json";
import escenariosJson from "../../public/datos/escenarios.json";
import { esquemaEscenarios, esquemaMallas } from "./esquemas.ts";

export const DATOS_MALLAS = esquemaMallas.parse(mallasJson);
export const ESCENARIOS = esquemaEscenarios.parse(escenariosJson);
export const MALLAS = DATOS_MALLAS.mallas;

export const mallaPorId = (id: string) => MALLAS.find((m) => m.id === id);
export const alumnoPorId = (id: string) => ESCENARIOS.alumnos.find((a) => a.id === id);
