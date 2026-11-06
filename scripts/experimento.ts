// Experimentos A a D de docs/decisiones.md (sección 7). Uso: npm run experimento [-- --repeticiones 5]
// Escribe un CSV por experimento en resultados/ y los datos del equipo en resultados/equipo.txt.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { cpus, totalmem, platform, release } from "node:os";
import { esquemaEscenarios, esquemaMallas } from "../src/datos/esquemas.ts";
import { anytime } from "../src/motor/anytime.ts";
import { correrMetodo, type Metodo } from "../src/motor/metodos.ts";
import { crearProblema, type Perfil } from "../src/motor/problema.ts";
import { MAX_EXPANSIONES } from "../src/motor/tipos.ts";
import type { Materia, Problema } from "../src/motor/tipos.ts";
import { aEstrella } from "../src/motor/wastar.ts";

const TIEMPO_MAX_MS = 60_000;
const TOL = 1e-9;
const arg = process.argv.indexOf("--repeticiones");
const REPETICIONES = arg >= 0 ? Number(process.argv[arg + 1]) : 5;

const mallas = esquemaMallas.parse(
  JSON.parse(readFileSync("public/datos/mallas.json", "utf-8")),
).mallas;
const esc = esquemaEscenarios.parse(
  JSON.parse(readFileSync("public/datos/escenarios.json", "utf-8")),
);
const casos = JSON.parse(readFileSync("pruebas/casos-prueba.json", "utf-8"));

type NombrePerfil = "regular" | "medio_tiempo";

function problema(alumnoId: string, metaId: string, perfil: Perfil): Problema {
  const a = esc.alumnos.find((x) => x.id === alumnoId)!;
  const meta = esc.metas.find((x) => x.id === metaId)!;
  const materias = mallas.find((m) => m.id === a.malla)!.materias as Materia[];
  return crearProblema(materias, perfil, a.aprobadas, a.periodo_inicio, meta.materias);
}

const mediana = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const ms = (x: number | null) => (x === null ? "" : x.toFixed(3));
const num = (x: number | null) => (x === null ? "" : String(Math.round(x * 1e6) / 1e6));

function csv(nombre: string, columnas: string[], filas: (string | number)[][]) {
  const texto = [columnas.join(","), ...filas.map((f) => f.join(","))].join("\n") + "\n";
  writeFileSync(`resultados/${nombre}`, texto);
  console.log(`  resultados/${nombre}: ${filas.length} filas`);
}

/** Repite la corrida y toma la mediana de los tiempos; costos y expansiones no cambian entre repeticiones. */
function repetir<T>(
  f: () => T,
  tiempos: (r: T) => (number | null)[],
): { r: T; t: (number | null)[] } {
  const corridas = Array.from({ length: REPETICIONES }, f);
  const n = tiempos(corridas[0]).length;
  const t = Array.from({ length: n }, (_, i) => {
    const xs = corridas.map((c) => tiempos(c)[i]).filter((x): x is number => x !== null);
    return xs.length === corridas.length ? mediana(xs) : null;
  });
  return { r: corridas[0], t };
}

mkdirSync("resultados", { recursive: true });
writeFileSync(
  "resultados/equipo.txt",
  [
    `Procesador: ${cpus()[0]?.model ?? "desconocido"} (${cpus().length} hilos)`,
    `Memoria: ${(totalmem() / 2 ** 30).toFixed(1)} GiB`,
    `Node: ${process.version}`,
    `Sistema: ${platform()} ${release()}`,
    `Repeticiones por corrida: ${REPETICIONES} (se reporta la mediana del tiempo)`,
    `Límites: ${TIEMPO_MAX_MS / 1000} s por corrida y ${MAX_EXPANSIONES} expansiones por pasada`,
    `Fecha: ${new Date().toISOString()}`,
  ].join("\n") + "\n",
);

interface Escenario {
  id: string;
  perfil: NombrePerfil;
  alumno: string;
  meta: string;
  costo_optimo: number;
  cuatrimestres: number;
}
const escenarios = casos.escenarios as Escenario[];
let fallas = 0;

