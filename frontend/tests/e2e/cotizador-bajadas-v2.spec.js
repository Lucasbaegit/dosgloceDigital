import { test, expect } from "@playwright/test";

test("pantalla carga en dark mode, logo y controles UX", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Cotizador Bajadas" })).toBeVisible();
  await expect(page.locator('img[src="/logoPromo.jpg"]')).toBeVisible();
  await expect(page.getByText(/API (conectada|no disponible)/)).toBeVisible();
  await expect(page.getByText("Categoría (automática)")).toBeVisible();
  await expect(page.getByLabel("Material")).toHaveJSProperty("tagName", "SELECT");
  await expect(page.getByLabel("Gramaje")).toHaveJSProperty("tagName", "SELECT");
  await expect(page.getByLabel("Cantidad")).toHaveJSProperty("tagName", "INPUT");
  await expect(page.getByRole("button", { name: "Calcular" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Limpiar" })).toBeVisible();
});

test("muestra rango aplicado para cantidad 30 y total final", async ({ page }) => {
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
        precio_unitario_con_urgencia: 855,
        cantidad_unidades: 30,
        cantidad_rango_aplicado: "26 a 50",
        total_sin_iva: 25650,
        total_con_urgencia: 25650,
        precio_sin_iva: 855,
        precio_con_recargo_urgencia: 855,
        regla_aplicada: "MODELO_D_D2_BASE_A3+",
        fuente: "modelo_d",
        trazabilidad: { recargo_urgencia_aplicado: 0 },
      }),
    });
  });

  await page.getByRole("button", { name: "Calcular" }).click();
  await expect(page.getByText("Total final con urgencia")).toBeVisible();
  await expect(page.getByRole("heading", { name: "$25.650 ARS" })).toBeVisible();
});

test("boton Limpiar resetea cantidad y oculta resultado", async ({ page }) => {
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
        trazabilidad: { recargo_urgencia_aplicado: 0 },
      }),
    });
  });

  await page.getByRole("button", { name: "Calcular" }).click();
  await expect(page.getByText("Total final con urgencia")).toBeVisible();

  await page.getByRole("button", { name: "Limpiar" }).click();
  await expect(page.getByLabel("Cantidad")).toHaveValue("1");
  await expect(page.getByText("Completá los datos y presioná Calcular.")).toBeVisible();
});

test("copiar resultado muestra confirmacion", async ({ page }) => {
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
        precio_unitario_con_urgencia: 983.25,
        cantidad_unidades: 30,
        cantidad_rango_aplicado: "26 a 50",
        total_sin_iva: 25650,
        total_con_urgencia: 29497.5,
        precio_sin_iva: 855,
        precio_con_recargo_urgencia: 983.25,
        regla_aplicada: "MODELO_D_D2_BASE_A3+",
        fuente: "modelo_d",
        trazabilidad: { recargo_urgencia_aplicado: 0.15 },
      }),
    });
  });

  await page.getByRole("button", { name: "Calcular" }).click();
  await page.getByRole("button", { name: "Copiar resultado" }).click();
  await expect(page.getByText("Resultado copiado.")).toBeVisible();
});


test("Enter dispara cotizacion", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Medida / formato").selectOption("A3+");
  await page.getByLabel("Tipo de papel").selectOption("liviano");
  await page.getByLabel("Material").selectOption("Ilustracion");
  await page.getByLabel("Gramaje").selectOption("150g");
  await page.getByLabel("Cantidad").fill("30");

  let calls = 0;
  await page.route("http://127.0.0.1:8000/bajadas-v2/cotizar", async (route) => {
    calls += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        precio_unitario_sin_iva: 800,
        precio_unitario_con_urgencia: 800,
        cantidad_unidades: 30,
        cantidad_rango_aplicado: "26 a 50",
        total_sin_iva: 24000,
        total_con_urgencia: 24000,
        precio_sin_iva: 800,
        precio_con_recargo_urgencia: 800,
        regla_aplicada: "TEST",
        fuente: "modelo_d",
        trazabilidad: { recargo_urgencia_aplicado: 0 },
      }),
    });
  });

  await page.getByRole("button", { name: "Calcular" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Precio unitario")).toBeVisible();
  expect(calls).toBeGreaterThan(0);
});
