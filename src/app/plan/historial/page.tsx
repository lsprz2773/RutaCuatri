"use client";
import { useMemo, useState } from "react";
import { Aviso, Boton, Cabecera, Cargando, Dato, Enlace, Pagina, Tarjeta } from "@/componentes/ui";
import { importarKardexCsv } from "@/datos/csv";
import { elegirArchivo } from "@/estado/archivos";
import { mesesLargos, nombrePeriodo, problemaDe } from "@/estado/derivados";
import { useHidratado } from "@/estado/hidratado";
import { useStore } from "@/estado/store";
import type { EstadoMateria } from "@/estado/tipos";
import { detalleH } from "@/motor/heuristica";
import { clavesDe } from "@/motor/problema";
import { disponibles } from "@/motor/sucesores";
import { validarKardex, validarMalla } from "@/motor/validacion";
import { NOMBRES_PERIODO, type NombrePeriodo } from "@/motor/tipos";

const SIGUIENTE: Record<EstadoMateria, EstadoMateria> = {
  pendiente: "aprobada",
  aprobada: "reprobada",
  reprobada: "pendiente",
};

export default function Historial() {
  const hidratado = useHidratado();
  const b = useStore((s) => s.borrador);
  const cambiar = useStore((s) => s.cambiar);
  const [avisos, setAvisos] = useState<string[]>([]);

  const datos = useMemo(() => {
    if (validarMalla(b.materias).length > 0) return null;
    const pb = problemaDe(b);
    const errores = validarKardex(pb);
    const disp = disponibles(pb, pb.inicio.A, pb.inicio.p);
    const det = detalleH(pb, pb.inicio.A);
    return { pb, errores, disp: new Set(clavesDe(b.materias, disp)), det };
  }, [b]);

  if (!hidratado) return <Cargando />;
  if (!datos || b.materias.length === 0) {
    return (
      <Pagina>
        <Aviso tipo="alerta">
          Primero completa un plan de estudios válido.{" "}
          <Enlace href="/plan/malla/">Ir al plan de estudios</Enlace>
        </Aviso>
      </Pagina>
    );
  }

  const estado = (k: string): EstadoMateria => b.estados[k] ?? "pendiente";
  const aprobadas = b.materias.filter((m) => estado(m.clave) === "aprobada");
  const pendientes = b.materias.filter((m) => estado(m.clave) !== "aprobada");
  const conError = new Set(datos.errores.map((e) => e.clave));
  const suma = (ms: typeof b.materias) => ms.reduce((s, m) => s + m.creditos, 0);
  const reprobadas = b.materias.filter((m) => estado(m.clave) === "reprobada");
  const corto = nombrePeriodo(b.periodo).slice(0, 3);

  const importar = async () => {
    const texto = await elegirArchivo(".csv,text/csv");
    if (texto === null) return;
    const r = importarKardexCsv(
      texto,
      b.materias.map((m) => m.clave),
    );
    setAvisos(r.errores);
    cambiar((x) => {
      x.estados = { ...x.estados, ...r.datos };
    });
  };

  return (
    <Pagina>
      <Cabecera
        titulo={`Historial de ${b.titulo}`}
        subtitulo={`${b.nombreMalla}${b.planMalla ? ` · plan ${b.planMalla}` : ""} · marca cada materia como aprobada, reprobada o pendiente`}
        acciones={
          <>
            <Boton onClick={importar}>Importar kárdex</Boton>
            {datos.errores.length > 0 ? (
              <Boton variante="primario" disabled>
                Continuar a meta
              </Boton>
            ) : (
              <Enlace variante="primario" href="/plan/meta/">
                Continuar a meta
              </Enlace>
            )}
          </>
        }
      />

      {avisos.length > 0 && (
        <div className="mb-6">
          <Aviso tipo="error">
            <ul className="list-disc pl-5">
              {avisos.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </Aviso>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Tarjeta className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Materias</h2>
            <div className="flex flex-wrap gap-4 text-sm text-gray-700">
              <span className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded bg-blue-700" /> Aprobada
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded border-2 border-orange-600" /> Reprobada
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded border border-gray-300" /> Pendiente
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded border-2 border-dashed border-blue-700" />{" "}
                Disponible en {corto}
              </span>
            </div>
          </div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <label htmlFor="nombre" className="text-sm text-gray-700">
              Nombre del alumno
            </label>
            <input
              id="nombre"
              className="rounded-lg border border-gray-300 px-3 py-1.5"
              value={b.titulo}
              onChange={(e) => cambiar((x) => void (x.titulo = e.target.value))}
            />
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {b.materias.map((m) => {
              const e = estado(m.clave);
              const disponible = e !== "aprobada" && datos.disp.has(m.clave);
              const error = conError.has(m.clave);
              const estilo = error
                ? "border-2 border-red-600 bg-red-50"
                : e === "aprobada"
                  ? "bg-blue-700 text-white border border-blue-700"
                  : e === "reprobada"
                    ? "border-2 border-orange-600 bg-orange-50"
                    : disponible
                      ? "border-2 border-dashed border-blue-700 bg-white"
                      : "border border-gray-300 bg-white";
              return (
                <li key={m.clave}>
                  <button
                    type="button"
                    data-clave={m.clave}
                    data-estado={e}
                    aria-label={`${m.clave} ${m.nombre}: ${e}. Cambiar a ${SIGUIENTE[e]}`}
                    onClick={() => cambiar((x) => void (x.estados[m.clave] = SIGUIENTE[e]))}
                    className={`h-full w-full rounded-lg p-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${estilo}`}
                  >
                    <div className="leading-snug">
                      <strong>{m.clave}</strong> {m.nombre}
                    </div>
                    <div
                      className={`mt-1 text-sm ${
                        e === "aprobada" && !error
                          ? "text-blue-100"
                          : e === "reprobada"
                            ? "font-semibold text-orange-800"
                            : "text-gray-600"
                      }`}
                    >
                      {error
                        ? "Aprobada sin sus prerrequisitos"
                        : e === "reprobada"
                          ? `Reprobada · se abre en ${m.oferta.join(", ") || "ningún periodo"}`
                          : `${e[0].toUpperCase()}${e.slice(1)} · ${m.creditos} cr`}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-6">
            <label htmlFor="periodo" className="block text-sm text-gray-700">
              Siguiente periodo de inscripción
            </label>
            <select
              id="periodo"
              className="mt-1 w-full max-w-sm rounded-lg border border-gray-300 bg-white px-3 py-2"
              value={b.periodo}
              onChange={(e) => cambiar((x) => void (x.periodo = e.target.value as NombrePeriodo))}
            >
              {NOMBRES_PERIODO.map((p) => (
                <option key={p} value={p}>
                  {mesesLargos(p)}
                </option>
              ))}
            </select>
          </div>
        </Tarjeta>

        <Tarjeta className="h-fit">
          <h2 className="mb-4 text-lg font-semibold">Estado inicial</h2>
          <div className="grid grid-cols-2 gap-3">
            <Dato titulo="Aprobadas" valor={`${aprobadas.length} · ${suma(aprobadas)} cr`} />
            <Dato titulo="Faltan" valor={`${pendientes.length} · ${suma(pendientes)} cr`} />
          </div>
          <div className="mt-3 rounded-lg bg-gray-100 p-4 font-mono text-sm break-words">
            A₀ = {"{"}
            {aprobadas.map((m) => m.clave).join(", ")}
            {"}"}
            <br />
            p₀ = {nombrePeriodo(b.periodo)}
          </div>
          {datos.errores.length > 0 && (
            <div className="mt-3 space-y-2">
              {datos.errores.map((e) => (
                <Aviso key={e.mensaje} tipo="error">
                  {e.mensaje}
                </Aviso>
              ))}
            </div>
          )}
          <h3 className="mt-4 font-semibold">Disponibles en {nombrePeriodo(b.periodo)}</h3>
          <p className="mt-1 text-gray-700">
            {datos.disp.size === 0
              ? "Ninguna."
              : b.materias
                  .filter((m) => datos.disp.has(m.clave))
                  .map((m) => `${m.clave} ${m.nombre}`)
                  .join(", ")}
          </p>
          {reprobadas.map((m) => (
            <div className="mt-3" key={m.clave}>
              <Aviso tipo="alerta">
                <strong>{m.nombre} se recursa.</strong> {m.clave} se abre en{" "}
                {m.oferta.join(", ") || "ningún periodo"}
                {datos.det.cadena.length > 0 &&
                datos.det.cadena.some((i) => b.materias[i].clave === m.clave)
                  ? ` y está en la cadena más larga: ${datos.det.cadena.map((i) => b.materias[i].clave).join(" → ")}.`
                  : "."}
              </Aviso>
            </div>
          ))}
          <p className="mt-3 text-sm text-gray-600">
            Cota inicial para la meta actual: h = max(⌈{datos.det.R} / {b.parametros.Cmax}⌉,{" "}
            {datos.det.L}) = {datos.det.h} cuatrimestres como mínimo.
          </p>
        </Tarjeta>
      </div>
    </Pagina>
  );
}
