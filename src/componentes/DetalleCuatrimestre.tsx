"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Aviso, Cargando, Pagina, Tarjeta, Titulo } from "@/componentes/ui";
import { alternativas, habilita } from "@/estado/analisis";
import { aniosDelPlan, formatoCosto, mesesLargos, problemaDe } from "@/estado/derivados";
import { explicar } from "@/estado/explicacion";
import { useHidratado } from "@/estado/hidratado";
import { useStore } from "@/estado/store";
import { detalleH } from "@/motor/heuristica";
import { estadosDelPlan, indices } from "@/motor/problema";
import { elegibles } from "@/motor/sucesores";
import { NOMBRES_PERIODO } from "@/motor/tipos";
import { correrLote } from "@/worker/cliente";

const TOL = 1e-9;
const FILAS = 8;

/** Pantalla 7: qué se inscribe en el cuatrimestre n, qué se pospone y qué pasaría con otra elección. */
export function DetalleCuatrimestre({ n }: { n: number }) {
  const hidratado = useHidratado();
  const b = useStore((s) => s.borrador);
  const resultado = useStore((s) => s.resultado);
  const pb = useMemo(() => problemaDe(b), [b]);
  const plan = resultado?.plan;
  const valido = !!plan && n >= 1 && n <= plan.length;

  const datos = useMemo(() => {
    if (!plan || !valido) return null;
    const estados = estadosDelPlan(pb, plan);
    const { A, p } = estados[n - 1];
    const g = plan.slice(0, n - 1).reduce((s, q) => s + q.costo, 0);
    const alts = alternativas(pb, plan, n);
    const disp = indices(elegibles(pb, A, p)).map((i) => pb.materias[i]);
    const despues = estados[n];
    return { A, p, g, alts, disp, despues, hDespues: detalleH(pb, despues.A) };
  }, [pb, plan, n, valido]);

  // Costo total de cada alternativa: g + c(S) + A* desde el estado que deja (en el Worker).
  const [totales, setTotales] = useState<(number | null | undefined)[]>([]);
  useEffect(() => {
    if (!datos) return;
    const trabajos = datos.alts.map((a) => ({
      problema: { ...pb, inicio: a.despues },
      metodo: "astar" as const,
      tiempoMaxMs: 20_000,
    }));
    const acumulados: (number | null | undefined)[] = datos.alts.map(() => undefined);
    return correrLote(trabajos, (i, r) => {
      acumulados[i] = r.costo === null ? null : datos.g + datos.alts[i].costo + r.costo;
      setTotales([...acumulados]);
    });
  }, [datos, pb]);

  if (!hidratado) return <Cargando />;
  if (!plan || !datos) {
    return (
      <Pagina>
        <Aviso tipo="info">
          No hay un cuatrimestre {n} en el plan actual.{" "}
          <Link href="/plan/resultado/">Volver al plan</Link>
        </Aviso>
      </Pagina>
    );
  }

  const q = plan[n - 1];
  const anio = aniosDelPlan(pb.inicio.p, plan.length)[n - 1];
  const inscritas = new Set(q.materias);
  const creditosDisp = datos.disp.reduce((s, m) => s + m.creditos, 0);
  const listos = totales.filter((t) => t !== undefined).length;
  const elegidaTotal = totales[0];

  // Orden: la elegida primero; luego por costo total y avance; se muestran hasta 8 filas.
  const filas = datos.alts
    .map((a, i) => ({ a, total: totales[i] ?? null }))
    .sort((x, y) => {
      if (x.a.elegida) return -1;
      if (y.a.elegida) return 1;
      const tx = x.total ?? Infinity;
      const ty = y.total ?? Infinity;
      return tx !== ty ? tx - ty : y.a.creditos - x.a.creditos;
    });
  const especiales = filas.filter((f) => f.a.S === 0 || f.a.etiqueta.startsWith("Todas"));
  const comunes = filas.filter((f) => !especiales.includes(f));
  const visibles = [...comunes.slice(0, FILAS - especiales.length), ...especiales];

  const comentario = (total: number | null, cr: number, S: number, elegida: boolean) => {
    if (elegida) return "elegida";
    if (total === null || elegidaTotal === null || elegidaTotal === undefined) return "calculando…";
    if (total > elegidaTotal + TOL) return <span className="text-orange-800">peor</span>;
    if (total < elegidaTotal - TOL)
      return <span className="font-semibold text-red-700">mejor</span>;
    if (S === 0) return "empate, sin avance";
    return cr < q.creditos ? "empate, menos avance" : "empate";
  };

  const exp = explicar(pb, plan);
  const enCadena = exp.cadena.filter((c) => c.cuatrimestre === n).map((c) => c.nombre);
  const empates = visibles.filter(
    (f) =>
      !f.a.elegida &&
      f.total !== null &&
      elegidaTotal != null &&
      Math.abs(f.total - elegidaTotal) < TOL,
  ).length;
  const pospuestas = datos.disp.filter((m) => !inscritas.has(m.clave));
  const hd = datos.hDespues;
  const gDespues = datos.g + q.costo;

  return (
    <Pagina>
      <Link href="/plan/resultado/" className="text-blue-700 underline">
        Volver al plan
      </Link>
      <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
        Cuatrimestre {n} · {mesesLargos(NOMBRES_PERIODO[q.periodo]).toLowerCase()} · año {anio}
      </h1>
      <p className="mt-1 text-gray-600">
        Había {datos.disp.length} materias disponibles con {creditosDisp} créditos; el plan inscribe{" "}
        {q.materias.length} con {q.creditos}.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Tarjeta className="min-w-0">
          <Titulo>Materias disponibles en este periodo</Titulo>
          {datos.disp.length === 0 && (
            <p className="text-gray-600">
              Ninguna materia necesaria se abre en este periodo: el cuatrimestre queda vacío.
            </p>
          )}
          <ul className="grid gap-3 md:grid-cols-2">
            {datos.disp.map((m) => {
              const sig = habilita(pb.materias, m.clave);
              const dentro = inscritas.has(m.clave);
              return (
                <li
                  key={m.clave}
                  className={`rounded-xl p-4 ${dentro ? "bg-blue-700 text-white" : "border border-dashed border-gray-400 bg-white"}`}
                >
                  <div className="font-semibold">
                    {m.clave} {m.nombre} · {m.creditos} cr
                  </div>
                  <div className={dentro ? "text-blue-100" : "text-gray-600"}>
                    {dentro ? "Inscrita" : "Pospuesta"} ·{" "}
                    {sig.length > 0
                      ? `habilita ${sig.map((x) => x.nombre).join(", ")}`
                      : "no habilita nada"}
                    {!dentro && m.oferta.length === 3 ? " y se abre en todos los periodos" : ""}
                  </div>
                </li>
              );
            })}
          </ul>

          <h2 className="mt-8 mb-3 text-lg font-semibold">Qué pasaría con otra elección</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left" data-alternativas>
              <thead>
                <tr className="border-b border-gray-300 text-gray-600">
                  <th className="px-3 py-2 font-normal">Inscribir</th>
                  <th className="px-3 py-2 font-normal">Créditos</th>
                  <th className="px-3 py-2 font-normal">Costo del cuatri</th>
                  <th className="px-3 py-2 font-normal">Costo total del plan</th>
                  <th className="px-3 py-2 font-normal">
                    <span className="sr-only">Comparación</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibles.map(({ a, total }) => (
                  <tr
                    key={a.S}
                    className={`border-b border-gray-200 ${a.elegida ? "bg-blue-50 font-semibold" : ""}`}
                    data-elegida={a.elegida || undefined}
                    data-total={total ?? undefined}
                  >
                    <td className="px-3 py-3">{a.etiqueta}</td>
                    <td className="px-3 py-3">{a.creditos}</td>
                    <td className="px-3 py-3">{formatoCosto(a.costo)}</td>
                    <td className="px-3 py-3">{total === null ? "…" : formatoCosto(total)}</td>
                    <td className="px-3 py-3 font-normal">
                      {comentario(total, a.creditos, a.S, a.elegida)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-gray-600">
            Cada costo total es lo ya recorrido más el costo de esa elección más el óptimo calculado
            con A* desde el estado que deja.{" "}
            {datos.alts.length > visibles.length &&
              `Se muestran ${visibles.length} de ${datos.alts.length} alternativas calculadas.`}
            {listos < datos.alts.length && " Calculando…"}
          </p>
        </Tarjeta>

        <div className="space-y-6">
          <Tarjeta>
            <Titulo>Por qué esta elección</Titulo>
            <p className="leading-relaxed text-gray-800">
              {enCadena.length > 0
                ? `Este cuatrimestre lleva ${enCadena.join(" y ")}, de la cadena de seriación más larga: posponer${
                    enCadena.length > 1 ? "las" : "la"
                  } alargaría el plan.`
                : "Este cuatrimestre no lleva materias de la cadena de seriación más larga."}{" "}
              {empates > 0
                ? `Hay ${empates} elección(es) distinta(s) que cuestan lo mismo en total (${formatoCosto(elegidaTotal ?? 0)}).`
                : ""}
            </p>
            <p className="mt-3 leading-relaxed text-gray-800">
              El desempate por avance escoge, entre planes del mismo costo, el que aprueba más
              créditos: aquí {q.creditos} créditos con carga normal de {pb.Cnorm}.
              {pospuestas.length > 0 &&
                ` ${pospuestas.map((m) => m.nombre).join(", ")} ${pospuestas.length > 1 ? "quedan" : "queda"} para después.`}
            </p>
          </Tarjeta>
          <Tarjeta>
            <Titulo>En términos de la búsqueda</Titulo>
            <dl className="grid grid-cols-[4.5rem_1fr] gap-y-1 font-mono text-sm">
              <dt className="text-gray-600">g(n&apos;)</dt>
              <dd>{formatoCosto(gDespues)}</dd>
              <dt className="text-gray-600">R</dt>
              <dd>{hd.R} créditos</dd>
              <dt className="text-gray-600">L</dt>
              <dd>{hd.L} materias</dd>
              <dt className="text-gray-600">h(n&apos;)</dt>
              <dd>
                max(⌈{hd.R}/{pb.Cmax}⌉, {hd.L}) = {hd.h}
              </dd>
              <dt className="text-gray-600">f(n&apos;)</dt>
              <dd>
                {formatoCosto(gDespues)} + {hd.h} = {formatoCosto(gDespues + hd.h)} ≤{" "}
                {formatoCosto(resultado!.costo)}
              </dd>
            </dl>
            <p className="mt-2 text-sm text-gray-600">
              n&apos; es el estado al terminar este cuatrimestre.
            </p>
          </Tarjeta>
        </div>
      </div>
    </Pagina>
  );
}
