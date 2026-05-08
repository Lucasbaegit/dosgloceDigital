import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: async () => Promise.resolve(),
      },
    });
  });
});

test("UI muestra tabs nuevas y controles base", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Cotizador" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Árbol del precio" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Configuración" })).toBeVisible();
  await expect(page.locator('img[src="/logoPromo.jpg"]')).toBeVisible();
  await expect(page.getByText(/API (conectada|no disponible)/)).toBeVisible();
});

test("cotizacion muestra rango aplicado y total destacado", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Medida / formato").selectOption("A3+");
  await page.getByLabel("Tipo de papel").selectOption("liviano");
  await page.getByLabel("Material").selectOption("Ilustracion");
  await page.getByLabel("Gramaje").selectOption("150g");
  await page.getByLabel("Cantidad").fill("30");
  await expect(page.getByText("Rango aplicado: 26 a 50")).toBeVisible();

  await page.route("http://127.0.0.1:8000/bajadas-v2/cotizar", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        precio_unitario_sin_iva: 855,
        precio_unitario_con_urgencia: 983.25,
        cantidad_unidades: 30,
        cantidad_rango_aplicado: "26 a 50",
        total_sin_iva: 25650,
        total_con_urgencia: 29497.5,
        precio_sin_iva: 855,
        precio_con_recargo_urgencia: 983.25,
        regla_aplicada: "MODELO_D_D2_BASE_A3+",
        fuente: "modelo_d",
        trazabilidad: { recargo_urgencia_aplicado: 0.15, factor_aplicado: 1, an40_estado: "PENDIENTE_DE_INTERPRETACION" },
      }),
    });
  });

  await page.getByRole("button", { name: "Calcular" }).click();
  await expect(page.getByText("Total final con urgencia")).toBeVisible();
  await expect(page.getByRole("heading", { name: "$29.497,5 ARS" })).toBeVisible();
});

test("tab Árbol del precio muestra composición del último cálculo", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Medida / formato").selectOption("A3+");
  await page.getByLabel("Tipo de papel").selectOption("liviano");
  await page.getByLabel("Material").selectOption("Ilustracion");
  await page.getByLabel("Gramaje").selectOption("150g");
  await page.getByLabel("Cantidad").fill("30");

  await page.route("http://127.0.0.1:8000/bajadas-v2/cotizar", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        precio_unitario_sin_iva: 855,
        precio_unitario_con_urgencia: 855,
        cantidad_unidades: 30,
        cantidad_rango_aplicado: "26 a 50",
        total_sin_iva: 25650,
        total_con_urgencia: 25650,
        precio_sin_iva: 855,
        precio_con_recargo_urgencia: 855,
        regla_aplicada: "MODELO_D_D2_BASE_A3+",
        fuente: "modelo_d",
        trazabilidad: { recargo_urgencia_aplicado: 0, factor_aplicado: 1, an40_estado: "PENDIENTE_DE_INTERPRETACION" },
      }),
    });
  });

  await page.getByRole("button", { name: "Calcular" }).click();
  await page.getByTestId("tab-price-tree").click();
  await expect(page.getByText("Entrada del usuario")).toBeVisible();
  await expect(page.getByText("Rango aplicado")).toBeVisible();
  await expect(page.getByTestId("price-tree-rule-section")).toBeVisible();
});

test("tab Configuración carga y permite ver historial", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Configuración" }).click();
  await expect(page.getByTestId("config-editable-title")).toBeVisible();
  await expect(page.getByText("Escalas de cantidad")).toBeVisible();
  await expect(page.getByRole("button", { name: "Guardar cambios" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Restaurar desde config final" })).toBeVisible();
});

test("botón Limpiar y Copiar resultado", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Medida / formato").selectOption("A3+");
  await page.getByLabel("Tipo de papel").selectOption("liviano");
  await page.getByLabel("Material").selectOption("Ilustracion");
  await page.getByLabel("Gramaje").selectOption("150g");
  await page.getByLabel("Cantidad").fill("30");

  await page.route("http://127.0.0.1:8000/bajadas-v2/cotizar", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        precio_unitario_sin_iva: 855,
        precio_unitario_con_urgencia: 855,
        cantidad_unidades: 30,
        cantidad_rango_aplicado: "26 a 50",
        total_sin_iva: 25650,
        total_con_urgencia: 25650,
        precio_sin_iva: 855,
        precio_con_recargo_urgencia: 855,
        regla_aplicada: "MODELO_D_D2_BASE_A3+",
        fuente: "modelo_d",
        trazabilidad: { recargo_urgencia_aplicado: 0, factor_aplicado: 1, an40_estado: "PENDIENTE_DE_INTERPRETACION" },
      }),
    });
  });

  await page.getByRole("button", { name: "Calcular" }).click();
  await page.getByTestId("copy-result-button").click();
  await expect(page.getByTestId("copy-status")).toContainText(/Resultado copiado\.|No se pudo copiar automáticamente\./);
  await page.getByTestId("clear-button").click();
  await expect(page.getByLabel("Cantidad")).toHaveValue("1");
});
