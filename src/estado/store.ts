// Store de la interfaz con Zustand; el borrador y los planes guardados persisten en localStorage.
"use client";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { borradorVacio } from "./derivados.ts";
import type { Borrador, EstadoBusqueda, PlanGuardado, ResultadoPlan } from "./tipos.ts";

export const CLAVE_ALMACEN = "rutacuatri:v1";
export const MAX_GUARDADOS = 20;

export interface Store {
  borrador: Borrador;
  resultado: ResultadoPlan | null;
  /** Id del plan guardado que corresponde al borrador actual; editar el borrador lo conserva. */
  idActual: string | null;
  guardados: PlanGuardado[];
  busqueda: EstadoBusqueda;
  cambiar: (f: (b: Borrador) => void) => void;
  reemplazar: (b: Borrador, resultado?: ResultadoPlan | null, id?: string | null) => void;
  /** Hace que el siguiente guardado cree un plan aparte en lugar de actualizar el actual. */
  separar: () => void;
  fijarResultado: (r: ResultadoPlan | null) => void;
  fijarBusqueda: (f: (e: EstadoBusqueda) => EstadoBusqueda) => void;
  guardar: (etiqueta: PlanGuardado["etiqueta"]) => void;
  /** Guarda otro escenario (por ejemplo, una fila del análisis) sin cambiar el borrador actual. */
  guardarEscenario: (b: Borrador, r: ResultadoPlan, etiqueta: PlanGuardado["etiqueta"]) => void;
  borrarGuardado: (id: string) => void;
  importarGuardados: (planes: PlanGuardado[]) => void;
}

export const busquedaInactiva = (): EstadoBusqueda => ({
  estado: "inactiva",
  pasadas: [],
  mejor: null,
  hInicio: 0,
  inicio: 0,
});

const nuevoId = () => `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      borrador: borradorVacio(),
      resultado: null,
      idActual: null,
      guardados: [],
      busqueda: busquedaInactiva(),
      cambiar: (f) =>
        set((s) => {
          const b = structuredClone(s.borrador);
          f(b);
          // Cualquier cambio invalida el resultado anterior; el plan guardado se actualiza al
          // terminar la siguiente búsqueda (no se duplica).
          return { borrador: b, resultado: null };
        }),
      reemplazar: (b, resultado = null, id = null) =>
        set({
          borrador: structuredClone(b),
          resultado,
          idActual: id,
          busqueda: busquedaInactiva(),
        }),
      separar: () => set({ idActual: null }),
      fijarResultado: (r) => set({ resultado: r }),
      fijarBusqueda: (f) => set((s) => ({ busqueda: f(s.busqueda) })),
      guardar: (etiqueta) => {
        const s = get();
        const id = s.idActual ?? nuevoId();
        const plan: PlanGuardado = {
          id,
          fecha: new Date().toISOString(),
          etiqueta,
          borrador: structuredClone(s.borrador),
          resultado: s.resultado,
        };
        const resto = s.guardados.filter((g) => g.id !== id);
        set({ idActual: id, guardados: [plan, ...resto].slice(0, MAX_GUARDADOS) });
      },
      guardarEscenario: (b, r, etiqueta) =>
        set((s) => ({
          guardados: [
            {
              id: nuevoId(),
              fecha: new Date().toISOString(),
              etiqueta,
              borrador: structuredClone(b),
              resultado: r,
            },
            ...s.guardados,
          ].slice(0, MAX_GUARDADOS),
        })),
      borrarGuardado: (id) => set((s) => ({ guardados: s.guardados.filter((g) => g.id !== id) })),
      importarGuardados: (planes) =>
        set((s) => {
          const ids = new Set(planes.map((p) => p.id));
          return {
            guardados: [...planes, ...s.guardados.filter((g) => !ids.has(g.id))].slice(
              0,
              MAX_GUARDADOS,
            ),
          };
        }),
    }),
    {
      name: CLAVE_ALMACEN,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        borrador: s.borrador,
        resultado: s.resultado,
        idActual: s.idActual,
        guardados: s.guardados,
      }),
    },
  ),
);
