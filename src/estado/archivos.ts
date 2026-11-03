// Descarga e importación de archivos en el navegador (planes .rutacuatri.json y CSV).
"use client";
import { z } from "zod";
import { esquemaMateria, esquemaPeriodo } from "../datos/esquemas.ts";
import type { PlanGuardado } from "./tipos.ts";

export function descargar(nombre: string, contenido: string, tipo = "application/json") {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Abre el selector de archivos y devuelve el texto del archivo elegido. */
export function elegirArchivo(aceptar: string): Promise<string | null> {
  return new Promise((resolver) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = aceptar;
    input.onchange = async () => {
      const f = input.files?.[0];
      resolver(f ? await f.text() : null);
    };
    input.click();
  });
}

const esquemaBorrador = z.object({
  titulo: z.string(),
  descripcion: z.string(),
  mallaId: z.string().nullable(),
  nombreMalla: z.string(),
  planMalla: z.string(),
  especialidades: z.object({ A: z.string(), B: z.string() }),
  materias: z.array(esquemaMateria),
  estados: z.record(z.string(), z.enum(["aprobada", "reprobada", "pendiente"])),
  periodo: esquemaPeriodo,
  meta: z.object({
    tipo: z.enum(["malla", "estadia", "especialidad", "especificas"]),
    especialidad: z.enum(["A", "B"]),
    claves: z.array(z.string()),
  }),
  parametros: z.object({ Cnorm: z.number(), Cmax: z.number(), beta: z.number(), K: z.number() }),
  pesos: z.array(z.number()),
  tiempoMax: z.number().nullable(),
});

const esquemaPlan = z.object({
  id: z.string(),
  fecha: z.string(),
  etiqueta: z.enum(["óptimo", "mejor", "análisis", "sin plan"]),
  borrador: esquemaBorrador,
  // El resultado se vuelve a calcular si hace falta; aquí solo se revisa la forma general.
  resultado: z
    .object({ costo: z.number(), plan: z.array(z.any()) })
    .passthrough()
    .nullable(),
});

/** Acepta un plan suelto o una lista de planes; devuelve null si el archivo no es válido. */
export function leerPlanes(texto: string): PlanGuardado[] | null {
  try {
    const datos = JSON.parse(texto);
    const r = z.union([esquemaPlan, z.array(esquemaPlan)]).safeParse(datos);
    if (!r.success) return null;
    return (Array.isArray(r.data) ? r.data : [r.data]) as PlanGuardado[];
  } catch {
    return null;
  }
}
