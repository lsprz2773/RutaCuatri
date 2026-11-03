// Arranca y detiene la búsqueda Anytime A* en el Worker y refleja los eventos en el store.
"use client";
import { h } from "../motor/heuristica.ts";
import type { ErrorValidacion } from "../motor/tipos.ts";
import { crearWorker, enviarPedido } from "../worker/cliente.ts";
import { problemaDe } from "./derivados.ts";
import { useStore } from "./store.ts";

let worker: Worker | null = null;

export function iniciarBusqueda(alError?: (errores: ErrorValidacion[]) => void) {
  detenerWorker();
  const s = useStore.getState();
  const problema = problemaDe(s.borrador);
  const pesos = [...s.borrador.pesos];
  const hInicio = h(problema, problema.inicio.A);
  s.fijarResultado(null);
  s.fijarBusqueda(() => ({
    estado: "corriendo",
    pasadas: pesos.map((H) => ({ H, estado: "pendiente" as const })),
    mejor: null,
    hInicio,
    inicio: performance.now(),
  }));

  worker = crearWorker((ev) => {
    const st = useStore.getState();
    switch (ev.tipo) {
      case "pasada-inicio":
        st.fijarBusqueda((b) => ({
          ...b,
          pasadas: b.pasadas.map((p, i) => (i === ev.indice ? { ...p, estado: "corriendo" } : p)),
        }));
        break;
      case "plan":
        st.fijarBusqueda((b) => ({
          ...b,
          mejor: { costo: ev.costo, plan: ev.plan, H: ev.H, tiempoMs: ev.tiempoMs },
        }));
        break;
      case "pasada-fin":
        st.fijarBusqueda((b) => ({
          ...b,
          pasadas: b.pasadas.map((p, i) =>
            i === ev.indice ? { ...ev.pasada, estado: "hecha" } : p,
          ),
        }));
        break;
      case "fin":
        detenerWorker();
        if (ev.costo !== null && ev.plan) {
          st.fijarResultado({
            costo: ev.costo,
            plan: ev.plan,
            pasadas: ev.pasadas,
            optimo: ev.optimo,
            garantia: ev.garantia ?? 1,
            hInicio,
            tiempoMs: ev.tiempoMs,
            detenido: false,
          });
          st.guardar(ev.optimo ? "óptimo" : "mejor");
        }
        st.fijarBusqueda((b) => ({ ...b, estado: "terminada" }));
        break;
      case "error":
        detenerWorker();
        st.fijarBusqueda((b) => ({ ...b, estado: "inactiva" }));
        alError?.(ev.errores);
        break;
      default:
        break;
    }
  });
  enviarPedido(worker, {
    tipo: "anytime",
    problema,
    pesos,
    tiempoMaxMs: s.borrador.tiempoMax === null ? null : s.borrador.tiempoMax * 1000,
  });
}

function detenerWorker() {
  worker?.terminate();
  worker = null;
}

/** «Detener y quedarme con el mejor plan»: termina el Worker y conserva el mejor plan con su garantía. */
export function detenerBusqueda() {
  if (!worker) return;
  detenerWorker();
  const st = useStore.getState();
  const b = st.busqueda;
  if (b.mejor) {
    st.fijarResultado({
      costo: b.mejor.costo,
      plan: b.mejor.plan,
      pasadas: b.pasadas
        .filter((p) => p.estado === "hecha")
        .map((p) => ({
          H: p.H,
          costo: p.costo ?? null,
          expansiones: p.expansiones ?? 0,
          generados: p.generados ?? 0,
          memoria: p.memoria ?? 0,
          tiempoMs: p.tiempoMs ?? 0,
          fin: p.fin ?? "tiempo",
        })),
      optimo: false,
      garantia: b.mejor.H,
      hInicio: b.hInicio,
      tiempoMs: performance.now() - b.inicio,
      detenido: true,
    });
    st.guardar("mejor");
  }
  st.fijarBusqueda((x) => ({
    ...x,
    estado: "detenida",
    pasadas: x.pasadas.map((p) => (p.estado === "corriendo" ? { ...p, estado: "pendiente" } : p)),
  }));
}
