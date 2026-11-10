"use client";
// Piezas de interacción compartidas: confirmación en diálogo, aviso con «Deshacer» y campo numérico.
import { useCallback, useEffect, useId, useRef, useState, type ComponentProps } from "react";
import { Boton } from "./ui";

interface Pedido {
  titulo: string;
  texto: string;
  aceptar: string;
  resolver: (ok: boolean) => void;
}

/**
 * Confirmación con <dialog> modal. Devuelve el elemento a renderizar y `pedir`, que abre el
 * diálogo y resuelve true si el usuario acepta. Escape o «Cancelar» resuelven false.
 */
export function useConfirmar() {
  const ref = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();
  const [pedido, setPedido] = useState<Pedido | null>(null);

  useEffect(() => {
    if (pedido && !ref.current?.open) ref.current?.showModal();
  }, [pedido]);

  const pedir = useCallback(
    (o: { titulo: string; texto: string; aceptar: string }) =>
      new Promise<boolean>((resolver) => setPedido({ ...o, resolver })),
    [],
  );

  const cerrar = (ok: boolean) => {
    pedido?.resolver(ok);
    setPedido(null);
    ref.current?.close();
  };

  const dialogo = (
    <dialog
      ref={ref}
      aria-labelledby={idTitulo}
      data-confirmar
      onCancel={(e) => {
        e.preventDefault();
        cerrar(false);
      }}
      className="m-auto w-[min(30rem,calc(100vw-2rem))] rounded-xl p-6 backdrop:bg-black/40"
    >
      {pedido && (
        <>
          <h2 id={idTitulo} className="text-lg font-semibold">
            {pedido.titulo}
          </h2>
          <p className="mt-2 text-gray-700">{pedido.texto}</p>
          <div className="mt-6 flex justify-end gap-3">
            <Boton onClick={() => cerrar(false)}>Cancelar</Boton>
            <Boton variante="peligro" onClick={() => cerrar(true)}>
              {pedido.aceptar}
            </Boton>
          </div>
        </>
      )}
    </dialog>
  );

  return [dialogo, pedir] as const;
}

/** Aviso flotante (abajo, al centro) de una acción ya hecha, con botón para revertirla. */
export function AvisoDeshacer({
  children,
  alDeshacer,
  alCerrar,
}: {
  children: React.ReactNode;
  alDeshacer: () => void;
  alCerrar: () => void;
}) {
  return (
    <div className="no-imprimir pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div
        role="status"
        data-deshacer
        className="pointer-events-auto flex w-full max-w-xl flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-900 px-4 py-3 text-white shadow-lg"
      >
        <span>{children}</span>
        <span className="flex gap-2">
          <button
            type="button"
            className="rounded px-3 py-1 font-semibold text-blue-200 hover:bg-white/10"
            onClick={alDeshacer}
          >
            Deshacer
          </button>
          <button
            type="button"
            aria-label="Cerrar aviso"
            className="rounded px-2 py-1 text-gray-300 hover:bg-white/10"
            onClick={alCerrar}
          >
            ×
          </button>
        </span>
      </div>
    </div>
  );
}

/**
 * Campo numérico que deja borrar y reescribir: mientras se edita guarda el texto y solo aplica
 * valores válidos; al salir del campo vuelve a mostrar el último valor aplicado.
 */
export function CampoNumero({
  valor,
  alCambiar,
  min,
  entero = false,
  className = "",
  ...resto
}: Omit<ComponentProps<"input">, "value" | "onChange" | "type" | "min"> & {
  valor: number;
  alCambiar: (n: number) => void;
  min: number;
  entero?: boolean;
}) {
  const [texto, setTexto] = useState<string | null>(null);
  const valido = (t: string) => {
    if (t.trim() === "") return null;
    const n = Number(t);
    if (!Number.isFinite(n) || n < min || (entero && !Number.isInteger(n))) return null;
    return n;
  };
  const invalido = texto !== null && valido(texto) === null;
  return (
    <input
      {...resto}
      type="number"
      min={min}
      inputMode={entero ? "numeric" : "decimal"}
      aria-invalid={invalido || undefined}
      className={`${className} ${invalido ? "border-red-500" : ""}`}
      value={texto ?? String(valor)}
      onChange={(e) => {
        setTexto(e.target.value);
        const n = valido(e.target.value);
        if (n !== null && n !== valor) alCambiar(n);
      }}
      onBlur={(e) => {
        setTexto(null);
        resto.onBlur?.(e);
      }}
    />
  );
}
