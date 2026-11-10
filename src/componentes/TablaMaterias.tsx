"use client";
import { useState } from "react";
import { CampoNumero } from "@/componentes/interaccion";
import { NOMBRES_PERIODO, type Materia, type NombrePeriodo } from "@/motor/tipos";

/** Tipo de materia como un solo valor del selector: obligatoria u optativa de la especialidad A o B. */
type TipoFila = "obligatoria" | "A" | "B";
const tipoDe = (m: Materia): TipoFila =>
  m.tipo === "obligatoria" ? "obligatoria" : (m.especialidad ?? "A");

/** Campo de claves separadas por coma; se aplica al salir del campo o con Enter. */
function EntradaLista(props: {
  etiqueta: string;
  className: string;
  valor: string[];
  alCambiar: (v: string[]) => void;
}) {
  const [texto, setTexto] = useState<string | null>(null);
  const aplicar = () => {
    if (texto === null) return;
    props.alCambiar(
      texto
        .split(/[,;\s]+/)
        .map((x) => x.trim())
        .filter(Boolean),
    );
    setTexto(null);
  };
  return (
    <input
      aria-label={props.etiqueta}
      className={props.className}
      value={texto ?? props.valor.join(", ")}
      placeholder="—"
      onChange={(e) => setTexto(e.target.value)}
      onBlur={aplicar}
      onKeyDown={(e) => e.key === "Enter" && aplicar()}
    />
  );
}

/**
 * Clave editable: el cambio se aplica al salir del campo o con Enter, no con cada tecla, para que
 * una clave a medio escribir no choque con otra existente. Vacía o repetida se rechaza.
 */
function EntradaClave(props: {
  fila: number;
  className: string;
  valor: string;
  otras: string[];
  alCambiar: (v: string) => void;
}) {
  const [texto, setTexto] = useState<string | null>(null);
  const limpio = texto?.trim() ?? props.valor;
  const problema =
    texto === null
      ? null
      : limpio === ""
        ? "La clave no puede quedar vacía."
        : limpio !== props.valor && props.otras.includes(limpio)
          ? `La clave ${limpio} ya existe.`
          : null;
  const aplicar = () => {
    if (texto === null) return;
    if (!problema && limpio !== props.valor) props.alCambiar(limpio);
    setTexto(null);
  };
  return (
    <>
      <input
        aria-label={`Clave de la fila ${props.fila}`}
        aria-invalid={problema ? true : undefined}
        className={`${props.className} ${problema ? "border-red-500" : ""}`}
        value={texto ?? props.valor}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={aplicar}
        onKeyDown={(e) => {
          if (e.key === "Enter") aplicar();
          if (e.key === "Escape") setTexto(null);
        }}
      />
      {problema && (
        <div className="mt-1 text-xs font-semibold text-red-700" role="alert">
          {problema} Se conservará {props.valor}.
        </div>
      )}
    </>
  );
}

interface Props {
  materias: Materia[];
  /** Claves con error de validación; la fila se marca. */
  conError: Set<string>;
  /** Nombres de las especialidades A y B, para el selector de tipo. */
  especialidades: { A: string; B: string };
  /** Filas seleccionadas para quitarlas juntas. */
  seleccion: Set<number>;
  alSeleccionar: (seleccion: Set<number>) => void;
  alCambiar: (i: number, m: Materia) => void;
  alQuitar: (i: number) => void;
}

const celda = "border-b border-gray-200 px-2 py-2 align-top";
const entrada =
  "w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-700 focus:outline-none";

