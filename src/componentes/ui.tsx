import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function Tarjeta({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-gray-200 bg-white p-5 sm:p-6 ${className}`}>
      {children}
    </section>
  );
}

export function Titulo({ children }: { children: ReactNode }) {
  return <h2 className="mb-4 text-lg font-semibold text-gray-900">{children}</h2>;
}

const ESTILOS = {
  primario: "bg-blue-700 text-white hover:bg-blue-800 border border-blue-700",
  secundario: "bg-white text-gray-900 hover:bg-gray-50 border border-gray-300",
  peligro: "bg-white text-orange-800 hover:bg-orange-50 border border-orange-300",
};

type Variante = keyof typeof ESTILOS;
const base =
  "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

export function Boton({
  variante = "secundario",
  className = "",
  ...props
}: ComponentProps<"button"> & { variante?: Variante }) {
  return (
    <button type="button" className={`${base} ${ESTILOS[variante]} ${className}`} {...props} />
  );
}

export function Enlace({
  variante = "secundario",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variante?: Variante }) {
  return <Link className={`${base} ${ESTILOS[variante]} ${className}`} {...props} />;
}

const COLORES_ETIQUETA = {
  verde: "bg-green-50 text-green-800",
  azul: "bg-blue-50 text-blue-800",
  naranja: "bg-orange-50 text-orange-800",
  gris: "bg-gray-100 text-gray-700",
};

export function Etiqueta({
  color = "gris",
  children,
}: {
  color?: keyof typeof COLORES_ETIQUETA;
  children: ReactNode;
}) {
  return (
    <span className={`rounded-md px-2 py-0.5 text-sm ${COLORES_ETIQUETA[color]}`}>{children}</span>
  );
}

export function Dato({ titulo, valor }: { titulo: string; valor: ReactNode }) {
  return (
    <div className="rounded-lg bg-gray-100 p-4">
      <div className="text-sm text-gray-600">{titulo}</div>
      <div className="mt-1 text-2xl font-bold break-words text-gray-900">{valor}</div>
    </div>
  );
}

export function Aviso({
  tipo,
  children,
}: {
  tipo: "ok" | "alerta" | "error" | "info";
  children: ReactNode;
}) {
  const c = {
    ok: "border-green-200 bg-green-50",
    alerta: "border-orange-200 bg-orange-50",
    error: "border-red-300 bg-red-50 text-red-900",
    info: "border-blue-200 bg-blue-50",
  }[tipo];
  return <div className={`rounded-lg border p-4 text-sm leading-relaxed ${c}`}>{children}</div>;
}

export function Cabecera({
  titulo,
  subtitulo,
  acciones,
}: {
  titulo: ReactNode;
  subtitulo?: ReactNode;
  acciones?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold break-words text-gray-900 sm:text-3xl">{titulo}</h1>
        {subtitulo && <p className="mt-1 text-gray-600">{subtitulo}</p>}
      </div>
      {acciones && (
        <div className="no-imprimir flex flex-wrap gap-3 lg:shrink-0 lg:flex-nowrap lg:justify-end lg:*:whitespace-nowrap">
          {acciones}
        </div>
      )}
    </div>
  );
}

export function Pagina({ children }: { children: ReactNode }) {
  return <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">{children}</main>;
}

export function Cargando() {
  return (
    <Pagina>
      <p className="text-gray-600">Cargando…</p>
    </Pagina>
  );
}
