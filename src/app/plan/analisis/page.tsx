"use client";
import { useEffect, useMemo, useState } from "react";
import { Aviso, Boton, Cargando, Enlace, Pagina, Tarjeta, Titulo } from "@/componentes/ui";
import {
  NOMBRE_PARAMETRO,
  variante,
  variantesSensibilidad,
  type ParametroVariable,
  type Variante,
} from "@/estado/analisis";
import { formatoCosto, formatoEntero, mesesCortos, problemaDe } from "@/estado/derivados";
import { useHidratado } from "@/estado/hidratado";
import { useStore } from "@/estado/store";
import { h } from "@/motor/heuristica";
import { NOMBRE_METODO, type Metodo, type ResultadoMetodo } from "@/motor/metodos";
import { validar } from "@/motor/validacion";
import type { Problema } from "@/motor/tipos";
import { correrLote } from "@/worker/cliente";

const METODOS: Metodo[] = ["anytime", "astar", "wastar2", "uniforme"];
const ms = (x: number | null) =>
  x === null ? "—" : x < 1000 ? `${Math.round(x)} ms` : `${(x / 1000).toFixed(1)} s`;

export default function Analisis() {
  const hidratado = useHidratado();
  const b = useStore((s) => s.borrador);
  const [extras, setExtras] = useState<Variante[]>([]);
  const [parametro, setParametro] = useState<ParametroVariable>("beta");
  const [valor, setValor] = useState("0.3");
  const [elegida, setElegida] = useState<number | null>(null);
  const [calculadas, setCalculadas] = useState<{
    pb: Problema | null;
    datos: Record<string, ResultadoMetodo>;
  }>({
    pb: null,
    datos: {},
  });
  const [comparadas, setComparadas] = useState<{
    pb: Problema | null;
    datos: Partial<Record<Metodo, ResultadoMetodo>>;
  }>({ pb: null, datos: {} });
  const [guardado, setGuardado] = useState<string | null>(null);

  const pb = useMemo(() => problemaDe(b), [b]);
  const errores = useMemo(() => validar(pb), [pb]);
  const variantes = useMemo(
    () => [...variantesSensibilidad(b.parametros), ...extras],
    [b.parametros, extras],
  );

  // Sensibilidad: A* por fila, en el Worker.
  useEffect(() => {
    if (errores.length > 0) return;
    const datos: Record<string, ResultadoMetodo> = {};
    return correrLote(
      variantes.map((v) => ({
        problema: { ...pb, ...v.parametros },
        metodo: "astar" as const,
        tiempoMaxMs: 60_000,
      })),
      (i, r) => {
        datos[variantes[i].etiqueta] = r;
        setCalculadas({ pb, datos: { ...datos } });
      },
    );
  }, [variantes, pb, errores]);

  // Comparación de métodos sobre el escenario actual.
  useEffect(() => {
    if (errores.length > 0) return;
    const datos: Partial<Record<Metodo, ResultadoMetodo>> = {};
    return correrLote(
      METODOS.map((m) => ({ problema: pb, metodo: m, tiempoMaxMs: 60_000 })),
      (i, r) => {
        datos[METODOS[i]] = r;
        setComparadas({ pb, datos: { ...datos } });
      },
    );
  }, [pb, errores]);

  const filas = calculadas.pb === pb ? calculadas.datos : {};
  const metodos = comparadas.pb === pb ? comparadas.datos : {};

  if (!hidratado) return <Cargando />;
  if (errores.length > 0) {
    return (
      <Pagina>
        <Aviso tipo="alerta">
          El escenario actual no pasa la validación.{" "}
          <Enlace href="/plan/meta/">Revisar la meta</Enlace>
        </Aviso>
      </Pagina>
    );
  }

  const base = filas[variantes[0].etiqueta];
  const cambian = variantes.filter((v) => {
    const r = filas[v.etiqueta];
    return !v.base && r && base && r.cuatrimestres !== base.cuatrimestres;
  });
  const indice = elegida ?? Math.max(0, variantes.indexOf(cambian[0] ?? variantes[0]));
  const vElegida = variantes[indice];
  const rElegida = filas[vElegida?.etiqueta ?? ""];

  const lectura = () => {
    if (!base || Object.keys(filas).length < variantes.length) return "Calculando…";
    if (cambian.length === 0) {
      const encarecen = variantes.filter((v) => {
        const r = filas[v.etiqueta];
        return !v.base && r?.costo != null && base.costo != null && r.costo > base.costo + 1e-9;
      });
      return `Ningún cambio de un solo parámetro mueve el egreso: el plan sigue en ${base.cuatrimestres} cuatrimestres.${
        encarecen.length > 0
          ? ` Solo sube el costo por sobrecarga con ${encarecen
              .map((v) => `${v.etiqueta} (${formatoCosto(filas[v.etiqueta].costo!)})`)
              .join(", ")}.`
          : ""
      }`;
    }
    const menos = cambian.filter((v) => filas[v.etiqueta].cuatrimestres! < base.cuatrimestres!);
    const mas = cambian.filter((v) => filas[v.etiqueta].cuatrimestres! > base.cuatrimestres!);
    const partes: string[] = [];
    if (menos.length > 0)
      partes.push(`con ${menos.map((v) => v.etiqueta).join(" o ")} conviene terminar antes`);
    if (mas.length > 0)
      partes.push(`con ${mas.map((v) => v.etiqueta).join(" o ")} el plan se alarga`);
    const sinEfecto = variantes
      .filter((v) => !v.base && !cambian.includes(v))
      .map((v) => v.etiqueta);
    return `Base: ${base.cuatrimestres} cuatrimestres. ${partes.join("; ")}.${
      sinEfecto.length > 0 ? ` No cambian el egreso: ${sinEfecto.join(", ")}.` : ""
    }`;
  };

  const agregar = () => {
    const v = Number(valor);
    if (!Number.isFinite(v)) return;
    const nueva = variante(b.parametros, parametro, v);
    if (!variantes.some((x) => x.etiqueta === nueva.etiqueta)) setExtras((e) => [...e, nueva]);
  };

  const guardarEscenario = () => {
    if (!rElegida?.plan || rElegida.costo === null || !vElegida) return;
    const nb = {
      ...b,
      parametros: vElegida.parametros,
      titulo: `Escenario: ${vElegida.etiqueta}`,
      descripcion: b.titulo,
    };
    const pbE = { ...pb, ...vElegida.parametros };
    useStore.getState().guardarEscenario(
      nb,
      {
        costo: rElegida.costo,
        plan: rElegida.plan,
        pasadas: [],
        optimo: rElegida.fin === "meta",
        garantia: 1,
        hInicio: h(pbE, pbE.inicio.A),
        tiempoMs: rElegida.tiempoMs,
        detenido: false,
      },
      "análisis",
    );
    setGuardado(vElegida.etiqueta);
  };

  return (
    <Pagina>
      <h1 className="text-2xl font-bold sm:text-3xl">¿Qué regla decide cuándo egresas?</h1>
      <p className="mt-1 text-gray-600">
        Escenario: {b.titulo}, {b.nombreMalla}. Cada fila vuelve a buscar el plan óptimo con A*
        cambiando un solo parámetro.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <Tarjeta className="min-w-0">
          <Titulo>Sensibilidad</Titulo>
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left" data-sensibilidad>
              <thead>
                <tr className="border-b border-gray-300 text-gray-600">
                  <th className="px-3 py-2 font-normal">Cambio</th>
                  <th className="px-3 py-2 font-normal">Costo óptimo</th>
                  <th className="px-3 py-2 font-normal">Cuatrimestres</th>
                  <th className="px-3 py-2 font-normal">Créditos de sobrecarga</th>
                </tr>
              </thead>
              <tbody>
                {variantes.map((v, i) => {
                  const r = filas[v.etiqueta];
                  const distinto = r && base && r.cuatrimestres !== base.cuatrimestres;
                  return (
                    <tr
                      key={v.etiqueta}
                      className={`cursor-pointer border-b border-gray-200 hover:bg-gray-50 ${
                        i === indice ? "bg-blue-50" : ""
                      }`}
                      onClick={() => setElegida(i)}
                      data-fila={v.etiqueta}
                    >
                      <td className="px-3 py-3">
                        <button type="button" className="text-left" onClick={() => setElegida(i)}>
                          {v.base ? <strong>{v.etiqueta}</strong> : v.etiqueta}
                        </button>
                      </td>
                      <td className="px-3 py-3" data-costo={r?.costo ?? undefined}>
                        {r ? (r.costo === null ? "no terminó" : formatoCosto(r.costo)) : "…"}
                      </td>
                      <td
                        className={`px-3 py-3 ${
                          distinto
                            ? r.cuatrimestres! > base.cuatrimestres!
                              ? "font-bold text-orange-800"
                              : "font-bold"
                            : ""
                        }`}
                      >
                        {r?.cuatrimestres ?? "…"}
                      </td>
                      <td className="px-3 py-3">{r?.sobrecarga ?? "…"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <Aviso tipo="alerta">
              <strong>Lectura:</strong> {lectura()}
            </Aviso>
          </div>

          {rElegida?.plan && (
            <>
              <div className="mt-8 mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">
                  Plan de {rElegida.plan.length} cuatrimestres con{" "}
                  {vElegida.base ? "los parámetros base" : vElegida.etiqueta}
                </h2>
                <Boton onClick={guardarEscenario} disabled={guardado === vElegida.etiqueta}>
                  {guardado === vElegida.etiqueta ? "Guardado en Inicio" : "Guardar escenario"}
                </Boton>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {rElegida.plan.map((q, i) => (
                  <div key={i} className="rounded-xl border border-gray-200 p-4">
                    <div className="text-sm text-gray-600">
                      {i + 1} · {mesesCortos(q.periodo)}
                    </div>
                    <div>
                      {q.materias.length > 0
                        ? q.materias.map((k) => (
                            <span key={k} className="block leading-snug">
                              <span className="font-mono text-sm text-gray-600">{k}</span>{" "}
                              {b.materias.find((m) => m.clave === k)?.nombre ?? ""}
                            </span>
                          ))
                        : "Sin inscripción"}
                    </div>
                    <div className="font-mono text-sm text-gray-700">
                      {q.creditos} cr · {q.costo.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Tarjeta>

        <div className="space-y-6">
          <Tarjeta>
            <Titulo>Comparación de métodos</Titulo>
            <p className="-mt-2 mb-3 text-sm text-gray-600">
              Escenario actual · {b.materias.length} materias · tiempo máximo 60 s por método
            </p>
            <div className="relative overflow-x-auto">
              <table className="w-full text-left text-sm" data-metodos>
                <thead>
                  <tr className="border-b border-gray-300 text-gray-600">
                    <th className="py-2 pr-2 font-normal">Método</th>
                    <th className="py-2 pr-2 font-normal">Costo</th>
                    <th className="py-2 pr-2 font-normal">Nodos</th>
                    <th className="py-2 pr-2 font-normal">Primer plan</th>
                    <th className="py-2 font-normal">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {METODOS.map((m) => {
                    const r = metodos[m];
                    return (
                      <tr key={m} className="border-b border-gray-200" data-metodo={m}>
                        <td className="py-2 pr-2">
                          {m === "anytime" ? <strong>{NOMBRE_METODO[m]}</strong> : NOMBRE_METODO[m]}
                        </td>
                        <td className="py-2 pr-2">
                          {r ? (r.costo === null ? "no terminó" : formatoCosto(r.costo)) : "…"}
                        </td>
                        <td className="py-2 pr-2">{r ? formatoEntero(r.expansiones) : "…"}</td>
                        <td className="py-2 pr-2">{r ? ms(r.tiempoPrimerPlanMs) : "…"}</td>
                        <td className="py-2">{r ? ms(r.tiempoMs) : "…"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              Anytime A* expande más nodos que A* porque repite la búsqueda en cada pasada, pero
              entrega un plan desde la primera. Weighted A* con H = 2 entrega un solo plan, con
              costo ≤ 2·C*. Costo Uniforme es óptimo pero sin guía.
            </p>
          </Tarjeta>
          <Tarjeta>
            <Titulo>Nuevo escenario</Titulo>
            <label className="block text-sm text-gray-700">
              Parámetro a variar
              <select
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
                value={parametro}
                onChange={(e) => setParametro(e.target.value as ParametroVariable)}
              >
                {(Object.keys(NOMBRE_PARAMETRO) as ParametroVariable[]).map((p) => (
                  <option key={p} value={p}>
                    {NOMBRE_PARAMETRO[p]}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 block text-sm text-gray-700">
              Valor
              <input
                type="number"
                step="any"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </label>
            <Boton variante="primario" className="mt-4 w-full py-3" onClick={agregar}>
              Agregar fila
            </Boton>
          </Tarjeta>
        </div>
      </div>
    </Pagina>
  );
}
