"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Aviso, Boton, Cargando, Enlace, Pagina, Tarjeta, Titulo } from "@/componentes/ui";
import { iniciarBusqueda } from "@/estado/busqueda";
import {
  PERFIL_MEDIO,
  PERFIL_REGULAR,
  aprobadasDe,
  clavesMeta,
  formatoCosto,
  formatoEntero,
  nombrePeriodo,
  problemaDe,
} from "@/estado/derivados";
import { useHidratado } from "@/estado/hidratado";
import { useStore } from "@/estado/store";
import type { TipoMeta } from "@/estado/tipos";
import { h } from "@/motor/heuristica";
import { indices, necesarias } from "@/motor/problema";
import { esSinPlan, validar } from "@/motor/validacion";

const TIEMPOS: { valor: number | null; texto: string }[] = [
  { valor: 60, texto: "60 segundos" },
  { valor: 300, texto: "5 minutos" },
  { valor: null, texto: "Sin límite" },
];

export default function MetaYParametros() {
  const router = useRouter();
  const hidratado = useHidratado();
  const b = useStore((s) => s.borrador);
  const cambiar = useStore((s) => s.cambiar);
  const [nuevoH, setNuevoH] = useState("");
  const [errores, setErrores] = useState<string[]>([]);

  const resumen = useMemo(() => {
    const pb = problemaDe(b);
    const err = validar(pb);
    const malla = err.some((e) => e.regla === "malla");
    return {
      pb,
      err,
      hInicio: malla ? null : h(pb, pb.inicio.A),
      necesarias: malla ? 0 : indices(necesarias(pb, pb.inicio.A)).length,
    };
  }, [b]);

  if (!hidratado) return <Cargando />;

  const par = b.parametros;
  const pendientes = b.materias.length - aprobadasDe(b).length;
  const faltanDe = (tipo: TipoMeta) =>
    clavesMeta(b.materias, tipo, b.meta.especialidad, b.meta.claves).filter(
      (k) => b.estados[k] !== "aprobada",
    ).length;
  const esp = b.especialidades[b.meta.especialidad];
  const OPCIONES: { tipo: TipoMeta; titulo: string; texto: string }[] = [
    {
      tipo: "malla",
      titulo: "Toda la malla",
      texto: `Con la especialidad ${b.meta.especialidad} (${esp}) y la estadía: faltan ${faltanDe("malla")}`,
    },
    {
      tipo: "estadia",
      titulo: "Llegar a la estadía",
      texto: `Las obligatorias que la habilitan: faltan ${faltanDe("estadia")}`,
    },
    {
      tipo: "especialidad",
      titulo: "Un bloque de optativas",
      texto: `Las optativas de ${esp} y sus prerrequisitos`,
    },
    { tipo: "especificas", titulo: "Materias específicas", texto: "Tú eliges el conjunto G" },
  ];

  const numero = (campo: keyof typeof par, v: string) =>
    cambiar((x) => {
      const n = Number(v);
      if (Number.isFinite(n)) x.parametros[campo] = n;
    });

  const ejemplos = [0, par.Cnorm, Math.round((par.Cnorm + par.Cmax) / 2), par.Cmax].filter(
    (v, i, a) => a.indexOf(v) === i,
  );

  const agregarPasada = () => {
    const v = Number(nuevoH);
    if (!(v > 1) || b.pesos.includes(v)) return;
    cambiar((x) => {
      x.pesos = [...x.pesos, v].sort((a, c) => c - a);
    });
    setNuevoH("");
  };

  const buscar = () => {
    const err = validar(resumen.pb);
    if (err.length > 0) {
      if (esSinPlan(err)) {
        useStore.getState().guardar("sin plan");
        router.push("/plan/sin-plan/");
      } else setErrores(err.map((e) => e.mensaje));
      return;
    }
    iniciarBusqueda((e) => setErrores(e.map((x) => x.mensaje)));
    router.push("/plan/busqueda/");
  };

  const campo = "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-lg";

  return (
    <Pagina>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          <Tarjeta>
            <Titulo>¿Qué quieres terminar?</Titulo>
            <div className="grid gap-3 md:grid-cols-2" role="radiogroup" aria-label="Meta">
              {OPCIONES.map((o) => {
                const activa = b.meta.tipo === o.tipo;
                return (
                  <label
                    key={o.tipo}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl p-4 ${
                      activa ? "border-2 border-blue-700 bg-blue-50" : "border border-gray-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="meta"
                      className="mt-1.5"
                      checked={activa}
                      onChange={() => cambiar((x) => void (x.meta.tipo = o.tipo))}
                    />
                    <span>
                      <span className="block font-semibold">{o.titulo}</span>
                      <span className="text-gray-600">{o.texto}</span>
                    </span>
                  </label>
                );
              })}
            </div>
            {(b.meta.tipo === "malla" || b.meta.tipo === "especialidad") && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="text-sm text-gray-700">Especialidad</span>
                {(["A", "B"] as const).map((e) => (
                  <label key={e} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="especialidad"
                      checked={b.meta.especialidad === e}
                      onChange={() => cambiar((x) => void (x.meta.especialidad = e))}
                    />
                    {e} · {b.especialidades[e]}
                  </label>
                ))}
              </div>
            )}
            {b.meta.tipo === "especificas" && (
              <fieldset className="mt-4">
                <legend className="text-sm text-gray-700">Materias de la meta G</legend>
                <div className="mt-2 grid max-h-72 gap-1 overflow-y-auto sm:grid-cols-2">
                  {b.materias.map((m) => (
                    <label key={m.clave} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={b.meta.claves.includes(m.clave)}
                        onChange={(e) =>
                          cambiar((x) => {
                            x.meta.claves = e.target.checked
                              ? [...x.meta.claves, m.clave]
                              : x.meta.claves.filter((k) => k !== m.clave);
                          })
                        }
                      />
                      <span className={b.estados[m.clave] === "aprobada" ? "text-gray-400" : ""}>
                        {m.clave} {m.nombre}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
          </Tarjeta>

          <Tarjeta>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Carga por cuatrimestre</h2>
              <div className="flex gap-2">
                <Boton onClick={() => cambiar((x) => void (x.parametros = { ...PERFIL_REGULAR }))}>
                  Perfil regular
                </Boton>
                <Boton onClick={() => cambiar((x) => void (x.parametros = { ...PERFIL_MEDIO }))}>
                  Medio tiempo
                </Boton>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <label className="text-sm text-gray-700">
                Carga normal (créditos)
                <input
                  type="number"
                  min={0}
                  className={campo}
                  value={par.Cnorm}
                  onChange={(e) => numero("Cnorm", e.target.value)}
                />
              </label>
              <label className="text-sm text-gray-700">
                Carga máxima (créditos)
                <input
                  type="number"
                  min={1}
                  className={campo}
                  value={par.Cmax}
                  onChange={(e) => numero("Cmax", e.target.value)}
                />
              </label>
              <label className="text-sm text-gray-700">
                Penalización β por crédito extra
                <input
                  type="number"
                  min={0}
                  step={0.05}
                  className={campo}
                  value={par.beta}
                  onChange={(e) => numero("beta", e.target.value)}
                />
              </label>
              <label className="text-sm text-gray-700">
                Materias por cuatrimestre (K)
                <input
                  type="number"
                  min={1}
                  className={campo}
                  value={par.K}
                  onChange={(e) => numero("K", e.target.value)}
                />
              </label>
            </div>
            <div className="mt-4 rounded-lg bg-gray-100 p-4" aria-live="polite">
              <div className="text-sm text-gray-600">Cuánto cuesta un cuatrimestre</div>
              <div className="mt-1 font-mono text-lg">
                costo = 1 + {par.beta} · max(0, créditos − {par.Cnorm})
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-4">
                {ejemplos.map((c) => (
                  <div key={c} className="rounded bg-white px-3 py-2" data-ejemplo={c}>
                    {c} créditos → {formatoCosto(1 + par.beta * Math.max(0, c - par.Cnorm))}
                  </div>
                ))}
              </div>
            </div>
          </Tarjeta>

          <Tarjeta>
            <Titulo>Búsqueda</Titulo>
            <div className="text-sm text-gray-700">Pesos H de cada pasada (de rápido a óptimo)</div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {b.pesos.map((H) => (
                <span
                  key={H}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 font-mono ${
                    H === 1 ? "bg-blue-700 text-white" : "bg-blue-50 text-blue-800"
                  }`}
                >
                  H = {H}
                  {H === 1 ? " · óptimo" : ""}
                  {H !== 1 && (
                    <button
                      type="button"
                      aria-label={`Quitar la pasada con H = ${H}`}
                      className="text-blue-900 hover:text-red-700"
                      onClick={() =>
                        cambiar((x) => void (x.pesos = x.pesos.filter((p) => p !== H)))
                      }
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
              <input
                aria-label="Peso de la nueva pasada"
                type="number"
                min={1.05}
                step={0.25}
                placeholder="H"
                className="w-20 rounded-lg border border-gray-300 px-2 py-2"
                value={nuevoH}
                onChange={(e) => setNuevoH(e.target.value)}
              />
              <Boton onClick={agregarPasada}>Agregar pasada</Boton>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="text-sm text-gray-700">
                Tiempo máximo de búsqueda
                <select
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
                  value={b.tiempoMax ?? "sin"}
                  onChange={(e) =>
                    cambiar(
                      (x) =>
                        void (x.tiempoMax =
                          e.target.value === "sin" ? null : Number(e.target.value)),
                    )
                  }
                >
                  {TIEMPOS.map((t) => (
                    <option key={t.texto} value={t.valor ?? "sin"}>
                      {t.texto}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-start gap-3 rounded-xl border border-gray-200 p-4">
                <input
                  type="checkbox"
                  checked
                  readOnly
                  disabled
                  className="mt-1"
                  aria-label="Desempate por avance (siempre activo)"
                />
                <div>
                  <div className="font-semibold">Desempate por avance</div>
                  <div className="text-sm text-gray-600">
                    Entre planes del mismo costo, preferir el que aprueba más créditos antes.
                    Siempre activo (D11).
                  </div>
                </div>
              </div>
            </div>
          </Tarjeta>
        </div>

        <Tarjeta className="h-fit">
          <Titulo>Problema a resolver</Titulo>
          <dl className="grid grid-cols-[6rem_1fr] gap-x-3 gap-y-2" data-resumen>
            <dt className="text-gray-600">Inicio</dt>
            <dd>
              {aprobadasDe(b).length} aprobadas, inscribe en {nombrePeriodo(b.periodo)}
            </dd>
            <dt className="text-gray-600">Meta</dt>
            <dd>
              A ⊇ {clavesMeta(b.materias, b.meta.tipo, b.meta.especialidad, b.meta.claves).length}{" "}
              materias ({resumen.necesarias} necesarias pendientes)
            </dd>
            <dt className="text-gray-600">Estados</dt>
            <dd>
              ≤ 3 · 2<sup>{pendientes}</sup> ={" "}
              {pendientes <= 31 ? formatoEntero(3 * 2 ** pendientes) : "—"}
            </dd>
            <dt className="text-gray-600">Cota h</dt>
            <dd data-h-inicio>{resumen.hInicio ?? "—"} cuatrimestres</dd>
            <dt className="text-gray-600">Garantía</dt>
            <dd>cada plan cuesta ≤ H · C*</dd>
          </dl>
          <p className="mt-4 text-gray-600">
            Si en un periodo no se abre ninguna materia que puedas llevar, el plan incluye un
            cuatrimestre sin inscripción, que cuesta 1.
          </p>
          {resumen.err.length > 0 && !esSinPlan(resumen.err) && (
            <div className="mt-4 space-y-2">
              {resumen.err.map((e) => (
                <Aviso key={e.mensaje} tipo="error">
                  {e.mensaje}
                </Aviso>
              ))}
            </div>
          )}
          {errores.length > 0 && (
            <div className="mt-4">
              <Aviso tipo="error">{errores.join(" ")}</Aviso>
            </div>
          )}
          <Boton
            variante="primario"
            className="mt-4 w-full py-3 text-base"
            onClick={buscar}
            disabled={resumen.err.length > 0 && !esSinPlan(resumen.err)}
          >
            Buscar plan
          </Boton>
          <Enlace href="/plan/historial/" className="mt-2 w-full">
            Volver al historial
          </Enlace>
        </Tarjeta>
      </div>
    </Pagina>
  );
}
