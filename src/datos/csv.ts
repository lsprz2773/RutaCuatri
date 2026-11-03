// Importación de CSV de malla y de kárdex (decisiones.md, sección 4).
import { esquemaMateria } from "./esquemas.ts";
import type { Materia } from "../motor/tipos.ts";

/** Separa un CSV en filas y campos; acepta campos entre comillas dobles. */
export function leerCsv(texto: string): string[][] {
  const filas: string[][] = [];
  let fila: string[] = [];
  let campo = "";
  let comillas = false;
  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i];
    if (comillas) {
      if (ch === '"' && texto[i + 1] === '"') {
        campo += '"';
        i++;
      } else if (ch === '"') comillas = false;
      else campo += ch;
    } else if (ch === '"') comillas = true;
    else if (ch === ",") {
      fila.push(campo.trim());
      campo = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && texto[i + 1] === "\n") i++;
      fila.push(campo.trim());
      if (fila.some((x) => x !== "")) filas.push(fila);
      fila = [];
      campo = "";
    } else campo += ch;
  }
  fila.push(campo.trim());
  if (fila.some((x) => x !== "")) filas.push(fila);
  return filas;
}

const COLUMNAS_MALLA = [
  "clave",
  "nombre",
  "creditos",
  "nivel",
  "prerrequisitos",
  "oferta",
  "tipo",
  "especialidad",
  "exclusiva",
];

export interface ResultadoCsv<T> {
  datos: T;
  errores: string[];
}

const lista = (x: string) =>
  x
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s !== "");

export function importarMallaCsv(texto: string): ResultadoCsv<Materia[]> {
  const filas = leerCsv(texto);
  const errores: string[] = [];
  if (filas.length === 0) return { datos: [], errores: ["El archivo está vacío."] };
  const cab = filas[0].map((c) => c.toLowerCase());
  const faltan = COLUMNAS_MALLA.filter((c) => !cab.includes(c));
  if (faltan.length > 0) return { datos: [], errores: [`Faltan columnas: ${faltan.join(", ")}.`] };
  const col = (f: string[], nombre: string) => f[cab.indexOf(nombre)] ?? "";
  const materias: Materia[] = [];
  filas.slice(1).forEach((f, n) => {
    const candidato = {
      clave: col(f, "clave"),
      nombre: col(f, "nombre"),
      creditos: Number(col(f, "creditos")),
      nivel: Number(col(f, "nivel")),
      prerrequisitos: lista(col(f, "prerrequisitos")),
      oferta: lista(col(f, "oferta")),
      tipo: col(f, "tipo") || "obligatoria",
      especialidad: col(f, "especialidad") || null,
      exclusiva: ["true", "si", "sí", "1"].includes(col(f, "exclusiva").toLowerCase()),
    };
    const r = esquemaMateria.safeParse(candidato);
    if (r.success) materias.push(r.data);
    else
      errores.push(
        `Fila ${n + 2}: ${r.error.issues.map((i) => i.path.join(".") + " " + i.message).join("; ")}`,
      );
  });
  return { datos: materias, errores };
}

export type EstadoMateria = "aprobada" | "reprobada" | "pendiente";

export function importarKardexCsv(
  texto: string,
  claves: string[],
): ResultadoCsv<Record<string, EstadoMateria>> {
  const filas = leerCsv(texto);
  const errores: string[] = [];
  const datos: Record<string, EstadoMateria> = {};
  if (filas.length === 0) return { datos, errores: ["El archivo está vacío."] };
  const cab = filas[0].map((c) => c.toLowerCase());
  const iClave = cab.indexOf("clave");
  const iEstado = cab.indexOf("estado");
  if (iClave < 0 || iEstado < 0) return { datos, errores: ["Faltan las columnas clave y estado."] };
  filas.slice(1).forEach((f, n) => {
    const clave = f[iClave];
    const estado = (f[iEstado] ?? "").toLowerCase();
    if (!claves.includes(clave))
      errores.push(`Fila ${n + 2}: la clave ${clave} no está en la malla.`);
    else if (estado !== "aprobada" && estado !== "reprobada" && estado !== "pendiente") {
      errores.push(`Fila ${n + 2}: estado «${f[iEstado]}» no válido.`);
    } else datos[clave] = estado;
  });
  return { datos, errores };
}

export function exportarMallaCsv(materias: Materia[]): string {
  const filas = materias.map((m) =>
    [
      m.clave,
      `"${m.nombre.replace(/"/g, '""')}"`,
      m.creditos,
      m.nivel,
      m.prerrequisitos.join(";"),
      m.oferta.join(";"),
      m.tipo,
      m.especialidad ?? "",
      m.exclusiva,
    ].join(","),
  );
  return [COLUMNAS_MALLA.join(","), ...filas].join("\n") + "\n";
}