// A. Primer plan y óptimo con Anytime A* en los 72 escenarios (una fila por pasada).
console.log("Experimento A");
{
  const filas: (string | number)[][] = [];
  for (const e of escenarios) {
    const pb = problema(e.alumno, e.meta, esc.perfiles[e.perfil]);
    const { r, t } = repetir(
      () => anytime(pb, undefined, undefined, { tiempoMaxMs: TIEMPO_MAX_MS }),
      (x) => [x.tiempoPrimerPlanMs, x.tiempoMs, ...x.pasadas.map((p) => p.tiempoMs)],
    );
    const coincide = r.costo !== null && Math.abs(r.costo - e.costo_optimo) < TOL;
    if (!coincide) fallas++;
    r.pasadas.forEach((p, i) => {
      filas.push([
        e.id,
        e.alumno,
        e.meta,
        e.perfil,
        i + 1,
        p.H,
        num(p.costo),
        p.expansiones,
        p.generados,
        ms(t[2 + i]),
        p.fin,
        ms(t[0]),
        ms(t[1]),
        num(r.costo),
        e.costo_optimo,
        coincide ? "si" : "no",
      ]);
    });
  }
  csv(
    "experimento-a.csv",
    [
      "escenario",
      "alumno",
      "meta",
      "perfil",
      "pasada",
      "H",
      "costo_pasada",
      "expansiones",
      "generados",
      "tiempo_pasada_ms",
      "fin",
      "tiempo_primer_plan_ms",
      "tiempo_total_ms",
      "costo_final",
      "costo_esperado",
      "coincide",
    ],
    filas,
  );
}

// B. Anytime A* contra A*, Weighted A* (H = 2) y Costo Uniforme en los 24 escenarios con meta M1.
console.log("Experimento B");
{
  const metodos: Metodo[] = ["anytime", "astar", "wastar2", "uniforme"];
  const filas: (string | number)[][] = [];
  for (const e of escenarios.filter((x) => x.meta.endsWith("M1"))) {
    const pb = problema(e.alumno, e.meta, esc.perfiles[e.perfil]);
    for (const m of metodos) {
      const { r, t } = repetir(
        () => correrMetodo(pb, m, TIEMPO_MAX_MS),
        (x) => [x.tiempoMs, x.tiempoPrimerPlanMs],
      );
      const termino = r.fin === "meta" || r.fin === "agotada";
      if ((m === "astar" || m === "uniforme" || m === "anytime") && termino) {
        if (r.costo === null || Math.abs(r.costo - e.costo_optimo) > TOL) fallas++;
      }
      filas.push([
        e.id,
        e.alumno,
        e.perfil,
        m,
        termino ? num(r.costo) : "no terminó",
        r.cuatrimestres ?? "",
        r.expansiones,
        ms(t[0]),
        ms(t[1]),
        r.memoria,
        e.costo_optimo,
      ]);
    }
  }
  csv(
    "experimento-b.csv",
    [
      "escenario",
      "alumno",
      "perfil",
      "metodo",
      "costo",
      "cuatrimestres",
      "expansiones",
      "tiempo_total_ms",
      "tiempo_primer_plan_ms",
      "max_estados_memoria",
      "costo_optimo",
    ],
    filas,
  );
}

