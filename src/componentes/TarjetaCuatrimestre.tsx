import Link from "next/link";
import { formatoCosto, mesesCortos } from "@/estado/derivados";
import type { Cuatrimestre, Materia } from "@/motor/tipos";

interface Props {
  n: number;
  anio: number;
  q: Cuatrimestre;
  materias: Materia[];
  reprobadas: Set<string>;
  Cnorm: number;
  destacada?: boolean;
}

export function TarjetaCuatrimestre({ n, anio, q, materias, reprobadas, Cnorm, destacada }: Props) {
  const recursa = q.materias.some((k) => reprobadas.has(k));
  const sobre = q.creditos > Cnorm;
  const marco = recursa
    ? "border-2 border-orange-600 bg-orange-50"
    : destacada
      ? "border-2 border-blue-700 bg-white"
      : "border border-gray-200 bg-white";
  return (
    <article className={`flex flex-col rounded-xl p-4 ${marco}`} data-cuatrimestre={n}>
      <div className={`text-sm ${recursa ? "font-semibold text-orange-800" : "text-gray-600"}`}>
        {n} · {mesesCortos(q.periodo)} · año {anio}
        {recursa ? " · recursa" : ""}
      </div>
      <ul className="mt-2 flex-1 space-y-1.5">
        {q.materias.length === 0 && (
          <li className="text-gray-500 italic">
            Sin inscripción: no se abre ninguna materia necesaria
          </li>
        )}
        {q.materias.map((k) => {
          const m = materias.find((x) => x.clave === k);
          return (
            <li key={k} className="leading-snug">
              {k} {m?.nombre} · {m?.creditos}
            </li>
          );
        })}
      </ul>
      <div
        className={`mt-3 font-mono text-sm ${sobre || recursa ? "text-orange-800" : "text-gray-700"}`}
      >
        {q.creditos} cr · costo {formatoCosto(q.costo)}
      </div>
      <Link
        href={`/plan/resultado/${n}/`}
        className="no-imprimir mt-2 text-sm font-semibold text-blue-700 hover:underline"
      >
        Ver por qué
      </Link>
    </article>
  );
}
