"use client";
import { useEffect, useState } from "react";
import { Aviso, Boton, Cargando, Enlace, Pagina, Tarjeta, Titulo } from "@/componentes/ui";
import { detenerBusqueda } from "@/estado/busqueda";
import { formatoCosto, formatoEntero } from "@/estado/derivados";
import { useHidratado } from "@/estado/hidratado";
import { useStore } from "@/estado/store";
import type { PasadaEnVivo } from "@/estado/tipos";

function useReloj(activo: boolean, inicio: number) {
  const [ahora, setAhora] = useState(0);
  useEffect(() => {
    if (!activo) return;
    const t = setInterval(() => setAhora(performance.now() - inicio), 100);
    return () => clearInterval(t);
  }, [activo, inicio]);
  return ahora;
}

export default function Busqueda() {
  const hidratado = useHidratado();
  const busqueda = useStore((s) => s.busqueda);
  const resultado = useStore((s) => s.resultado);
  const corriendo = busqueda.estado === "corriendo";
  const reloj = useReloj(corriendo, busqueda.inicio);

  if (!hidratado) return <Cargando />;

  // Sin búsqueda en esta sesión: se muestran las pasadas del resultado guardado.
  const pasadas: PasadaEnVivo[] =
    busqueda.estado !== "inactiva"
      ? busqueda.pasadas
      : (resultado?.pasadas.map((p) => ({ ...p, estado: "hecha" as const })) ?? []);
  const mejor = busqueda.estado !== "inactiva" ? busqueda.mejor : resultado;
  const hInicio = busqueda.estado !== "inactiva" ? busqueda.hInicio : (resultado?.hInicio ?? 0);
  const terminada =
    busqueda.estado === "terminada" || (busqueda.estado === "inactiva" && resultado !== null);
  const optimo = terminada && (resultado?.optimo ?? false);
  const hechas = pasadas.filter((p) => p.estado === "hecha").length;
  const actual = pasadas.findIndex((p) => p.estado === "corriendo");

  if (pasadas.length === 0 && !mejor) {
    return (
      <Pagina>
        <Aviso tipo="info">
          Todavía no hay búsqueda. Define la meta y los parámetros y presiona «Buscar plan».{" "}
          <Enlace href="/plan/meta/">Ir a la meta</Enlace>
        </Aviso>
      </Pagina>
    );
  }

  const costoMejor = mejor ? formatoCosto(mejor.costo) : null;
  const primera = pasadas.findIndex((p) => p.costo !== null && p.costo !== undefined);
  const mejoras = pasadas.flatMap((p) =>
    p.costo !== null && p.costo !== undefined ? [formatoCosto(p.costo)] : [],
  );
  const estadoTexto = corriendo
    ? `Buscando · pasada ${actual + 1} de ${pasadas.length}`
    : busqueda.estado === "detenida"
      ? `Búsqueda detenida · ${hechas} de ${pasadas.length} pasadas`
      : `Búsqueda terminada · ${hechas} de ${pasadas.length} pasadas`;

  const resultadoDe = (p: PasadaEnVivo, i: number) => {
    if (p.estado === "pendiente") return busqueda.estado === "detenida" ? "no corrió" : "pendiente";
    if (p.estado === "corriendo") return "buscando…";
    if (p.costo !== null && p.costo !== undefined)
      return <strong>plan de {formatoCosto(p.costo)}</strong>;
    if (p.fin === "limite") return "cortada a 200,000 expansiones";
    if (p.fin === "tiempo") return "cortada por tiempo";
    return i === 0 ? "sin plan" : "sin mejora";
  };

  return (
    <Pagina>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          <section
            className="flex flex-col gap-4 rounded-xl border-2 border-blue-700 bg-white p-6 md:flex-row md:items-center md:justify-between"
            aria-live="polite"
          >
            <div>
              <div
                className="text-sm font-semibold text-blue-800"
                data-estado-busqueda={busqueda.estado}
              >
                {estadoTexto}
              </div>
              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                {mejor
                  ? `${optimo ? "Plan óptimo" : "Mejor plan hasta ahora"}: ${mejor.plan.length} cuatrimestres, costo ${costoMejor}`
                  : "Buscando el primer plan…"}
              </h1>
              <p className="mt-2 max-w-2xl text-gray-600">
                {optimo && mejor
                  ? mejoras.length > 1
                    ? `Cada pasada que encontró algo mejoró el plan: ${mejoras.join(" → ")}. La última, con H = 1, equivale a A*: eso prueba que ${costoMejor} es el óptimo.`
                    : `La pasada ${primera + 1} ya encontró el plan de ${costoMejor}${
                        primera < hechas - 1
                          ? "; las siguientes no hallaron nada con g + h menor"
                          : ""
                      }, y la última, con H = 1, equivale a A*: eso prueba que ${costoMejor} es el óptimo.`
                  : busqueda.estado === "detenida" && mejor
                    ? `Se detuvo la búsqueda; el plan conserva la garantía de su pasada: costo ≤ ${
                        resultado?.garantia ?? busqueda.mejor?.H
                      } · C*.`
                    : corriendo
                      ? `Tiempo: ${(reloj / 1000).toFixed(1)} s. Puedes ver el mejor plan en cuanto aparezca.`
                      : ""}
              </p>
            </div>
            {mejor && (
              <Enlace variante="primario" href="/plan/resultado/" className="px-6 py-3 text-base">
                Ver plan
              </Enlace>
            )}
          </section>

          <Tarjeta>
            <Titulo>Pasadas</Titulo>
            <div className="relative overflow-x-auto">
              <table className="w-full min-w-[34rem] text-left" data-tabla-pasadas>
                <thead>
                  <tr className="border-b border-gray-300 text-gray-600">
                    <th className="px-3 py-2 font-normal">Pasada</th>
                    <th className="px-3 py-2 font-normal">Peso H</th>
                    <th className="px-3 py-2 font-normal">Nodos expandidos</th>
                    <th className="px-3 py-2 font-normal">Resultado</th>
                    <th className="px-3 py-2 font-normal">Garantía</th>
                  </tr>
                </thead>
                <tbody>
                  {pasadas.map((p, i) => {
                    const ultimaOptima = optimo && p.H === 1 && p.estado === "hecha";
                    return (
                      <tr
                        key={i}
                        className={`border-b border-gray-200 ${ultimaOptima ? "bg-blue-50" : ""}`}
                      >
                        <td className="px-3 py-3">{i + 1}</td>
                        <td className="px-3 py-3 font-mono">{p.H}</td>
                        <td className="px-3 py-3">
                          {p.expansiones !== undefined ? formatoEntero(p.expansiones) : "—"}
                        </td>
                        <td className="px-3 py-3">{resultadoDe(p, i)}</td>
                        <td className="px-3 py-3">
                          {ultimaOptima ? (
                            <strong>{costoMejor} es óptimo</strong>
                          ) : (
                            `costo ≤ ${p.H} · C*`
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-sm text-gray-600">Intervalo del costo óptimo C*</div>
            <div className="mt-1 flex justify-between rounded-lg bg-blue-50 px-4 py-3 font-mono text-sm">
              <span>
                {optimo ? costoMejor : hInicio} = {optimo ? "C*" : "h(inicio)"}
              </span>
              <strong>{costoMejor ?? "∞"} = mejor plan</strong>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {optimo
                ? `La pasada con H = 1 cerró el intervalo en ${costoMejor}.`
                : `El óptimo está entre ${hInicio} y ${costoMejor ?? "∞"}; se cierra cuando termina la pasada con H = 1.`}
            </p>
          </Tarjeta>
        </div>

        <div className="space-y-6">
          <Tarjeta>
            <Titulo>Mientras busca</Titulo>
            <div>
              {corriendo
                ? `Pasada ${actual + 1} de ${pasadas.length} · H = ${pasadas[actual]?.H}`
                : `${hechas} de ${pasadas.length} pasadas`}
            </div>
            <div
              className="mt-2 h-3 overflow-hidden rounded-full bg-gray-200"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={pasadas.length}
              aria-valuenow={hechas}
            >
              <div
                className="h-full bg-blue-700 transition-all"
                style={{ width: `${(100 * hechas) / Math.max(1, pasadas.length)}%` }}
              />
            </div>
            <p className="mt-3 text-gray-600">
              {mejor
                ? `Mejor plan disponible: ${costoMejor}. El estudiante puede verlo desde que aparece.`
                : "Todavía no hay plan."}
            </p>
            <Boton className="mt-4 w-full py-3" onClick={detenerBusqueda} disabled={!corriendo}>
              Detener y quedarme con el mejor plan
            </Boton>
          </Tarjeta>
          <Tarjeta>
            <Titulo>Qué hace cada pasada</Titulo>
            <ul className="list-disc space-y-2 pl-5 text-gray-800">
              <li>Ordena la frontera por f = g + H · h: con H alto corre hacia la meta.</li>
              <li>Descarta todo estado con g + h ≥ mejor costo, porque no puede mejorarlo.</li>
              <li>Si encuentra un plan más barato, lo reemplaza; la siguiente pasada baja H.</li>
            </ul>
          </Tarjeta>
        </div>
      </div>
    </Pagina>
  );
}