/** Tabla editable de materias de la pantalla 2. */
export function TablaMaterias({
  materias,
  conError,
  especialidades,
  seleccion,
  alSeleccionar,
  alCambiar,
  alQuitar,
}: Props) {
  const cambiar = (i: number, cambio: Partial<Materia>) =>
    alCambiar(i, { ...materias[i], ...cambio });
  const alternarPeriodo = (i: number, p: NombrePeriodo) => {
    const o = materias[i].oferta;
    const nueva = o.includes(p)
      ? o.filter((x) => x !== p)
      : NOMBRES_PERIODO.filter((x) => x === p || o.includes(x));
    cambiar(i, { oferta: nueva });
  };
  const todas = materias.length > 0 && seleccion.size === materias.length;
  const alternarFila = (i: number) => {
    const s = new Set(seleccion);
    if (s.has(i)) s.delete(i);
    else s.add(i);
    alSeleccionar(s);
  };
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full min-w-[58rem] border-collapse text-left text-sm">
        <thead>
          <tr className="text-gray-600">
            <th className={`${celda} w-8 font-normal`}>
              <input
                type="checkbox"
                aria-label="Seleccionar todas las materias"
                checked={todas}
                ref={(el) => {
                  if (el) el.indeterminate = seleccion.size > 0 && !todas;
                }}
                onChange={() =>
                  alSeleccionar(todas ? new Set() : new Set(materias.map((_, i) => i)))
                }
              />
            </th>
            <th className={`${celda} w-24 font-normal`}>Clave</th>
            <th className={`${celda} min-w-52 font-normal`}>Materia</th>
            <th className={`${celda} w-20 font-normal`}>Créditos</th>
            <th className={`${celda} w-16 font-normal`}>Nivel</th>
            <th className={`${celda} w-48 font-normal`}>Prerrequisitos</th>
            <th className={`${celda} w-44 font-normal`}>Se abre en</th>
            <th className={`${celda} w-20 font-normal`}>Exclusiva</th>
            <th className={`${celda} w-10 font-normal`}>
              <span className="sr-only">Quitar</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {materias.map((m, i) => {
            const error = conError.has(m.clave);
            return (
              <tr
                key={i}
                className={error ? "bg-red-50" : seleccion.has(i) ? "bg-blue-50" : undefined}
                data-error={error || undefined}
                data-fila={m.clave}
              >
                <td className={celda}>
                  <input
                    type="checkbox"
                    aria-label={`Seleccionar ${m.clave}`}
                    className="mt-1.5"
                    checked={seleccion.has(i)}
                    onChange={() => alternarFila(i)}
                  />
                </td>
                <td className={celda}>
                  <EntradaClave
                    fila={i + 1}
                    className={`${entrada} font-mono`}
                    valor={m.clave}
                    otras={materias.filter((_, j) => j !== i).map((x) => x.clave)}
                    alCambiar={(clave) => cambiar(i, { clave })}
                  />
                </td>
                <td className={celda}>
                  <input
                    aria-label={`Nombre de ${m.clave}`}
                    className={entrada}
                    value={m.nombre}
                    onChange={(e) => cambiar(i, { nombre: e.target.value })}
                  />
                  <select
                    aria-label={`Tipo de ${m.clave}`}
                    className="mt-1 w-full rounded border border-gray-200 bg-white px-1 py-0.5 text-xs text-gray-700"
                    value={tipoDe(m)}
                    onChange={(e) => {
                      const t = e.target.value as TipoFila;
                      cambiar(
                        i,
                        t === "obligatoria"
                          ? { tipo: "obligatoria", especialidad: null }
                          : { tipo: "optativa", especialidad: t },
                      );
                    }}
                  >
                    <option value="obligatoria">Obligatoria</option>
                    <option value="A">Optativa · A · {especialidades.A}</option>
                    <option value="B">Optativa · B · {especialidades.B}</option>
                  </select>
                </td>
                <td className={celda}>
                  <CampoNumero
                    aria-label={`Créditos de ${m.clave}`}
                    min={1}
                    entero
                    className={entrada}
                    valor={m.creditos}
                    alCambiar={(creditos) => cambiar(i, { creditos })}
                  />
                </td>
                <td className={celda}>
                  <CampoNumero
                    aria-label={`Nivel de ${m.clave}`}
                    min={1}
                    entero
                    className={entrada}
                    valor={m.nivel}
                    alCambiar={(nivel) => cambiar(i, { nivel })}
                  />
                </td>
                <td className={celda}>
                  <EntradaLista
                    etiqueta={`Prerrequisitos de ${m.clave}`}
                    className={`${entrada} font-mono ${error ? "border-red-500" : ""}`}
                    valor={m.prerrequisitos}
                    alCambiar={(prerrequisitos) => cambiar(i, { prerrequisitos })}
                  />
                </td>
                <td className={celda}>
                  <div className="flex gap-1">
                    {NOMBRES_PERIODO.map((p) => (
                      <label
                        key={p}
                        className={`cursor-pointer rounded border px-2 py-1 text-xs focus-within:outline-2 focus-within:outline-blue-700 ${
                          m.oferta.includes(p)
                            ? "border-blue-700 bg-blue-50 text-blue-800"
                            : "border-gray-300 text-gray-500"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={m.oferta.includes(p)}
                          onChange={() => alternarPeriodo(i, p)}
                        />
                        {p}
                      </label>
                    ))}
                  </div>
                  {m.oferta.length === 1 && (
                    <div className="mt-1 text-xs font-semibold text-orange-800">
                      Solo {m.oferta[0]}
                    </div>
                  )}
                  {m.oferta.length === 0 && (
                    <div className="mt-1 text-xs font-semibold text-red-700">Sin oferta</div>
                  )}
                </td>
                <td className={celda}>
                  <input
                    aria-label={`${m.clave} es exclusiva`}
                    type="checkbox"
                    checked={m.exclusiva}
                    onChange={(e) => cambiar(i, { exclusiva: e.target.checked })}
                  />
                </td>
                <td className={celda}>
                  <button
                    type="button"
                    aria-label={`Quitar ${m.clave}`}
                    className="rounded px-2 text-gray-500 hover:bg-gray-100 hover:text-red-700"
                    onClick={() => alQuitar(i)}
                  >
                    ×
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
