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
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.getByRole("button", { name: "Cotizador" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Árbol del precio" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Configuración" })).toBeVisible();
  await expect(page.locator('img[src="/logoPromo.jpg"]')).toBeVisible();
  await expect(page.getByText(/API (conectada|no disponible)/)).toBeVisible();
  await expect(page.getByLabel("Adicional")).toBeVisible();
  await expect(page.getByTestId("formato-select")).toBeVisible();
  await page.getByTestId("print-option-1-0").click();
  await expect(page.getByTestId("formato-select")).toBeVisible();
  await expect(page.getByTestId("result-panel")).toBeVisible();
});

test("troquelado digital se usa como adicional en Bajadas y no como categoría principal", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.getByTestId("categoria-select").locator("option[value='Troquelado Digital']")).toHaveCount(0);
  await page.getByTestId("categoria-select").selectOption("Bajadas Fullcolor/ByN");
  await expect(page.getByLabel("Troquelado Digital")).toBeVisible();
  await page.getByLabel("Troquelado Digital").selectOption("true");
  await expect(page.getByLabel("Complejidad troquelado")).toBeVisible();
});

test("modo Autoadhesivas guiado: A3+ y 4/0 fijos, tipo papel/especial", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByTestId("categoria-select").selectOption("Bajadas Autoadhesivas");
  await expect(page.getByTestId("formato-select")).toHaveValue("A3+");
  await expect(page.getByTestId("formato-select").locator("option[value='XA3']")).toHaveCount(1);
  await expect(page.getByLabel("Impresión")).toHaveValue("4/0");
  await expect(page.getByLabel("Modo color")).toHaveValue("fullcolor");
  await expect(page.getByLabel("Tipo")).toBeVisible();
  await expect(page.getByText("Laca UV está disponible para autoadhesivas. Tinta blanca queda bloqueada hasta contar con datos confiables.")).toBeVisible();
  await expect(page.getByRole("button", { name: "1/0" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "1/1" })).toHaveCount(0);
});

test("autoadhesivas papel y especial envían payload válido", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByTestId("categoria-select").selectOption("Bajadas Autoadhesivas");
  await page.getByTestId("formato-select").selectOption("XA3");
  await page.getByLabel("Cantidad").fill("30");
  await expect(page.getByText("Rango aplicado: 26 a 50")).toBeVisible();

  let payloadSeen = null;
  await page.route("http://127.0.0.1:8000/bajadas-v2/cotizar", async (route) => {
    payloadSeen = JSON.parse(route.request().postData() || "{}");
    const isEspecial = payloadSeen?.columna_precio === "especial";
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        precio_unitario_sin_iva: isEspecial ? 1389 : 826,
        precio_unitario_con_urgencia: isEspecial ? 1597.35 : 949.9,
        cantidad_unidades: 30,
        cantidad_rango_aplicado: "26 a 50",
        total_sin_iva: isEspecial ? 41670 : 24780,
        total_con_urgencia: isEspecial ? 47920.5 : 28497,
        precio_sin_iva: isEspecial ? 1389 : 826,
        precio_con_recargo_urgencia: isEspecial ? 1597.35 : 949.9,
        regla_aplicada: isEspecial ? "AUTOADHESIVA_ESPECIAL_HIBRIDO_B_C" : "AUTOADHESIVA_PAPEL_HIBRIDO_B_C",
        fuente: "autoadhesivas_objetivo_calibrado",
        trazabilidad: {
          origen_excel: isEspecial ? "Bajadas!U4:U10 / OPP blco o blanco" : "Bajadas!S4:S10 / Sticker",
          recargo_urgencia_aplicado: 0.15,
          adicionales_excluidos: ["tinta blanca", "laca UV"],
        },
      }),
    });
  });

  await page.getByRole("button", { name: "Calcular" }).click();
  expect(payloadSeen).toMatchObject({
    categoria: "Bajadas Autoadhesivas",
    modo_color: "fullcolor",
    formato: "XA3",
    tipo_papel: "papel",
    material: "Sticker",
    gramaje: "N/A",
    cantidad_unidades: 30,
    cantidad_rango: "26 a 50",
    caras: "4/0",
    urgencia: "normal",
    tipo_producto: "autoadhesiva",
    columna_precio: "papel",
  });

  await page.getByTestId("autoadh-tipo-select").selectOption("especial");
  await page.getByLabel("Urgencia").selectOption("express");
  await page.getByRole("button", { name: "Calcular" }).click();
  expect(payloadSeen).toMatchObject({
    tipo_papel: "especial",
    material: "OPP blanco",
    columna_precio: "especial",
    formato: "XA3",
    urgencia: "express",
  });
});

