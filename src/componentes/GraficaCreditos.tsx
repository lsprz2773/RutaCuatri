import type { Cuatrimestre } from "@/motor/tipos";

/** Barras de créditos por cuatrimestre con la línea de Cnorm (SVG propio) y su tabla equivalente. */
export function GraficaCreditos({
  plan,
  Cnorm,
  Cmax,
}: {
  plan: Cuatrimestre[];
  Cnorm: number;
  Cmax: number;
}) {
  const W = 800;
  const alto = 260;
  // Margen superior para la leyenda de la carga normal, fuera del área de las barras.
  const arriba = 44;
  const abajo = 30;
  const tope = Math.max(Cmax, ...plan.map((q) => q.creditos), 1);
  const y = (v: number) => arriba + (alto - arriba - abajo) * (1 - v / tope);
  const ancho = W / Math.max(plan.length, 1);
  // El número de cada barra va sobre la barra; si quedaría encima de la línea de la carga normal,
  // se sube por arriba de la línea para que no se crucen.
  const etiquetaY = (v: number) => {
    const sobre = y(v) - 6;
    const linea = y(Cnorm);
    return sobre > linea - 16 && sobre < linea + 14 ? Math.min(y(v), linea) - 8 : sobre;
  };
  return (
    <figure>
      <svg
        viewBox={`0 0 ${W} ${alto}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Créditos por cuatrimestre; carga normal ${Cnorm}`}
      >
        {plan.map((q, i) => {
          const x = i * ancho + ancho * 0.06;
          const w = ancho * 0.88;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y(q.creditos)}
                width={w}
                height={y(0) - y(q.creditos)}
                rx={3}
                className={q.creditos > Cnorm ? "fill-orange-400" : "fill-blue-400"}
              />
              <text
                x={x + w / 2}
                y={etiquetaY(q.creditos)}
                textAnchor="middle"
                className="fill-gray-800 text-[13px]"
              >
                {q.creditos}
              </text>
              <text
                x={x + w / 2}
                y={alto - 8}
                textAnchor="middle"
                className="fill-gray-600 text-[13px]"
              >
                {i + 1}
              </text>
            </g>
          );
        })}
        <line x1={0} x2={W} y1={y(0)} y2={y(0)} className="stroke-gray-300" />
        <line
          x1={0}
          x2={W}
          y1={y(Cnorm)}
          y2={y(Cnorm)}
          strokeDasharray="6 5"
          strokeWidth={2}
          className="stroke-orange-700"
        />
        <g aria-hidden="true">
          <line
            x1={4}
            x2={34}
            y1={14}
            y2={14}
            strokeDasharray="6 5"
            strokeWidth={2}
            className="stroke-orange-700"
          />
          <text x={42} y={18} className="fill-orange-800 text-[13px]">
            carga normal {Cnorm} créditos
          </text>
        </g>
      </svg>
      <details className="no-imprimir mt-2 text-sm text-gray-700">
        <summary className="cursor-pointer">Ver como tabla</summary>
        <table className="mt-2 w-full max-w-sm text-left">
          <thead>
            <tr>
              <th className="py-1 font-medium">Cuatrimestre</th>
              <th className="py-1 font-medium">Créditos</th>
              <th className="py-1 font-medium">Sobre la carga normal</th>
            </tr>
          </thead>
          <tbody>
            {plan.map((q, i) => (
              <tr key={i}>
                <td className="py-0.5">{i + 1}</td>
                <td className="py-0.5">{q.creditos}</td>
                <td className="py-0.5">{Math.max(0, q.creditos - Cnorm)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
