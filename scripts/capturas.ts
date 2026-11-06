// Capturas de la interfaz para el reporte. Uso: npm run build && npm run capturas
// Sirve out/ con scripts/servir.ts y guarda las imágenes en reporte/imagenes/.
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { chromium, type Page } from "@playwright/test";

const PUERTO = 3200;
const BASE = `http://localhost:${PUERTO}`;
const DESTINO = "reporte/imagenes";
mkdirSync(DESTINO, { recursive: true });

const servidor = spawn(process.execPath, ["scripts/servir.ts", String(PUERTO)], {
  stdio: "ignore",
});
await new Promise((r) => setTimeout(r, 1500));

const navegador = await chromium.launch();
const contexto = await navegador.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1.5,
});
const page = await contexto.newPage();

async function captura(nombre: string, completa = true) {
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${DESTINO}/${nombre}.png`, fullPage: completa });
  console.log(`  ${DESTINO}/${nombre}.png`);
}

async function abrirEjemplo(p: Page, id: string) {
  await p.goto(`${BASE}/`);
  await p.evaluate(() => localStorage.clear());
  await p.goto(`${BASE}/`);
  await p.locator(`[data-alumno="${id}"]`).click();
  await p.waitForURL(/\/plan\/resultado\/$/);
  await p.locator("[data-total]").waitFor();
}

async function buscarDesdeMeta(p: Page) {
  await p.getByRole("button", { name: "Buscar plan" }).click();
  await p.waitForURL(/\/plan\/busqueda\/$/);
  await p.locator('[data-estado-busqueda="terminada"]').waitFor();
}

try {
  // Inicio
  await page.goto(`${BASE}/`);
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE}/`);
  await captura("inicio");

  // Caso 1: Ana Ruiz (ISW-E3), toda la malla, perfil regular.
  console.log("Caso 1");
  await abrirEjemplo(page, "ISW-E3");
  await captura("caso1-resultado");
  await page.goto(`${BASE}/plan/malla/`);
  await captura("caso1-malla");
  await page.goto(`${BASE}/plan/historial/`);
  await captura("caso1-historial");
  await page.goto(`${BASE}/plan/meta/`);
  await captura("caso1-meta");
  await page.goto(`${BASE}/plan/busqueda/`);
  await captura("caso1-busqueda", false);
  await page.goto(`${BASE}/plan/resultado/1/`);
  await page
    .getByText("Calculando…")
    .waitFor({ state: "detached", timeout: 30_000 })
    .catch(() => {});
  await captura("caso1-detalle");
  await page.goto(`${BASE}/plan/analisis/`);
  await page
    .locator('[data-metodo="uniforme"]')
    .getByText("…")
    .waitFor({ state: "detached" })
    .catch(() => {});
  await captura("caso1-analisis");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/plan/resultado/`);
  await captura("caso1-celular", false);
  await page.getByRole("button", { name: "Repruebo una" }).click();
  await page.locator("dialog[open] input[value=ISW01]").check();
  await captura("caso1-repruebo", false);
  await page.getByRole("button", { name: "Volver a planear" }).click();
  await page.waitForTimeout(1500);
  await captura("caso1-replaneado", false);
  await page.setViewportSize({ width: 1440, height: 900 });

  // Caso 2: nuevo ingreso de ISW (ISW-E1), toda la malla, medio tiempo.
  console.log("Caso 2");
  await abrirEjemplo(page, "ISW-E1");
  await page.goto(`${BASE}/plan/meta/`);
  await page.getByRole("button", { name: "Medio tiempo" }).click();
  await captura("caso2-meta");
  await buscarDesdeMeta(page);
  await captura("caso2-busqueda", false);
  await page.getByRole("link", { name: "Ver plan" }).click();
  await page.locator("[data-total]").waitFor();
  await captura("caso2-resultado");

  // Caso 3: nuevo ingreso de IRC (IRC-E1), llegar a la estadía, medio tiempo.
  console.log("Caso 3");
  await abrirEjemplo(page, "IRC-E1");
  await page.goto(`${BASE}/plan/meta/`);
  await page.getByText("Llegar a la estadía").click();
  await page.getByRole("button", { name: "Medio tiempo" }).click();
  await captura("caso3-meta");
  await buscarDesdeMeta(page);
  await captura("caso3-busqueda", false);
  await page.getByRole("link", { name: "Ver plan" }).click();
  await page.locator("[data-total]").waitFor();
  await captura("caso3-resultado");

  // Caso 4: meta imposible (T03), ISW23 sin oferta.
  console.log("Caso 4");
  await page.goto(`${BASE}/`);
  await page.getByRole("button", { name: "Crear plan nuevo" }).click();
  await page.waitForURL(/\/plan\/malla\/$/);
  await page.getByLabel("Malla").selectOption("ISW");
  const fila = page.locator("tbody tr").filter({ has: page.getByLabel("Nombre de ISW23") });
  for (const p of ["Ene", "May"]) await fila.getByText(p, { exact: true }).click();
  await fila.scrollIntoViewIfNeeded();
  await captura("caso4-malla", false);
  await page.getByRole("link", { name: "Continuar a historial" }).click();
  await page.getByRole("link", { name: "Continuar a meta" }).click();
  await page.getByRole("button", { name: "Buscar plan" }).click();
  await page.waitForURL(/\/plan\/sin-plan\/$/);
  await page.getByText("El resto se termina").waitFor();
  await captura("caso4-sin-plan");
} finally {
  await navegador.close();
  servidor.kill();
}
