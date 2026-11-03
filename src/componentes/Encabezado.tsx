"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const RUTAS = [
  { href: "/", texto: "Inicio" },
  { href: "/plan/malla/", texto: "1 Plan de estudios" },
  { href: "/plan/historial/", texto: "2 Historial" },
  { href: "/plan/meta/", texto: "3 Meta" },
  { href: "/plan/busqueda/", texto: "4 Búsqueda" },
  { href: "/plan/resultado/", texto: "5 Resultado" },
  { href: "/plan/analisis/", texto: "Análisis" },
];

export function Encabezado() {
  const ruta = usePathname() ?? "/";
  const normal = ruta.endsWith("/") ? ruta : ruta + "/";
  const activa = (href: string) =>
    href === "/"
      ? normal === "/"
      : normal.startsWith(href) ||
        (href === "/plan/resultado/" && normal.startsWith("/plan/sin-plan/"));
  return (
    <header
      className={`no-imprimir border-b border-gray-200 bg-white ${normal === "/plan/resultado/" ? "hidden sm:block" : ""}`}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span className="text-2xl font-bold text-gray-900">RutaCuatri</span>
          <span className="rounded-md bg-blue-50 px-2 py-0.5 font-mono text-sm text-blue-800">
            Anytime A*
          </span>
        </Link>
        <nav aria-label="Pasos" className="-mx-1 overflow-x-auto">
          <ul className="flex gap-1 whitespace-nowrap">
            {RUTAS.map((r) => (
              <li key={r.href}>
                <Link
                  href={r.href}
                  aria-current={activa(r.href) ? "page" : undefined}
                  className={`block rounded-lg px-3 py-2 text-sm ${
                    activa(r.href) ? "bg-gray-900 text-white" : "text-gray-800 hover:bg-gray-100"
                  }`}
                >
                  {r.texto}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
