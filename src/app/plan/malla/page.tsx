"use client";
import { useMemo, useState } from "react";
import { MapaSeriacion } from "@/componentes/MapaSeriacion";
import { TablaMaterias } from "@/componentes/TablaMaterias";
import {
  Aviso,
  Boton,
  Cabecera,
  Cargando,
  Dato,
  Enlace,
  Pagina,
  Tarjeta,
  Titulo,
} from "@/componentes/ui";
import { MALLAS } from "@/datos/cargar";
import { exportarMallaCsv, importarMallaCsv } from "@/datos/csv";
import { descargar, elegirArchivo } from "@/estado/archivos";
import { borradorVacio, formatoEntero } from "@/estado/derivados";
import { useHidratado } from "@/estado/hidratado";
import { useStore } from "@/estado/store";
import { detalleH } from "@/motor/heuristica";
import { validarMalla } from "@/motor/validacion";
import type { Materia } from "@/motor/tipos";

export default function PlanDeEstudios() {
  const hidratado = useHidratado();
  const b = useStore((s) => s.borrador);
  const cambiar = useStore((s) => s.cambiar);
  const [avisoCsv, setAvisoCsv] = useState<string[]>([]);

  const errores = useMemo(() => validarMalla(b.materias), [b.materias]);
  const conError = useMemo(
    () => new Set(errores.flatMap((e) => (e.clave ? [e.clave] : []))),
    [errores],
  );
  const analisis = useMemo(() => {
    if (errores.length > 0 || b.materias.length === 0) return null;
    const todas = b.materias.reduce((x, _, i) => (x | (1 << i)) >>> 0, 0);
    const d = detalleH(
      {
        materias: b.materias,
        Cnorm: 1,
        Cmax: Infinity,
        beta: 0,
        K: 1,
        meta: todas,
        inicio: { A: 0, p: 0 },
      },
      0,
    );
    return { cadena: d.cadena.map((i) => b.materias[i].clave), L: d.L };
  }, [b.materias, errores]);

  if (!hidratado) return <Cargando />;

  const creditos = b.materias.reduce((s, m) => s + m.creditos, 0);
  const unSolo = b.materias.filter((m) => m.oferta.length === 1);
  const sinOferta = b.materias.filter((m) => m.oferta.length === 0);
  const masPesada = Math.max(0, ...b.materias.map((m) => m.creditos));
  const ciclo = errores.find((e) => e.mensaje.includes("ciclo"));

  const elegirMalla = (id: string) => {
    const malla = MALLAS.find((m) => m.id === id);
    if (!malla) return;
    useStore
      .getState()
      .reemplazar({ ...borradorVacio(malla), titulo: b.titulo, descripcion: b.descripcion });
  };

  const agregar = () =>
    cambiar((x) => {
      let n = x.materias.length + 1;
      while (x.materias.some((m) => m.clave === `M${String(n).padStart(2, "0")}`)) n++;
      x.materias.push({
        clave: `M${String(n).padStart(2, "0")}`,
        nombre: "Materia nueva",
        creditos: 6,
        nivel: 1,
        prerrequisitos: [],
        oferta: ["Ene", "May", "Sep"],
        tipo: "obligatoria",
        especialidad: null,
        exclusiva: false,
      });
    });

  const importar = async () => {
    const texto = await elegirArchivo(".csv,text/csv");
    if (texto === null) return;
    const r = importarMallaCsv(texto);
    setAvisoCsv(r.errores);
    if (r.datos.length > 0) {
      cambiar((x) => {
        x.materias = r.datos;
        x.mallaId = null;
        x.nombreMalla = "Malla importada";
        x.planMalla = "";
        x.estados = {};
      });
    }
  };

  return (
    <Pagina>
      <Cabecera
        titulo={`${b.nombreMalla}${b.planMalla ? ` · plan ${b.planMalla}` : ""}`}
        subtitulo={`${b.materias.length} materias · ${creditos} créditos · 3 periodos por año (enero, mayo y septiembre)`}
        acciones={
          <>
            <Boton onClick={importar}>Importar CSV</Boton>
            <Boton onClick={() => descargar("malla.csv", exportarMallaCsv(b.materias), "text/csv")}>
              Exportar CSV
            </Boton>
            <Boton onClick={agregar}>Agregar materia</Boton>
            {errores.length > 0 || b.materias.length === 0 ? (
              <Boton variante="primario" disabled>
                Continuar a historial
              </Boton>
            ) : (
              <Enlace variante="primario" href="/plan/historial/">
                Continuar a historial
              </Enlace>
            )}
          </>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label htmlFor="malla" className="text-sm text-gray-700">
          Malla
        </label>
        <select
          id="malla"
          className="rounded-lg border border-gray-300 bg-white px-3 py-2"
          value={b.mallaId ?? ""}
          onChange={(e) => elegirMalla(e.target.value)}
        >
          <option value="" disabled>
            Elige una malla…
          </option>
          {MALLAS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.id} · {m.nombre}
            </option>
          ))}
        </select>
      </div>

      {avisoCsv.length > 0 && (
        <div className="mb-6">
          <Aviso tipo="error">
            <strong>Filas del CSV con problemas:</strong>
            <ul className="mt-1 list-disc pl-5">
              {avisoCsv.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </Aviso>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Tarjeta className="min-w-0">
          {b.materias.length === 0 ? (
            <p className="text-gray-600">
              Elige una de las tres mallas, importa un CSV o agrega materias una por una.
            </p>
          ) : (
            <>
              <Titulo>Mapa de seriación por nivel</Titulo>
              <MapaSeriacion materias={b.materias} cadena={analisis?.cadena ?? []} />
              {analisis && (
                <p className="mt-4 text-gray-600">
                  En azul, la cadena de seriación más larga ({analisis.L} materias):{" "}
                  {analisis.cadena.join(" → ")}. Ningún plan de toda la malla puede terminar en
                  menos de {analisis.L} cuatrimestres.
                </p>
              )}
              <h2 className="mt-8 mb-3 text-lg font-semibold">Materias</h2>
              <TablaMaterias
                materias={b.materias}
                conError={conError}
                alCambiar={(i, m: Materia) =>
                  cambiar((x) => {
                    const anterior = x.materias[i].clave;
                    x.materias[i] = m;
                    if (anterior !== m.clave) {
                      // Renombrar una clave actualiza los prerrequisitos que la usan.
                      for (const o of x.materias) {
                        o.prerrequisitos = o.prerrequisitos.map((p) =>
                          p === anterior ? m.clave : p,
                        );
                      }
                    }
                  })
                }
                alQuitar={(i) =>
                  cambiar((x) => {
                    x.materias.splice(i, 1);
                  })
                }
              />
            </>
          )}
        </Tarjeta>

        <Tarjeta className="h-fit">
          <Titulo>Validación antes de buscar</Titulo>
          <div className="space-y-3" role="status">
            {errores
              .filter((e) => e !== ciclo)
              .map((e) => (
                <Aviso key={e.mensaje} tipo="error">
                  {e.mensaje}
                </Aviso>
              ))}
            <Aviso tipo={ciclo ? "error" : "ok"}>
              {ciclo ? (
                ciclo.mensaje
              ) : (
                <>
                  <strong>Sin ciclos de seriación.</strong> Ninguna materia depende de sí misma.
                </>
              )}
            </Aviso>
            <Aviso tipo={sinOferta.length > 0 ? "alerta" : "ok"}>
              {sinOferta.length > 0 ? (
                <>
                  <strong>{sinOferta.length} sin oferta.</strong>{" "}
                  {sinOferta.map((m) => m.clave).join(", ")} no se abren en ningún periodo; si la
                  meta las necesita no habrá plan.
                </>
              ) : (
                <>
                  <strong>Todas se ofrecen.</strong> Las {b.materias.length} materias se abren en al
                  menos un periodo.
                </>
              )}
            </Aviso>
            <Aviso tipo={masPesada > b.parametros.Cmax ? "alerta" : "ok"}>
              <strong>
                {masPesada > b.parametros.Cmax
                  ? "Hay materias más pesadas que la carga máxima."
                  : "Ninguna excede la carga máxima."}
              </strong>{" "}
              La más pesada tiene {masPesada} créditos (carga máxima {b.parametros.Cmax}).
            </Aviso>
            {unSolo.length > 0 && (
              <Aviso tipo="alerta">
                <strong>{unSolo.length} materias de un solo periodo.</strong>{" "}
                {unSolo.map((m) => m.clave).join(", ")} restringen el orden.
              </Aviso>
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Dato titulo="Créditos totales" valor={creditos} />
            <Dato titulo="Cadena más larga" valor={analisis?.L ?? "—"} />
            <Dato
              titulo="Estados posibles"
              valor={
                b.materias.length <= 31 ? `≤ ${formatoEntero(3 * 2 ** b.materias.length)}` : "—"
              }
            />
            <Dato
              titulo="Sin prerrequisitos"
              valor={b.materias.filter((m) => m.prerrequisitos.length === 0).length}
            />
          </div>
          <p className="mt-3 text-sm text-gray-600">
            Estados posibles = 3 periodos × 2<sup>{b.materias.length}</sup> conjuntos de materias
            aprobadas.
          </p>
        </Tarjeta>
      </div>
    </Pagina>
  );
}
