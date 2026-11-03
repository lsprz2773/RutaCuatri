"use client";
import { useMemo } from "react";
import { GraficaCreditos } from "@/componentes/GraficaCreditos";
import { ReprueboUna } from "@/componentes/ReprueboUna";
import { TarjetaCuatrimestre } from "@/componentes/TarjetaCuatrimestre";
import {
  Aviso,
  Boton,
  Cabecera,
  Cargando,
  Enlace,
  Pagina,
  Tarjeta,
  Titulo,
} from "@/componentes/ui";
import { descargar } from "@/estado/archivos";
import {
  aniosDelPlan,
  formatoCosto,
  mesesCortos,
  mesesLargos,
  problemaDe,
} from "@/estado/derivados";
import { explicar } from "@/estado/explicacion";
import { useHidratado } from "@/estado/hidratado";
import { useStore } from "@/estado/store";
import type { PlanGuardado } from "@/estado/tipos";
import { NOMBRES_PERIODO } from "@/motor/tipos";

export default function Resultado() {
  const hidratado = useHidratado();
  const b = useStore((s) => s.borrador);
  const resultado = useStore((s) => s.resultado);
  const busqueda = useStore((s) => s.busqueda);
  const idActual = useStore((s) => s.idActual);

  const provisional = !resultado && busqueda.estado === "corriendo" ? busqueda.mejor : null;
  const plan = resultado?.plan ?? provisional?.plan ?? null;
  const costo = resultado?.costo ?? provisional?.costo ?? null;
  const pb = useMemo(() => problemaDe(b), [b]);
  const exp = useMemo(() => (plan ? explicar(pb, plan) : null), [pb, plan]);

  if (!hidratado) return <Cargando />;
  if (!plan || costo === null || !exp) {
    return (
      <Pagina>
        {busqueda.estado === "corriendo" ? (
          <p className="text-gray-700" role="status">
            Calculando el plan…
          </p>
        ) : (
          <Aviso tipo="info">
            Todavía no hay un plan. <Enlace href="/plan/meta/">Ir a la meta y buscar</Enlace>
          </Aviso>
        )}
      </Pagina>
    );
  }

  const anios = aniosDelPlan(pb.inicio.p, plan.length);
  const reprobadas = new Set(Object.keys(b.estados).filter((k) => b.estados[k] === "reprobada"));
  const total = plan.reduce((s, q) => s + q.costo, 0);
  const creditos = plan.reduce((s, q) => s + q.creditos, 0);
  const calidad = resultado?.optimo
    ? "Óptimo"
    : resultado
      ? `Mejor encontrado (costo ≤ ${resultado.garantia} · C*)`
      : "Plan provisional, la búsqueda sigue";
  const sobre =
    exp.sobrecarga === 0 ? "sin sobrecarga" : `${exp.sobrecarga} créditos de sobrecarga`;
  const ultimo = plan.at(-1);
  const termina = ultimo
    ? `termina al cerrar ${mesesLargos(NOMBRES_PERIODO[ultimo.periodo]).toLowerCase()} del año ${anios.at(-1)}`
    : "la meta ya está cumplida";
  const nombreMateria = (k: string) => b.materias.find((m) => m.clave === k)?.nombre ?? k;
  const recursadas = [...reprobadas].filter((k) => plan.some((q) => q.materias.includes(k)));

  const compartir = () => {
    const datos: PlanGuardado = {
      id: idActual ?? "compartido",
      fecha: new Date().toISOString(),
      etiqueta: resultado?.optimo ? "óptimo" : "mejor",
      borrador: b,
      resultado,
    };
    const archivo = b.titulo.toLowerCase().replace(/[^a-z0-9áéíóúñ]+/gi, "-") || "plan";
    descargar(`${archivo}.rutacuatri.json`, JSON.stringify(datos, null, 2));
    setTimeout(() => window.print(), 300);
  };

  const ritmo =
    exp.cadena.length > 0 ? (
      <>
        La cadena {exp.cadena.map((c) => c.nombre).join(" → ")} tiene {exp.L} materias, cada una en
        un cuatrimestre distinto.
      </>
    ) : null;

  return (
    <>
      {/* Pantalla 6: escritorio y tableta */}
      <div className="hidden sm:block print:block">
        <Pagina>
          <Cabecera
            titulo={`Plan de ${b.titulo} · ${plan.length} cuatrimestres · costo ${formatoCosto(costo)}`}
            subtitulo={`${calidad} · ${sobre} · ${termina}`}
            acciones={
              <>
                <Boton onClick={compartir}>Compartir con tutor</Boton>
                <Boton variante="primario" onClick={() => window.print()}>
                  Descargar PDF
                </Boton>
              </>
            }
          />
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <Tarjeta className="min-w-0">
              <Titulo>Cuatrimestres</Titulo>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" data-plan>
                {plan.map((q, i) => (
                  <TarjetaCuatrimestre
                    key={i}
                    n={i + 1}
                    anio={anios[i]}
                    q={q}
                    materias={b.materias}
                    reprobadas={reprobadas}
                    Cnorm={pb.Cnorm}
                    destacada={i === 0}
                  />
                ))}
                <div className="flex flex-col justify-center rounded-xl border border-dashed border-gray-400 p-4">
                  <div className="font-semibold">Egreso</div>
                  <div className="text-gray-600">
                    {creditos} créditos en {plan.length} cuatrimestres
                  </div>
                  <div className="mt-2 font-mono text-sm" data-total>
                    costo total {formatoCosto(total)}
                  </div>
                </div>
              </div>
              <h2 className="mt-8 mb-3 text-lg font-semibold">Créditos por cuatrimestre</h2>
              <GraficaCreditos plan={plan} Cnorm={pb.Cnorm} Cmax={pb.Cmax} />
            </Tarjeta>

            <div className="space-y-6">
              <Tarjeta>
                <Titulo>Por qué son {plan.length} cuatrimestres</Titulo>
                <p className="leading-relaxed text-gray-800">
                  Como mínimo faltan h = max(⌈{exp.R} / {pb.Cmax}⌉, {exp.L}) = {exp.h}{" "}
                  cuatrimestres.{" "}
                  {exp.L >= exp.porCreditos
                    ? ritmo
                    : `Por créditos: faltan ${exp.R} y en un cuatrimestre caben ${pb.Cmax}.`}
                </p>
                {exp.cadena.length > 0 && (
                  <ol className="mt-3 space-y-1 font-mono text-sm">
                    {exp.cadena.map((c, i) => (
                      <li key={c.clave}>
                        {i + 1}. {c.clave} · {c.periodo} año {c.anio} (cuatri {c.cuatrimestre})
                      </li>
                    ))}
                  </ol>
                )}
                {exp.n > exp.h && exp.esperas.length > 0 && (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-gray-700">
                    {exp.esperas.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                )}
                <p className="mt-3 text-gray-600">
                  {exp.n === exp.h
                    ? `El plan alcanza la cota: no puede haber uno con menos cuatrimestres.`
                    : `La oferta por periodo y la carga máxima obligan a ${exp.n - exp.h} cuatrimestre(s) más que la cota.`}{" "}
                  {exp.sobrecarga === 0
                    ? `Las demás materias se acomodan sin pasar de ${pb.Cnorm} créditos, por eso no hay penalización.`
                    : `Se cargan ${exp.sobrecarga} créditos sobre la carga normal: cuestan ${formatoCosto(
                        pb.beta * exp.sobrecarga,
                      )}, menos que un cuatrimestre más.`}
                </p>
              </Tarjeta>
              <Tarjeta className="no-imprimir">
                <Titulo>Siguientes pasos</Titulo>
                <div className="flex flex-col gap-3">
                  {plan.length > 0 && (
                    <Enlace href="/plan/resultado/1/" className="justify-start">
                      Ver detalle del cuatrimestre 1
                    </Enlace>
                  )}
                  <Enlace href="/plan/analisis/" className="justify-start">
                    Probar otra carga o penalización
                  </Enlace>
                  <ReprueboUna actual={plan[0]} className="justify-start" />
                </div>
              </Tarjeta>
            </div>
          </div>
        </Pagina>
      </div>

      {/* Pantalla 10: vista en celular (menos de 640 px) */}
      <div className="flex flex-1 flex-col sm:hidden print:hidden">
        <div className="border-b border-gray-200 bg-white px-4 py-4">
          <div className="text-sm text-gray-600">RutaCuatri · {b.titulo}</div>
          <h1 className="text-2xl font-bold">Tu plan: {plan.length} cuatrimestres</h1>
          <div className="text-gray-600">
            {resultado?.optimo ? "Óptimo" : "Mejor encontrado"} · {sobre} · costo{" "}
            {formatoCosto(costo)}
          </div>
        </div>
        <ol className="flex-1 space-y-3 px-4 py-4 pb-28" data-plan-celular>
          {plan.map((q, i) => {
            const recursa = q.materias.filter((k) => reprobadas.has(k));
            const cabeza = `${i === 0 ? "Siguiente · " : ""}${mesesCortos(q.periodo)} año ${anios[i]} · ${q.creditos} cr${
              recursa.length > 0 ? ` · recursas ${recursa.map(nombreMateria).join(", ")}` : ""
            }`;
            return (
              <li
                key={i}
                className={`rounded-xl p-4 ${
                  i === 0
                    ? "bg-blue-700 text-white"
                    : recursa.length > 0
                      ? "border-2 border-orange-600 bg-orange-50"
                      : "border border-gray-200 bg-white"
                }`}
              >
                <div
                  className={`text-sm ${i === 0 ? "text-blue-100" : recursa.length > 0 ? "font-semibold text-orange-800" : "text-gray-600"}`}
                >
                  {cabeza}
                </div>
                <div className={`mt-1 ${i === 0 ? "font-semibold" : ""}`}>
                  {q.materias.length > 0
                    ? q.materias.map(nombreMateria).join(", ")
                    : "Sin inscripción"}
                </div>
              </li>
            );
          })}
          {exp.cadena.length > 0 && (
            <li className="rounded-xl border border-gray-200 bg-white p-4 leading-relaxed">
              <strong>Lo que marca tu ritmo:</strong>{" "}
              {recursadas.length > 0 ? `${nombreMateria(recursadas[0])} se recursa y ` : ""}
              la cadena de {exp.L} materias hasta {exp.cadena.at(-1)?.nombre} necesita {exp.L}{" "}
              cuatrimestres distintos.
            </li>
          )}
        </ol>
        <div className="fixed inset-x-0 bottom-0 grid grid-cols-2 gap-3 border-t border-gray-200 bg-white p-4">
          <ReprueboUna actual={plan[0]} className="w-full py-3" />
          <Boton variante="primario" className="w-full py-3" onClick={() => window.print()}>
            Descargar PDF
          </Boton>
        </div>
      </div>
    </>
  );
}