// C. Ahorro de las reglas D06 a D08: A* con y sin ellas (E1 y E3, meta M1, medio tiempo).
console.log("Experimento C");
{
  const filas: (string | number)[][] = [];
  for (const malla of ["ISW", "IRC", "ICD"]) {
    for (const tipo of ["E1", "E3"]) {
      const pb = problema(`${malla}-${tipo}`, `${malla}-M1`, esc.perfiles.medio_tiempo);
      const limite = () => ({
        maxExpansiones: MAX_EXPANSIONES,
        fechaLimite: performance.now() + TIEMPO_MAX_MS,
      });
      const con = repetir(
        () => aEstrella(pb, limite()),
        (x) => [x.tiempoMs],
      );
      const sin = repetir(
        () => aEstrella(pb, limite(), { reglas: false }),
        (x) => [x.tiempoMs],
      );
      const igual =
        con.r.costo !== null && sin.r.costo !== null && Math.abs(con.r.costo - sin.r.costo) < TOL;
      if (!igual) fallas++;
      filas.push([
        `${malla}-${tipo}`,
        num(con.r.costo),
        con.r.expansiones,
        ms(con.t[0]),
        num(sin.r.costo),
        sin.r.expansiones,
        ms(sin.t[0]),
        (sin.r.expansiones / Math.max(1, con.r.expansiones)).toFixed(2),
        igual ? "si" : "no",
      ]);
    }
  }
  csv(
    "experimento-c.csv",
    [
      "alumno",
      "costo_con_reglas",
      "expansiones_con_reglas",
      "tiempo_con_reglas_ms",
      "costo_sin_reglas",
      "expansiones_sin_reglas",
      "tiempo_sin_reglas_ms",
      "razon_expansiones",
      "mismo_costo",
    ],
    filas,
  );
}

// D. Qué parámetro decide el egreso: ISW-E1, meta M1, A* variando un parámetro del perfil regular.
console.log("Experimento D");
{
  const base = esc.perfiles.regular;
  const variantes: [string, Perfil, [number, number, number]][] = [
    ["ninguno", base, [6.4, 6, 4]],
    ["beta = 0.05", { ...base, beta: 0.05 }, [6.2, 6, 4]],
    ["beta = 0.2", { ...base, beta: 0.2 }, [6.8, 6, 4]],
    ["beta = 0.5", { ...base, beta: 0.5 }, [7.0, 7, 0]],
    ["Cnorm = 24", { ...base, Cnorm: 24 }, [8.5, 7, 15]],
    ["Cnorm = 27", { ...base, Cnorm: 27 }, [7.4, 7, 4]],
    ["Cnorm = 33", { ...base, Cnorm: 33 }, [6.0, 6, 0]],
    ["Cmax = 30", { ...base, Cmax: 30 }, [7.0, 7, 0]],
    ["Cmax = 33", { ...base, Cmax: 33 }, [6.4, 6, 4]],
    ["Cmax = 40", { ...base, Cmax: 40 }, [6.4, 6, 4]],
    ["K = 5", { ...base, K: 5 }, [6.4, 6, 4]],
    ["K = 6", { ...base, K: 6 }, [6.4, 6, 4]],
  ];
  const filas: (string | number)[][] = [];
  for (const [nombre, perfil, [costo, n, sobre]] of variantes) {
    const { r, t } = repetir(
      () => correrMetodo(problema("ISW-E1", "ISW-M1", perfil), "astar", TIEMPO_MAX_MS),
      (x) => [x.tiempoMs],
    );
    const ok =
      r.costo !== null &&
      Math.abs(r.costo - costo) < TOL &&
      r.cuatrimestres === n &&
      r.sobrecarga === sobre;
    if (!ok) fallas++;
    filas.push([
      nombre,
      perfil.beta,
      perfil.Cnorm,
      perfil.Cmax,
      perfil.K,
      num(r.costo),
      r.cuatrimestres ?? "",
      r.sobrecarga ?? "",
      r.expansiones,
      ms(t[0]),
      costo,
      n,
      sobre,
      ok ? "si" : "no",
    ]);
  }
  csv(
    "experimento-d.csv",
    [
      "cambio",
      "beta",
      "Cnorm",
      "Cmax",
      "K",
      "costo",
      "cuatrimestres",
      "creditos_sobrecarga",
      "expansiones",
      "tiempo_ms",
      "costo_referencia",
      "cuatrimestres_referencia",
      "sobrecarga_referencia",
      "coincide",
    ],
    filas,
  );
}

console.log(
  `Comprobaciones contra los valores esperados: ${fallas === 0 ? "todas coinciden" : `${fallas} fallas`}`,
);
process.exit(fallas === 0 ? 0 : 1);
