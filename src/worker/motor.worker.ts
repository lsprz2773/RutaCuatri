// Web Worker del motor (D16): la interfaz le manda el problema y recibe eventos.
import { anytime } from "../motor/anytime.ts";
import { correrMetodo } from "../motor/metodos.ts";
import type { Pedido, Respuesta } from "./mensajes.ts";

const enviar = (r: Respuesta) => self.postMessage(r);

self.onmessage = (e: MessageEvent<Pedido>) => {
  const pedido = e.data;
  try {
    if (pedido.tipo === "anytime") {
      anytime(pedido.problema, pedido.pesos, enviar, {
        tiempoMaxMs: pedido.tiempoMaxMs ?? Infinity,
      });
    } else {
      pedido.trabajos.forEach((t, indice) => {
        enviar({
          tipo: "lote-resultado",
          indice,
          resultado: correrMetodo(t.problema, t.metodo, t.tiempoMaxMs),
        });
      });
      enviar({ tipo: "lote-fin" });
    }
  } catch (err) {
    enviar({ tipo: "error", errores: [{ regla: "parametros", mensaje: String(err) }] });
  }
};
