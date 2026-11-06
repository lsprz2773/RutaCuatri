"use client";
import { useState } from "react";
import { NOMBRES_PERIODO, type Materia, type NombrePeriodo } from "@/motor/tipos";

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

interface Props {
  materias: Materia[];
  /** Claves con error de validación; la fila se marca. */
  conError: Set<string>;
  alCambiar: (i: number, m: Materia) => void;
  alQuitar: (i: number) => void;
}

const celda = "border-b border-gray-200 px-2 py-2 align-top";
const entrada =
  "w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-700 focus:outline-none";

/** Tabla editable de materias de la pantalla 2. */
export function TablaMaterias({ materias, conError, alCambiar, alQuitar }: Props) {
  const cambiar = (i: number, cambio: Partial<Materia>) =>
    alCambiar(i, { ...materias[i], ...cambio });
  const alternarPeriodo = (i: number, p: NombrePeriodo) => {
    const o = materias[i].oferta;
    const nueva = o.includes(p)
      ? o.filter((x) => x !== p)
      : NOMBRES_PERIODO.filter((x) => x === p || o.includes(x));
    cambiar(i, { oferta: nueva });
  };
  const numero = (v: string) => Math.max(1, Math.round(Number(v) || 1));
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
        <thead>
          <tr className="text-gray-600">
            <th className={`${celda} w-24 font-normal`}>Clave</th>
            <th className={`${celda} font-normal`}>Materia</th>
            <th className={`${celda} w-20 font-normal`}>Créditos</th>
            <th className={`${celda} w-16 font-normal`}>Nivel</th>
            <th className={`${celda} w-56 font-normal`}>Prerrequisitos</th>
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
                className={error ? "bg-red-50" : undefined}
                data-error={error || undefined}
              >
                <td className={celda}>
                  <input
                    aria-label={`Clave de la fila ${i + 1}`}
                    className={`${entrada} font-mono`}
                    value={m.clave}
                    onChange={(e) => cambiar(i, { clave: e.target.value.trim() })}
                  />
                </td>
                <td className={celda}>
                  <input
                    aria-label={`Nombre de ${m.clave}`}
                    className={entrada}
                    value={m.nombre}
                    onChange={(e) => cambiar(i, { nombre: e.target.value })}
                  />
                  <div className="mt-1 text-xs text-gray-500">
                    {m.tipo}
                    {m.especialidad ? ` · especialidad ${m.especialidad}` : ""}
                  </div>
                </td>
                <td className={celda}>
                  <input
                    aria-label={`Créditos de ${m.clave}`}
                    type="number"
                    min={1}
                    className={entrada}
                    value={m.creditos}
                    onChange={(e) => cambiar(i, { creditos: numero(e.target.value) })}
                  />
                </td>
                <td className={celda}>
                  <input
                    aria-label={`Nivel de ${m.clave}`}
                    type="number"
                    min={1}
                    className={entrada}
                    value={m.nivel}
                    onChange={(e) => cambiar(i, { nivel: numero(e.target.value) })}
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
