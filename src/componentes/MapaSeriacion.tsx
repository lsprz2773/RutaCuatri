import type { Materia } from "@/motor/tipos";

/** Materias en columnas por nivel; la cadena de seriación más larga va resaltada. */
export function MapaSeriacion({ materias, cadena }: { materias: Materia[]; cadena: string[] }) {
  const niveles = [...new Set(materias.map((m) => m.nivel))].sort((a, b) => a - b);
  const enCadena = new Set(cadena);
  return (
    <div className="overflow-x-auto">
      <div
        className="grid min-w-[36rem] gap-3"
        style={{ gridTemplateColumns: `repeat(${Math.max(niveles.length, 1)}, minmax(0, 1fr))` }}
      >
        {niveles.map((n) => (
          <div key={n}>
            <div className="mb-2 text-sm text-gray-600">Nivel {n}</div>
            <ul className="space-y-2">
              {materias
                .filter((m) => m.nivel === n)
                .map((m) => (
                  <li
                    key={m.clave}
                    className={`rounded-lg px-3 py-2 text-sm leading-snug ${
                      enCadena.has(m.clave)
                        ? "bg-blue-700 font-semibold text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    {m.clave} {m.nombre}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
