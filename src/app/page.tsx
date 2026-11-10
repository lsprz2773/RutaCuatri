"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Aviso, Boton, Etiqueta, Pagina } from "@/componentes/ui";
import { ESCENARIOS, MALLAS } from "@/datos/cargar";
import { descargar, elegirArchivo, leerPlanes } from "@/estado/archivos";
import { iniciarBusqueda } from "@/estado/busqueda";
import { aprobadasDe, borradorDeAlumno, borradorVacio, formatoCosto } from "@/estado/derivados";
import { useHidratado } from "@/estado/hidratado";
import { useStore } from "@/estado/store";
import type { PlanGuardado } from "@/estado/tipos";

const PASOS = [
  ["Plan de estudios", "Materias, créditos, seriación y en qué cuatrimestres se abre cada una."],
  ["Historial", "Lo que ya aprobaste y en qué periodo inscribes. Es el estado inicial."],
  ["Meta y reglas", "Qué quieres terminar, la carga normal y máxima, y cuánto pesa la sobrecarga."],
  ["Búsqueda", "Un primer plan rápido y mejoras sucesivas hasta el óptimo."],
];

const FECHA = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" });
const fecha = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : FECHA.format(d);
};

const COLOR_ETIQUETA = {
  óptimo: "verde",
  mejor: "azul",
  análisis: "azul",
  "sin plan": "naranja",
} as const;

export default function Inicio() {
  const router = useRouter();
  const hidratado = useHidratado();
  const guardados = useStore((s) => s.guardados);
  const [aviso, setAviso] = useState<string | null>(null);

  const abrirEjemplo = (id: string) => {
    const alumno = ESCENARIOS.alumnos.find((a) => a.id === id)!;
    // Id fijo por alumno: volver a abrir el mismo ejemplo reemplaza su plan guardado, no lo duplica.
    useStore.getState().reemplazar(borradorDeAlumno(alumno), null, `ejemplo-${alumno.id}`);
    iniciarBusqueda((errores) => {
      setAviso(errores.map((e) => e.mensaje).join(" "));
    });
    router.push("/plan/resultado/");
  };

  const abrirGuardado = (g: PlanGuardado) => {
    useStore.getState().reemplazar(g.borrador, g.resultado, g.id);
    router.push(
      g.etiqueta === "sin plan"
        ? "/plan/sin-plan/"
        : g.resultado
          ? "/plan/resultado/"
          : "/plan/meta/",
    );
  };

  const crearNuevo = () => {
    useStore.getState().reemplazar(borradorVacio());
    router.push("/plan/malla/");
  };

  const importar = async () => {
    const texto = await elegirArchivo(".json,application/json");
    if (texto === null) return;
    const planes = leerPlanes(texto);
    if (!planes) {
      setAviso("El archivo no es un plan de RutaCuatri válido.");
      return;
    }
    useStore.getState().importarGuardados(planes);
    setAviso(`Se importaron ${planes.length} plan(es).`);
  };

  return (
    <Pagina>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-5xl sm:leading-tight">
            ¿Cuántos cuatrimestres te faltan, y en qué orden conviene llevar las materias?
          </h1>
          <p className="mt-3 text-lg text-gray-600">
            RutaCuatri lee tu plan de estudios y tu historial, respeta seriación, oferta y carga, y
            te da un plan en segundos que luego sigue mejorando.
          </p>
        </div>
        <Boton variante="primario" className="px-6 py-3 text-base" onClick={crearNuevo}>
          Crear plan nuevo
        </Boton>
      </div>

      {aviso && (
        <div className="mt-6">
          <Aviso tipo="info">{aviso}</Aviso>
        </div>
      )}

      <section className="mt-10">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Planes guardados</h2>
          <div className="flex gap-2">
            <Boton onClick={importar}>Importar JSON</Boton>
            <Boton
              disabled={!hidratado || guardados.length === 0}
              onClick={() =>
                descargar("planes.rutacuatri.json", JSON.stringify(guardados, null, 2))
              }
            >
              Exportar JSON
            </Boton>
          </div>
        </div>
        {!hidratado ? (
          <p className="text-gray-500">Cargando…</p>
        ) : guardados.length === 0 ? (
          <p className="text-gray-600">
            Todavía no hay planes guardados. Cada búsqueda terminada se guarda aquí (hasta 20).
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {guardados.map((g) => (
              <article
                key={g.id}
                className="relative rounded-xl border border-gray-200 bg-white p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold">
                    <button
                      type="button"
                      className="text-left after:absolute after:inset-0 hover:underline"
                      onClick={() => abrirGuardado(g)}
                    >
                      {g.borrador.titulo}
                    </button>
                  </h3>
                  <Etiqueta color={COLOR_ETIQUETA[g.etiqueta]}>{g.etiqueta}</Etiqueta>
                </div>
                <p className="mt-1 text-sm text-gray-500" data-fecha>
                  Guardado el {fecha(g.fecha)}
                </p>
                <p className="mt-1 text-gray-600">
                  {g.borrador.nombreMalla} · {aprobadasDe(g.borrador).length} materias aprobadas
                  {g.borrador.descripcion ? ` · ${g.borrador.descripcion}` : ""}
                </p>
                <div className="mt-1 flex items-center justify-between font-mono text-sm">
                  <span>
                    {g.resultado
                      ? `${g.resultado.plan.length} cuatrimestres · costo ${formatoCosto(g.resultado.costo)}`
                      : "meta imposible · ver causa"}
                  </span>
                  <button
                    type="button"
                    className="relative z-10 rounded px-2 font-sans text-gray-500 hover:text-red-700"
                    onClick={() => useStore.getState().borrarGuardado(g.id)}
                    aria-label={`Quitar ${g.borrador.titulo} de los guardados`}
                  >
                    Quitar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-1 text-xl font-semibold">Alumnos de ejemplo</h2>
        <p className="mb-4 text-gray-600">
          Cuatro alumnos por malla con la meta de titulación con especialidad A y el perfil regular.
          Al abrir uno se calcula su plan.
        </p>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {MALLAS.map((malla) => (
            <div key={malla.id}>
              <h3 className="mb-2 font-semibold text-gray-800">{malla.nombre}</h3>
              <ul className="space-y-2">
                {ESCENARIOS.alumnos
                  .filter((a) => a.malla === malla.id)
                  .map((a) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        data-alumno={a.id}
                        onClick={() => abrirEjemplo(a.id)}
                        className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left hover:border-blue-700 focus-visible:outline-2 focus-visible:outline-blue-700"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold">{a.nombre}</span>
                          <span className="font-mono text-xs text-gray-500">{a.id}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {a.descripcion} · inscribe en {a.periodo_inicio}
                        </div>
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-xl font-semibold">Cómo se arma un plan</h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PASOS.map(([t, d], i) => (
            <li key={t} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="font-mono font-semibold text-blue-700">{i + 1}</div>
              <div className="mt-1 font-semibold">{t}</div>
              <p className="mt-1 text-gray-600">{d}</p>
            </li>
          ))}
        </ol>
      </section>
    </Pagina>
  );
}
