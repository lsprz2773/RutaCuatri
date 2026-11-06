// Flujos de la sección 6 de docs/decisiones.md.
import { expect, test, type Page } from "@playwright/test";

const tarjeta = (page: Page, clave: string) => page.locator(`[data-clave="${clave}"]`);

async function marcar(page: Page, clave: string, estado: "aprobada" | "reprobada") {
  const veces = estado === "aprobada" ? 1 : 2; // pendiente → aprobada → reprobada
  for (let i = 0; i < veces; i++) await tarjeta(page, clave).click();
  await expect(tarjeta(page, clave)).toHaveAttribute("data-estado", estado);
}

async function nuevoPlanIsw(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Crear plan nuevo" }).click();
  await expect(page).toHaveURL(/\/plan\/malla\/$/);
  await page.getByLabel("Malla").selectOption("ISW");
}

test("Ana Ruiz (ISW-E3, meta M1) llega a un plan de costo 5.0 en 5 cuatrimestres", async ({
  page,
}) => {
  await nuevoPlanIsw(page);
  await page.getByRole("link", { name: "Continuar a historial" }).click();

  await page.getByLabel("Nombre del alumno").fill("Ana Ruiz");
  for (const k of ["ISW02", "ISW03", "ISW04", "ISW05", "ISW07", "ISW08", "ISW09"])
    await marcar(page, k, "aprobada");
  await marcar(page, "ISW01", "reprobada");
  await page.getByLabel("Siguiente periodo de inscripción").selectOption("May");
  await page.getByRole("link", { name: "Continuar a meta" }).click();

  await expect(page.getByText("Toda la malla")).toBeVisible();
  await page.getByRole("button", { name: "Buscar plan" }).click();
  await expect(page).toHaveURL(/\/plan\/busqueda\/$/);
  await expect(page.locator("[data-estado-busqueda]")).toHaveAttribute(
    "data-estado-busqueda",
    "terminada",
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Plan óptimo: 5 cuatrimestres, costo 5.0",
  );

  await page.getByRole("link", { name: "Ver plan" }).click();
  await expect(page.getByRole("heading", { level: 1 }).first()).toContainText(
    "Plan de Ana Ruiz · 5 cuatrimestres · costo 5.0",
  );
  await expect(page.locator("[data-plan] [data-cuatrimestre]")).toHaveCount(5);
  // Los totales de las tarjetas coinciden con el costo de la búsqueda.
  await expect(page.locator("[data-total]")).toHaveText("costo total 5.0");
});

test("T03: una materia necesaria sin oferta termina en Sin plan sin entrar a la búsqueda", async ({
  page,
}) => {
  await nuevoPlanIsw(page);
  const fila = page.locator("tbody tr").filter({ has: page.getByLabel("Nombre de ISW23") });
  for (const p of ["Ene", "May"]) await fila.getByText(p, { exact: true }).click();
  await expect(fila.getByText("Sin oferta")).toBeVisible();
  await page.getByRole("link", { name: "Continuar a historial" }).click();
  await page.getByRole("link", { name: "Continuar a meta" }).click();
  await page.getByRole("button", { name: "Buscar plan" }).click();

  await expect(page).toHaveURL(/\/plan\/sin-plan\/$/);
  await expect(page.locator("[data-sin-plan]")).toHaveAttribute("data-sin-plan", "ISW23");
  await expect(page.getByText("no se ejecutó la búsqueda")).toBeVisible();
});

test("Detener corta la búsqueda en menos de 1 s y conserva el mejor plan", async ({ page }) => {
  // Malla sintética de 18 materias sin seriación: el primer plan sale rápido y las pasadas siguientes tardan.
  const materias = Array.from({ length: 18 }, (_, i) => ({
    clave: `X${String(i).padStart(2, "0")}`,
    nombre: `Materia ${i}`,
    creditos: 4 + (i % 5),
    nivel: 1,
    prerrequisitos: [],
    oferta: ["Ene", "May", "Sep"],
    tipo: "obligatoria",
    especialidad: null,
    exclusiva: false,
  }));
  const borrador = {
    titulo: "Malla grande",
    descripcion: "",
    mallaId: null,
    nombreMalla: "Malla sintética",
    planMalla: "",
    especialidades: { A: "A", B: "B" },
    materias,
    estados: {},
    periodo: "Sep",
    meta: { tipo: "malla", especialidad: "A", claves: [] },
    parametros: { Cnorm: 20, Cmax: 36, beta: 0.1, K: 7 },
    pesos: [3, 2, 1.5, 1],
    tiempoMax: null,
  };
  await page.goto("/");
  await page.evaluate((b) => {
    localStorage.setItem(
      "rutacuatri:v1",
      JSON.stringify({
        state: { borrador: b, resultado: null, idActual: null, guardados: [] },
        version: 1,
      }),
    );
  }, borrador);
  await page.goto("/plan/meta/");
  await page.getByRole("button", { name: "Buscar plan" }).click();
  await expect(page).toHaveURL(/\/plan\/busqueda\/$/);

  // La interfaz responde mientras busca: aparece el primer plan y el botón sigue activo.
  await expect(page.getByRole("link", { name: "Ver plan" })).toBeVisible({ timeout: 15_000 });
  const estado = page.locator("[data-estado-busqueda]");
  await expect(estado).toHaveAttribute("data-estado-busqueda", "corriendo");

  const t0 = Date.now();
  await page.getByRole("button", { name: "Detener y quedarme con el mejor plan" }).click();
  await expect(estado).toHaveAttribute("data-estado-busqueda", "detenida", { timeout: 1_000 });
  expect(Date.now() - t0).toBeLessThan(1_000);

  await page.getByRole("link", { name: "Ver plan" }).click();
  await expect(page.getByRole("heading", { level: 1 }).first()).toContainText(
    "Plan de Malla grande",
  );
});

test("A 390 px de ancho no hay desplazamiento horizontal", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator('[data-alumno="ISW-E3"]').click();
  await expect(page).toHaveURL(/\/plan\/resultado\/$/);
  await expect(page.getByRole("heading", { name: "Tu plan: 5 cuatrimestres" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Repruebo una" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Descargar PDF" })).toBeVisible();
  const ancho = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(ancho).toBeLessThanOrEqual(390);

  for (const ruta of [
    "/",
    "/plan/malla/",
    "/plan/historial/",
    "/plan/meta/",
    "/plan/busqueda/",
    "/plan/analisis/",
  ]) {
    await page.goto(ruta);
    await page.locator("main").first().waitFor();
    await page.waitForTimeout(800);
    const w = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(w, `desplazamiento horizontal en ${ruta}`).toBeLessThanOrEqual(390);
  }
});
