"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Aviso, Boton, Cargando, Enlace, Pagina, Tarjeta, Titulo } from "@/componentes/ui";
import { metaSin } from "@/estado/analisis";
import { iniciarBusqueda } from "@/estado/busqueda";
import { formatoCosto, metaDe, problemaDe } from "@/estado/derivados";
import { useHidratado } from "@/estado/hidratado";
import { useStore } from "@/estado/store";
import type { ResultadoMetodo } from "@/motor/metodos";
import { crearProblema } from "@/motor/problema";
import { esSinPlan, validar } from "@/motor/validacion";
import type { Problema } from "@/motor/tipos";
import { correrLote } from "@/worker/cliente";

const NOMBRE_META = {
  malla: "toda la malla",
  estadia: "llegar a la estadía",
  especialidad: "el bloque de optativas",
  especificas: "las materias específicas",
};

export default function SinPlan() {
  const router = useRouter();
  const hidratado = useHidratado();
  const b = useStore((s) => s.borrador);
  const pb = useMemo(() => problemaDe(b), [b]);
  const errores = useMemo(() => validar(pb), [pb]);
  const causa = esSinPlan(errores) ? errores[0] : null;
  const materia = causa ? b.materias.find((m) => m.clave === causa.clave) : undefined;
  const claveCausa = causa?.clave;

  // Meta sin la materia causa (y sin lo que depende de ella) y su plan óptimo, para la primera opción.
  const sinCausa = useMemo(() => {
    if (!claveCausa) return null;
    const meta = metaSin(b.materias, metaDe(b), claveCausa);
    const aprobadas = b.materias
      .filter((m) => b.estados[m.clave] === "aprobada")
      .map((m) => m.clave);
    return { meta, problema: crearProblema(b.materias, b.parametros, aprobadas, b.periodo, meta) };
  }, [b, claveCausa]);
  const [alterno, setAlterno] = useState<{ pb: Problema | null; r: ResultadoMetodo | null }>({
    pb: null,
    r: null,
  });
  useEffect(() => {
    if (!sinCausa || validar(sinCausa.problema).length > 0) return;
    return correrLote(
      [{ problema: sinCausa.problema, metodo: "astar", tiempoMaxMs: 60_000 }],
      (_, r) => setAlterno({ pb: sinCausa.problema, r }),
    );
  }, [sinCausa]);

  if (!hidratado) return <Cargando />;
  if (!causa || !materia || !sinCausa) {
    return (
      <Pagina>
        <Aviso tipo="info">
          La meta actual sí tiene plan. <Enlace href="/plan/meta/">Volver a la meta</Enlace>
        </Aviso>
      </Pagina>
    );
  }

  const r = alterno.pb === sinCausa.problema ? alterno.r : null;
  const sinValida = validar(sinCausa.problema).length === 0;
  const quitadas = metaDe(b).length - sinCausa.meta.length;
  const nombre = (k: string) => b.materias.find((m) => m.clave === k)?.nombre ?? k;
  const porOferta = causa.regla === "oferta";

  const planearSin = () => {
    useStore.getState().cambiar((x) => {
      x.meta = { ...x.meta, tipo: "especificas", claves: sinCausa.meta };
    });
    iniciarBusqueda();
    router.push("/plan/busqueda/");
  };

  return (
    <Pagina>
      <div className="mx-auto max-w-6xl">
        <section
          className="rounded-xl border-2 border-orange-700 bg-white p-6 sm:p-8"
          data-sin-plan={materia.clave}
        >
          <div className="font-semibold text-orange-800">
            Meta imposible con este plan de estudios
          </div>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
            No hay forma de terminar {NOMBRE_META[b.meta.tipo]}
          </h1>
          <p className="mt-2 max-w-4xl text-gray-600">
            {causa.mensaje} La validación lo detecta antes de buscar, así que no se ejecutó la
            búsqueda.
            {errores.length > 1 && ` Hay ${errores.length} causas; se muestra la primera.`}
          </p>
        </section>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Tarjeta>
            <Titulo>Causa</Titulo>
            <dl className="grid grid-cols-[6.5rem_1fr] gap-y-2">
              <dt className="text-gray-600">Materia</dt>
              <dd>
                {materia.clave} {materia.nombre} · {materia.creditos} créditos
              </dd>
              <dt className="text-gray-600">Requiere</dt>
              <dd>
                {materia.prerrequisitos.length > 0
                  ? materia.prerrequisitos.map((p) => `${p} ${nombre(p)}`).join(" y ")
                  : "ningún prerrequisito"}
              </dd>
              <dt className="text-gray-600">Oferta</dt>
              <dd className={porOferta ? "font-semibold text-orange-800" : ""}>
                {materia.oferta.length > 0 ? materia.oferta.join(", ") : "ningún periodo"}
              </dd>
              <dt className="text-gray-600">Créditos</dt>
              <dd className={!porOferta ? "font-semibold text-orange-800" : ""}>
                {materia.creditos} de {b.parametros.Cmax} como máximo
              </dd>
              <dt className="text-gray-600">Afecta a</dt>
              <dd>la meta «{NOMBRE_META[b.meta.tipo]}»</dd>
            </dl>
            <Enlace href="/plan/malla/" className="mt-6 w-full">
              {porOferta ? "Revisar la oferta en el plan de estudios" : "Editar la malla"}
            </Enlace>
          </Tarjeta>

          <Tarjeta>
            <Titulo>Opciones</Titulo>
            <div className="space-y-3">
              <div className="rounded-lg bg-gray-100 p-4">
                <strong>Planear sin {materia.clave}.</strong>{" "}
                {quitadas > 1
                  ? `Sale de la meta junto con ${quitadas - 1} materia(s) que la necesitan. `
                  : "Sale de la meta. "}
                {!sinValida
                  ? "Aun así la meta tiene otra materia imposible."
                  : sinCausa.meta.length === 0
                    ? "No queda nada por planear."
                    : r
                      ? `El resto se termina en ${r.cuatrimestres} cuatrimestres con costo ${formatoCosto(r.costo ?? 0)}, y ${materia.clave} queda pendiente.`
                      : "Calculando el plan sin ella…"}
              </div>
              <div className="rounded-lg bg-gray-100 p-4">
                <strong>{porOferta ? "Solicitar que se abra." : "Subir la carga máxima."}</strong>{" "}
                {porOferta
                  ? `Si ${materia.clave} se abriera en algún periodo, la meta volvería a ser posible: se marca en el plan de estudios.`
                  : `Con una carga máxima de al menos ${materia.creditos} créditos la meta vuelve a ser posible.`}
              </div>
              <div className="rounded-lg bg-gray-100 p-4">
                <strong>Cambiar la meta.</strong> Elegir otra meta, por ejemplo llegar a la estadía,
                si {materia.clave} no forma parte de ella.
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Enlace variante="primario" href="/plan/meta/">
                Cambiar la meta
              </Enlace>
              <Boton onClick={planearSin} disabled={!sinValida || sinCausa.meta.length === 0}>
                Planear sin {materia.clave}
              </Boton>
            </div>
          </Tarjeta>
        </div>
      </div>
    </Pagina>
  );
}
