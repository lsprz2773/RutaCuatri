"use client";
import { useMemo, useState } from "react";
import { AvisoDeshacer, useConfirmar } from "@/componentes/interaccion";
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
import { borradorVacio, formatoEntero, quitarMaterias } from "@/estado/derivados";
import { useHidratado } from "@/estado/hidratado";
import { useStore } from "@/estado/store";
import { detalleH } from "@/motor/heuristica";
import { validarMalla } from "@/motor/validacion";
import type { Borrador } from "@/estado/tipos";
import type { Materia } from "@/motor/tipos";

type Respaldo = Pick<Borrador, "materias" | "estados" | "meta">;

export default function PlanDeEstudios() {
  const hidratado = useHidratado();
  const b = useStore((s) => s.borrador);
  const cambiar = useStore((s) => s.cambiar);
  const [avisoCsv, setAvisoCsv] = useState<string[]>([]);
  const [seleccion, setSeleccion] = useState<Set<number>>(new Set());
  const [deshacer, setDeshacer] = useState<{ texto: string; antes: Respaldo } | null>(null);
  const [dialogo, confirmar] = useConfirmar();

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

  const elegirMalla = async (id: string) => {
    const malla = MALLAS.find((m) => m.id === id);
    if (b.materias.length > 0) {
      const ok = await confirmar({
        titulo: malla ? `¿Cambiar a ${malla.nombre}?` : "¿Empezar con una malla en blanco?",
        texto: `Se reemplazan las ${b.materias.length} materias actuales y se borra el historial marcado. Se conservan el nombre y la descripción del plan.`,
        aceptar: malla ? "Cambiar de malla" : "Empezar en blanco",
      });
      if (!ok) return;
    }
    useStore
      .getState()
      .reemplazar({ ...borradorVacio(malla), titulo: b.titulo, descripcion: b.descripcion });
    setSeleccion(new Set());
    setDeshacer(null);
  };

  const respaldo = (): Respaldo => ({ materias: b.materias, estados: b.estados, meta: b.meta });

  /** Quita filas, limpia sus referencias y ofrece deshacer. */
  const quitar = (filas: number[]) => {
    if (filas.length === 0) return;
    const antes = respaldo();
    const nombres = filas.map((i) => b.materias[i]?.clave).filter(Boolean);
    let afectadas = 0;
    cambiar((x) => {
      afectadas = quitarMaterias(x, filas);
    });
    setSeleccion(new Set());
    const que =
      nombres.length === 1 ? `Se quitó ${nombres[0]}` : `Se quitaron ${nombres.length} materias`;
    setDeshacer({
      antes,
      texto:
        afectadas > 0
          ? `${que}; ${afectadas} materia${afectadas === 1 ? "" : "s"} ya no la${nombres.length === 1 ? "" : "s"} tiene${afectadas === 1 ? "" : "n"} como prerrequisito.`
          : `${que}.`,
    });
  };

  const vaciar = async () => {
    const ok = await confirmar({
      titulo: "¿Vaciar la malla?",
      texto: `Se quitan las ${b.materias.length} materias y el historial marcado. Podrás deshacerlo justo después.`,
      aceptar: "Vaciar malla",
    });
    if (ok) quitar(b.materias.map((_, i) => i));
  };

  const restaurar = () => {
    if (!deshacer) return;
    const { antes } = deshacer;
    cambiar((x) => {
      x.materias = antes.materias;
      x.estados = antes.estados;
      x.meta = antes.meta;
    });
    setDeshacer(null);
  };

  const agregar = () => {
    let n = b.materias.length + 1;
    while (b.materias.some((m) => m.clave === `M${String(n).padStart(2, "0")}`)) n++;
    const clave = `M${String(n).padStart(2, "0")}`;
    cambiar((x) => {
      x.materias.push({
        clave,
        nombre: "Materia nueva",
        creditos: 6,
        // Al nivel más alto existente: suele ser donde se agrega la siguiente materia.
        nivel: Math.max(1, ...x.materias.map((m) => m.nivel)),
        prerrequisitos: [],
        oferta: ["Ene", "May", "Sep"],
        tipo: "obligatoria",
        especialidad: null,
        exclusiva: false,
      });
    });
    // La fila nueva queda al final de la tabla: se lleva la vista hasta ella y se enfoca su nombre.
    requestAnimationFrame(() => {
      const campo = document.querySelector<HTMLInputElement>(
        `input[aria-label="Nombre de ${clave}"]`,
      );
      campo?.scrollIntoView({ block: "center", behavior: "smooth" });
      campo?.focus();
      campo?.select();
    });
  };

  const importar = async () => {
    const texto = await elegirArchivo(".csv,text/csv");
    if (texto === null) return;
    const r = importarMallaCsv(texto);
    setAvisoCsv(r.errores);
    if (r.datos.length > 0) {
      if (
        b.materias.length > 0 &&
        !(await confirmar({
          titulo: "¿Reemplazar la malla con el CSV?",
          texto: `El archivo trae ${r.datos.length} materias. Se reemplazan las ${b.materias.length} actuales y se borra el historial marcado.`,
          aceptar: "Reemplazar",
        }))
      )
        return;
      setSeleccion(new Set());
      setDeshacer(null);
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
      {dialogo}
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
          onChange={(e) => void elegirMalla(e.target.value)}
        >
          <option value="">
            {b.materias.length > 0 && !b.mallaId ? "Malla propia" : "Malla en blanco"}
          </option>
          {MALLAS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.id} · {m.nombre}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          Nombre
          <input
            className="w-64 rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900"
            value={b.nombreMalla}
            onChange={(e) => cambiar((x) => void (x.nombreMalla = e.target.value))}
          />
        </label>
        {(["A", "B"] as const).map((e) => (
          <label key={e} className="flex items-center gap-2 text-sm text-gray-700">
            Especialidad {e}
            <input
              className="w-48 rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900"
              value={b.especialidades[e]}
              onChange={(ev) => cambiar((x) => void (x.especialidades[e] = ev.target.value))}
            />
          </label>
        ))}
      </div>

      {deshacer && (
        <AvisoDeshacer alDeshacer={restaurar} alCerrar={() => setDeshacer(null)}>
          {deshacer.texto}
        </AvisoDeshacer>
      )}

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
              <div className="mt-8 mb-3 flex min-h-10 flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Materias</h2>
                {seleccion.size === 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">
                      Marca las casillas para quitar varias a la vez
                    </span>
                    <Boton variante="peligro" onClick={vaciar}>
                      Vaciar malla
                    </Boton>
                  </div>
                )}
                {seleccion.size > 0 && (
                  <div className="flex items-center gap-3" data-barra-seleccion>
                    <span className="text-sm text-gray-700">
                      {seleccion.size} seleccionada{seleccion.size === 1 ? "" : "s"}
                    </span>
                    <Boton onClick={() => setSeleccion(new Set())}>Cancelar</Boton>
                    <Boton variante="peligro" onClick={() => quitar([...seleccion])}>
                      Quitar seleccionadas
                    </Boton>
                  </div>
                )}
              </div>
              <TablaMaterias
                materias={b.materias}
                conError={conError}
                especialidades={b.especialidades}
                seleccion={seleccion}
                alSeleccionar={setSeleccion}
                alCambiar={(i, m: Materia) =>
                  cambiar((x) => {
                    const anterior = x.materias[i].clave;
                    x.materias[i] = m;
                    if (anterior !== m.clave) {
                      // Renombrar una clave actualiza los prerrequisitos que la usan, su estado en
                      // el historial y la meta de materias específicas.
                      for (const o of x.materias) {
                        o.prerrequisitos = o.prerrequisitos.map((p) =>
                          p === anterior ? m.clave : p,
                        );
                      }
                      if (anterior in x.estados) {
                        x.estados[m.clave] = x.estados[anterior];
                        delete x.estados[anterior];
                      }
                      x.meta.claves = x.meta.claves.map((k) => (k === anterior ? m.clave : k));
                    }
                  })
                }
                alQuitar={(i) => quitar([i])}
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
