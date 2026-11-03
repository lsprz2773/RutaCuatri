// Esquemas Zod de public/datos (D17).
import { z } from "zod";

export const esquemaPeriodo = z.enum(["Ene", "May", "Sep"]);

export const esquemaMateria = z.object({
  clave: z.string().min(1),
  nombre: z.string().min(1),
  creditos: z.number().int().positive(),
  nivel: z.number().int().min(1),
  prerrequisitos: z.array(z.string()),
  oferta: z.array(esquemaPeriodo),
  tipo: z.enum(["obligatoria", "optativa"]),
  especialidad: z.enum(["A", "B"]).nullable(),
  exclusiva: z.boolean(),
});

export const esquemaMalla = z.object({
  id: z.string(),
  nombre: z.string(),
  plan: z.string(),
  especialidades: z.object({ A: z.string(), B: z.string() }),
  materias: z.array(esquemaMateria),
});

export const esquemaMallas = z.object({
  version: z.string(),
  periodos: z.array(esquemaPeriodo),
  mallas: z.array(esquemaMalla),
});

export const esquemaPerfil = z.object({
  Cnorm: z.number(),
  Cmax: z.number(),
  beta: z.number(),
  K: z.number().int(),
});

export const esquemaEscenarios = z.object({
  perfiles: z.object({ regular: esquemaPerfil, medio_tiempo: esquemaPerfil }),
  alumnos: z.array(
    z.object({
      id: z.string(),
      malla: z.string(),
      tipo: z.string(),
      nombre: z.string(),
      descripcion: z.string(),
      aprobadas: z.array(z.string()),
      periodo_inicio: esquemaPeriodo,
    }),
  ),
  metas: z.array(
    z.object({
      id: z.string(),
      malla: z.string(),
      nombre: z.string(),
      materias: z.array(z.string()),
    }),
  ),
});

export type Malla = z.infer<typeof esquemaMalla>;
export type Escenarios = z.infer<typeof esquemaEscenarios>;
export type Alumno = Escenarios["alumnos"][number];
export type Meta = Escenarios["metas"][number];
export type NombrePerfil = keyof Escenarios["perfiles"];
