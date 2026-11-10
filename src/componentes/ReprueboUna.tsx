"use client";
import { useId, useRef, useState } from "react";
import { Boton } from "@/componentes/ui";
import { iniciarBusqueda } from "@/estado/busqueda";
import { useStore } from "@/estado/store";
import { NOMBRES_PERIODO, type Cuatrimestre } from "@/motor/tipos";

/**
 * «Repruebo una»: el alumno cursa el primer cuatrimestre del plan y reprueba una materia.
 * Las demás de ese cuatrimestre pasan a aprobadas, la elegida a reprobada, y se vuelve a buscar
 * desde el periodo siguiente.
 */
export function ReprueboUna({
  actual,
  className = "",
}: {
  actual: Cuatrimestre | undefined;
  className?: string;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();
  const [elegida, setElegida] = useState<string>("");
  const materias = useStore((s) => s.borrador.materias);
  if (!actual || actual.materias.length === 0) return null;

  const replanear = () => {
    if (!elegida) return;
    const st = useStore.getState();
    st.cambiar((b) => {
      for (const k of actual.materias) b.estados[k] = k === elegida ? "reprobada" : "aprobada";
      b.periodo = NOMBRES_PERIODO[(actual.periodo + 1) % 3];
      const nombre = materias.find((m) => m.clave === elegida)?.nombre ?? elegida;
      b.descripcion = `replaneado: reprobó ${nombre}`;
      if (!b.titulo.endsWith(" (replaneado)")) b.titulo = `${b.titulo} (replaneado)`;
    });
    // El replaneo es un escenario nuevo: se guarda aparte y el plan original se conserva.
    st.separar();
    setElegida("");
    dialogo.current?.close();
    iniciarBusqueda();
  };

  return (
    <>
      <Boton className={className} onClick={() => dialogo.current?.showModal()}>
        Repruebo una
      </Boton>
      <dialog
        ref={dialogo}
        aria-labelledby={idTitulo}
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-xl p-6 backdrop:bg-black/40"
      >
        <h2 id={idTitulo} className="text-lg font-semibold">
          ¿Qué materia del cuatrimestre en curso reprobaste?
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Las demás se marcan como aprobadas y el plan se vuelve a calcular desde el periodo
          siguiente.
        </p>
        <fieldset className="mt-4 space-y-2">
          <legend className="sr-only">Materia reprobada</legend>
          {actual.materias.map((k) => (
            <label key={k} className="flex items-center gap-2">
              <input
                type="radio"
                name="reprobada"
                value={k}
                checked={elegida === k}
                onChange={() => setElegida(k)}
              />
              {k} {materias.find((m) => m.clave === k)?.nombre}
            </label>
          ))}
        </fieldset>
        <div className="mt-6 flex justify-end gap-3">
          <Boton onClick={() => dialogo.current?.close()}>Cancelar</Boton>
          <Boton variante="primario" disabled={!elegida} onClick={replanear}>
            Volver a planear
          </Boton>
        </div>
      </dialog>
    </>
  );
}