test("cotizacion muestra rango aplicado y total destacado", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByLabel("Medida / formato").selectOption("A3+");
  await page.getByLabel("Tipo de papel").selectOption("liviano");
  await page.getByLabel("Material").selectOption("Ilustracion");
  await page.getByLabel("Gramaje").selectOption("150g");
  await page.getByLabel("Cantidad").fill("30");
  await page.getByLabel("Adicional").first().selectOption("laca");
  await expect(page.getByText("Rango aplicado: 26 a 50")).toBeVisible();

  await page.route("http://127.0.0.1:8000/bajadas-v2/cotizar", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        precio_unitario_sin_iva: 855,
        precio_unitario_con_urgencia: 983.25,
        precio_unitario_base_sin_iva: 855,
        precio_unitario_con_adicional_sin_iva: 981.043002,
        adicional_laminado: "laca",
        adicional_unitario_sin_iva: 126.043002,
        regla_adicional_aplicada: "ADICIONAL_LACA_UV_A3PLUS",
        fuente_adicional: "excel_laminado_readonly_a3plus",
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
  await expect(page.getByText("Adicional unitario sin IVA")).toBeVisible();
  await expect(page.getByText("Precio unitario con adicional")).toBeVisible();
});

test("tab Árbol del precio muestra composición del último cálculo", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByLabel("Medida / formato").selectOption("A3+");
  await page.getByLabel("Tipo de papel").selectOption("liviano");
  await page.getByLabel("Material").selectOption("Ilustracion");
  await page.getByLabel("Gramaje").selectOption("150g");
  await page.getByLabel("Cantidad").fill("30");
  await page.getByLabel("Adicional").first().selectOption("laca");

  await page.route("http://127.0.0.1:8000/bajadas-v2/cotizar", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        precio_unitario_sin_iva: 855,
        precio_unitario_con_urgencia: 855,
        precio_unitario_base_sin_iva: 855,
        precio_unitario_con_adicional_sin_iva: 981.043002,
        adicional_laminado: "laca",
        adicional_unitario_sin_iva: 126.043002,
        regla_adicional_aplicada: "ADICIONAL_LACA_UV_A3PLUS",
        fuente_adicional: "excel_laminado_readonly_a3plus",
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
  await expect(page.getByText("Adicional laminado/laca")).toBeVisible();
});

