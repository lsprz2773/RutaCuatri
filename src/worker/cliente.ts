// Cliente del Worker: crea uno por búsqueda; Detener = terminate().
"use client";
import type { Pedido, Respuesta, Trabajo } from "./mensajes.ts";
import type { ResultadoMetodo } from "../motor/metodos.ts";

export function crearWorker(alResponder: (r: Respuesta) => void): Worker {
  const w = new Worker(new URL("./motor.worker.ts", import.meta.url), { type: "module" });
  w.onmessage = (e: MessageEvent<Respuesta>) => alResponder(e.data);
  return w;
}

export function enviarPedido(w: Worker, p: Pedido) {
  w.postMessage(p);
}

/** Corre una lista de trabajos y llama a alResultado con cada uno; devuelve la función para cancelar. */
export function correrLote(
  trabajos: Trabajo[],
  alResultado: (indice: number, r: ResultadoMetodo) => void,
  alTerminar: () => void = () => {},
): () => void {
  const w = crearWorker((r) => {
    if (r.tipo === "lote-resultado") alResultado(r.indice, r.resultado);
    else if (r.tipo === "lote-fin" || r.tipo === "error") {
      w.terminate();
      alTerminar();
    }
  });
  enviarPedido(w, { tipo: "lote", trabajos });
  return () => w.terminate();
}