test("tab Configuración carga y permite ver historial", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Configuración" }).click();
  await expect(page.getByTestId("config-editable-title")).toBeVisible();
  await expect(page.getByText("Escalas de cantidad")).toBeVisible();
  await expect(page.getByRole("button", { name: "Guardar cambios" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Restaurar desde config final" })).toBeVisible();
});

test("botón Limpiar y Copiar resultado", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByLabel("Medida / formato").selectOption("A3+");
  await page.getByLabel("Tipo de papel").selectOption("liviano");
  await page.getByLabel("Material").selectOption("Ilustracion");
  await page.getByLabel("Gramaje").selectOption("150g");
  await page.getByLabel("Cantidad").fill("30");
  await page.getByLabel("Adicional").first().selectOption("laminado_brillo");

  await page.route("http://127.0.0.1:8000/bajadas-v2/cotizar", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        precio_unitario_sin_iva: 855,
        precio_unitario_con_urgencia: 855,
        precio_unitario_base_sin_iva: 855,
        precio_unitario_con_adicional_sin_iva: 1006.251602,
        adicional_laminado: "laminado_brillo",
        adicional_unitario_sin_iva: 151.251602,
        regla_adicional_aplicada: "ADICIONAL_LAMINADO_BRILLO_A3PLUS",
        fuente_adicional: "excel_laminado_readonly_a3plus",
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
  await expect(page.getByTestId("copy-status")).toContainText(/Precio final copiado\.|No se pudo copiar automáticamente\./);
  await page.getByTestId("clear-button").click();
  await expect(page.getByLabel("Cantidad")).toHaveValue("1");
  await expect(page.getByLabel("Adicional").first()).toHaveValue("sin_adicional");
});

test("autoadhesivas especial + laminado mate calcula y muestra regla adicional", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByTestId("categoria-select").selectOption("Bajadas Autoadhesivas");
  await page.getByTestId("autoadh-tipo-select").selectOption("especial");
  await page.getByLabel("Cantidad").fill("30");
  await page.getByLabel("Adicional").first().selectOption("laminado_mate");

  await page.route("http://127.0.0.1:8000/bajadas-v2/cotizar", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        precio_unitario_sin_iva: 1389,
        precio_unitario_con_urgencia: 1389,
        precio_unitario_base_sin_iva: 1389,
        precio_unitario_con_adicional_sin_iva: 1564.451858,
        adicional_laminado: "laminado_mate",
        adicional_unitario_sin_iva: 175.451858,
        regla_adicional_aplicada: "ADICIONAL_LAMINADO_MATE_A3PLUS",
        fuente_adicional: "excel_laminado_readonly_a3plus",
        cantidad_unidades: 30,
        cantidad_rango_aplicado: "26 a 50",
        total_sin_iva: 46933.55574,
        total_con_urgencia: 46933.55574,
        precio_sin_iva: 1389,
        precio_con_recargo_urgencia: 1389,
        regla_aplicada: "AUTOADHESIVA_ESPECIAL_HIBRIDO_B_C",
        fuente: "autoadhesivas_objetivo_calibrado",
        trazabilidad: { recargo_urgencia_aplicado: 0 },
      }),
    });
  });

  await page.getByRole("button", { name: "Calcular" }).click();
  await expect(page.getByText("Regla adicional aplicada")).toBeVisible();
  await expect(page.getByText("ADICIONAL_LAMINADO_MATE_A3PLUS")).toBeVisible();
});

test("XA3 visible en Fullcolor, ByN y Autoadhesivas", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });

  await page.getByTestId("categoria-select").selectOption("Bajadas Fullcolor/ByN");
  await page.getByTestId("print-option-4-0").click();
  await expect(page.getByTestId("formato-select").locator("option[value='XA3']")).toHaveCount(1);
  await page.getByTestId("formato-select").selectOption("XA3");
  await expect(page.getByLabel("Tipo de papel").locator("option[value='liviano']")).toHaveCount(1);

  await page.getByTestId("print-option-1-0").click();
  await expect(page.getByTestId("formato-select").locator("option[value='XA3']")).toHaveCount(1);
  await page.getByTestId("formato-select").selectOption("XA3");
  await expect(page.getByLabel("Tipo de papel").locator("option[value='liviano']")).toHaveCount(1);

  await page.getByTestId("categoria-select").selectOption("Bajadas Autoadhesivas");
  await expect(page.getByTestId("formato-select").locator("option[value='A3+']")).toHaveCount(1);
  await expect(page.getByTestId("formato-select").locator("option[value='XA3']")).toHaveCount(1);
  await expect(page.getByTestId("autoadh-tipo-select").locator("option[value='papel']")).toHaveCount(1);
  await expect(page.getByTestId("autoadh-tipo-select").locator("option[value='especial']")).toHaveCount(1);
});

test("XA3 muestra trazabilidad de derivación 1.10", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByTestId("categoria-select").selectOption("Bajadas Fullcolor/ByN");
  await page.getByTestId("print-option-4-0").click();
  await page.getByTestId("formato-select").selectOption("XA3");
  await page.getByLabel("Tipo de papel").selectOption("liviano");
  await page.getByLabel("Material").selectOption("Ilustracion");
  await page.getByLabel("Gramaje").selectOption("150g");
  await page.getByLabel("Cantidad").fill("30");

  await page.route("http://127.0.0.1:8000/bajadas-v2/cotizar", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        precio_unitario_sin_iva: 940.5,
        precio_unitario_con_urgencia: 940.5,
        cantidad_unidades: 30,
        cantidad_rango_aplicado: "26 a 50",
        total_sin_iva: 28215,
        total_con_urgencia: 28215,
        precio_sin_iva: 940.5,
        precio_con_recargo_urgencia: 940.5,
        regla_aplicada: "FACTOR_XA3_1_10",
        fuente: "modelo_d",
        trazabilidad: {
          base_formato: "A3+",
          factor_aplicado: 1.10,
          regla_especial: "FACTOR_XA3_1_10",
          recargo_urgencia_aplicado: 0
        },
      }),
    });
  });

  await page.getByRole("button", { name: "Calcular" }).click();
  await page.getByTestId("tab-price-tree").click();
  await expect(page.getByText("base_formato: A3+")).toBeVisible();
  await expect(page.getByText("factor_aplicado: 1.1")).toBeVisible();
  await expect(page.getByText("regla_especial: FACTOR_XA3_1_10")).toBeVisible();
});

test("stickers corte recto calcula totales de matriz PDF", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByTestId("categoria-select").selectOption("Stickers Corte Recto");
  await page.getByLabel("Formato").selectOption("6x4");
  await page.getByLabel("Terminación").selectOption("sin_laca_uv");
  await page.getByLabel("Cantidad").fill("100");
  await page.getByRole("button", { name: "Calcular" }).click();
  await expect(page.getByTestId("result-panel")).toContainText("2.765");

  await page.getByLabel("Formato").selectOption("10x7");
  await page.getByLabel("Terminación").selectOption("con_laca_uv");
  await page.getByLabel("Cantidad").fill("1000");
  await page.getByRole("button", { name: "Calcular" }).click();
  await expect(page.getByTestId("result-panel")).toContainText("61.703");
});

test("imanes corte recto calcula totales de matriz PDF", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByTestId("categoria-select").selectOption("Imanes Corte Recto");
  await page.getByLabel("Formato").selectOption("6x4");
  await page.getByLabel("Terminación").selectOption("sin_laca_uv");
  await page.getByLabel("Cantidad").fill("100");
  await page.getByRole("button", { name: "Calcular" }).click();
  await expect(page.getByTestId("result-panel")).toContainText("7.526");

  await page.getByLabel("Formato").selectOption("10x7");
  await page.getByLabel("Terminación").selectOption("con_laca_uv");
  await page.getByLabel("Cantidad").fill("1000");
  await page.getByRole("button", { name: "Calcular" }).click();
  await expect(page.getByTestId("result-panel")).toContainText("153.680");
});

test("stickers circulares calcula totales de matriz PDF", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByTestId("categoria-select").selectOption("Stickers Circulares");
  await page.getByLabel("Material").selectOption("obra_ilustracion_90g");
  await page.getByLabel("Formato / diámetro").selectOption("1cm");
  await page.getByLabel("Terminación").selectOption("sin_laca_uv");
  await page.getByLabel("Cantidad").fill("100");
  await page.getByRole("button", { name: "Calcular" }).click();
  await expect(page.getByTestId("result-panel")).toContainText("2.313");

  await page.getByLabel("Material").selectOption("fluo");
  await page.getByLabel("Formato / diámetro").selectOption("18-20cm");
  await page.getByLabel("Terminación").selectOption("con_laca_uv_brillo");
  await page.getByLabel("Cantidad").fill("1000");
  await page.getByRole("button", { name: "Calcular" }).click();
  await expect(page.getByTestId("result-panel")).toContainText("481.291");
});
