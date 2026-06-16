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
  await page.goto("/", { waitUntil: "domcontentloaded" });
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

test("tab Trazabilidad visual muestra selector, leyenda y grafo", async ({ page }) => {
  await page.route("http://127.0.0.1:8000/trazabilidad/grafo**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        producto: "Bajadas Fullcolor",
        caso: "click_bajadas",
        legend: {
          variable_madre: "Editable si impacta hoy",
          derivado: "Calculado",
          tabla_pdf: "Precio fijo PDF",
        },
        nodes: [
          { id: "click_color", label: "Click color", type: "variable_madre", value: 39, unit: "ARS", editable_en_sistema: true, impacta_hoy: true, description: "Variable madre", source: "config", operation: "base", observation: "operativa" },
          { id: "precio_click_A3", label: "Precio click A3", type: "derivado", value: 195, unit: "ARS", editable_en_sistema: false, impacta_hoy: false, description: "A3 base", source: "Excel", operation: "x5", observation: "base proporcional" },
          { id: "precio_click_XL", label: "Precio click XL", type: "derivado", value: 390, unit: "ARS", editable_en_sistema: false, impacta_hoy: false, description: "XL deriva", source: "regla", operation: "x2", observation: "deriva desde A3" },
        ],
        edges: [
          { id: "e_click_a3", source: "click_color", target: "precio_click_A3", label: "escala a A3" },
          { id: "e_a3_xl", source: "precio_click_A3", target: "precio_click_XL", label: "x 2" },
        ],
      }),
    });
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByTestId("tab-trace-visual").click();
  await expect(page.getByTestId("trace-visual-title")).toBeVisible();
  await expect(page.getByTestId("trace-mode-cotizacion_actual")).toBeVisible();
  await expect(page.getByText("Primero calculá una cotización para ver su trazabilidad visual.")).toBeVisible();
  await page.getByTestId("trace-mode-caso_fijo").click();
  await expect(page.getByTestId("trace-case-select")).toBeVisible();
  await page.getByTestId("trace-load-button").click();
  await expect(page.getByTestId("trace-legend")).toBeVisible();
  await expect(page.getByTestId("trace-graph-container")).toBeVisible();
  await expect(page.getByTestId("trace-node-detail")).toContainText("Click color");
});

test("Trazabilidad visual de cotización actual usa material real cotizado", async ({ page }) => {
  await page.route("http://127.0.0.1:8000/bajadas-v2/cotizar", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        precio_unitario_sin_iva: 437.93,
        precio_unitario_con_urgencia: 437.93,
        precio_unitario_base_sin_iva: 437.93,
        cantidad_unidades: 1,
        cantidad_rango_aplicado: "1",
        total_sin_iva: 437.93,
        total_con_urgencia: 437.93,
        precio_sin_iva: 437.93,
        precio_con_recargo_urgencia: 437.93,
        adicional_laminado: "sin_adicional",
        regla_aplicada: "TEST_A4_115G",
        fuente: "mock_pdf",
        trazabilidad: { recargo_urgencia_aplicado: 0 },
      }),
    });
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Medida / formato").selectOption("A4");
  await page.getByLabel("Tipo de papel").selectOption("liviano");
  await page.getByLabel("Material").selectOption("Ilustracion");
  await page.getByLabel("Gramaje").selectOption("115g");
  await page.getByLabel("Cantidad").fill("1");
  await page.getByRole("button", { name: "Calcular" }).click();
  await expect(page.getByText("Total final con urgencia")).toBeVisible();

  await page.getByTestId("tab-trace-visual").click();
  await page.getByTestId("trace-mode-cotizacion_actual").click();
  await page.getByTestId("trace-current-load-button").click();
  await expect(page.getByTestId("trace-graph-container")).toContainText("Ilustracion 115g");
  await expect(page.getByTestId("trace-graph-container")).toContainText("Formato A4");
  await expect(page.getByTestId("trace-graph-container")).toContainText("Impresión 4/0");
  await expect(page.getByTestId("trace-graph-container")).toContainText("Total final");
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
  await expect(page.getByTestId("autoadh-laca-uv-checkbox")).toBeVisible();
  await expect(page.getByTestId("autoadh-tinta-blanca-checkbox")).toBeVisible();
  await expect(page.getByLabel("Laminado por lado")).toHaveCount(0);
  await expect(page.getByLabel("Plastificado (A3)")).toHaveCount(0);
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
    adicional_laca_uv: false,
    adicional_tinta_blanca: false,
  });

  await page.getByTestId("autoadh-tipo-select").selectOption("especial");
  await page.getByTestId("autoadh-laca-uv-checkbox").check();
  await page.getByLabel("Urgencia").selectOption("express");
  await page.getByRole("button", { name: "Calcular" }).click();
  expect(payloadSeen).toMatchObject({
    tipo_papel: "especial",
    material: "OPP blanco",
    columna_precio: "especial",
    formato: "XA3",
    urgencia: "express",
    adicional_laca_uv: true,
    adicional_tinta_blanca: false,
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

test("Variables principales expone solo valores seguros y permite guardar y recargar", async ({ page }) => {
  let tintaValue = 603;
  const variablesResponse = () => ({
    tipo_cambio: [{ key: "tipo_cambio_usd", label: "Tipo de cambio USD", value: 1410, unit: "ARS/USD", min: 1, max: 100000, step: 1, description: "Referencia", editable: true, tipo: "variable_madre", impacta_hoy: false, impact: "Preparado", confiabilidad: "alta", productos_afectados: ["Fórmulas futuras"] }],
    clicks: [
      { key: "click_color", label: "Click color", value: 3, unit: "ARS", min: 0.01, max: 100000, step: 0.01, description: "Click seguro", editable: true, tipo: "variable_madre", impacta_hoy: true, impact: "Traza circular", confiabilidad: "alta", productos_afectados: ["Stickers Circulares"] },
      { key: "click_bn_excel", label: "Click blanco y negro histórico", value: 39, unit: "ARS", min: 0.01, max: 100000, step: 0.01, description: "Click preparado", editable: true, tipo: "variable_madre", impacta_hoy: false, impact: "Preparado", confiabilidad: "media", productos_afectados: ["Bajadas futuras"] },
    ],
    papeles: [{ key: "obra_90g", label: "Papel obra/ilustración 90g", value: 14, unit: "USD", min: 0.01, max: 1000000, step: 0.01, description: "Material seguro", editable: true, tipo: "variable_madre", impacta_hoy: true, impact: "Traza circular", confiabilidad: "alta", productos_afectados: ["Stickers Circulares"] }],
    multiplicadores: [{ key: "multiplicador_general", label: "Multiplicador comercial general", value: 1, unit: "factor", min: 0.01, max: 100, step: 0.01, description: "Multiplicador seguro", editable: true, tipo: "variable_madre", impacta_hoy: true, impact: "Traza circular", confiabilidad: "alta", productos_afectados: ["Stickers Circulares"] }],
    adicionales: [{ key: "adicional_tinta_blanca_base_1_copia", label: "Tinta blanca Autoadhesivas (1 copia)", value: tintaValue, unit: "ARS/unidad", min: 0.01, max: 1000000, step: 0.01, description: "Adicional seguro", editable: true, tipo: "variable_madre", impacta_hoy: true, impact: "Cotización", confiabilidad: "alta", productos_afectados: ["Autoadhesivas"] }],
    variables_madre_impactan_hoy: [],
    variables_madre_preparadas: [],
    papeles_detectados: { "Papeles Bajadas": [{ key: "ilustracion_150g", label: "Ilustración 150G", editable: false, tipo: "detectado_sin_costo_base" }] },
    valores_derivados: [{ key: "precios_finales_por_rango", label: "Precios finales por rango", editable: false, tipo: "derivado", motivo_no_editable: "Derivado" }],
    tablas_fijas_pdf: [{ key: "matrices_pdf_productos", label: "Matrices PDF de productos", editable: false, tipo: "tabla_fija_pdf", motivo_no_editable: "Tabla fija" }],
    variables_no_encontradas: ["click_bn"],
  });
  await page.route("**/variables-principales/audit", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ variables_no_encontradas: ["click_bn"], advertencias: ["Sin matrices PDF"] }),
  }));
  await page.route("**/variables-principales/rangos", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ warning: "Rangos fijos", rangos: [{ grupo: "Bajadas Fullcolor / Kraft", rangos: ["1", "2 a 25"], editable: false, tipo: "rango_fijo", motivo: "Matriz cerrada", fuente: "data/test.json" }] }),
  }));
  await page.route("**/export/precios/pdf", (route) => route.fulfill({
    status: 200,
    contentType: "application/pdf",
    headers: { "Content-Disposition": 'attachment; filename="lista_precios_cotizador_test.pdf"' },
    body: "%PDF-1.4 test",
  }));
  await page.route("**/variables-principales", async (route) => {
    if (route.request().method() === "PUT") {
      const payload = JSON.parse(route.request().postData() || "{}");
      tintaValue = payload.updates.find((item) => item.key === "adicional_tinta_blanca_base_1_copia")?.value ?? tintaValue;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ updates: [{ key: "adicional_tinta_blanca_base_1_copia", previous_value: 603, new_value: tintaValue }] }),
      });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(variablesResponse()) });
  });

  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Variables principales" }).click();
  await expect(page.getByTestId("principal-variables-title")).toBeVisible();
  await expect(page.getByTestId("principal-impact-today")).toContainText("Variables madre que impactan hoy");
  await expect(page.getByTestId("principal-prepared")).toContainText("Variables madre preparadas");
  await expect(page.getByTestId("excel-import-preview-section")).toBeVisible();
  await expect(page.getByText("Modo actual: solo preview")).toBeVisible();
  await expect(page.getByTestId("excel-import-file")).toBeVisible();
  await expect(page.getByTestId("excel-import-preview-button")).toBeVisible();
  await expect(page.getByTestId("excel-import-apply-disabled")).toBeDisabled();
  await expect(page.getByText("Rangos fijos de matrices")).toBeVisible();
  await expect(page.getByText("Valores derivados y tablas PDF fijas")).toBeVisible();
  await expect(page.getByTestId("principal-derived-fixed").getByText("Tabla fija PDF")).toBeVisible();
  for (const group of ["tipo_cambio", "clicks", "papeles", "multiplicadores", "adicionales"]) {
    await expect(page.getByTestId(`principal-group-principal-prepared-${group}`)).toBeVisible();
  }
  await expect(page.getByTestId("principal-group-principal-impact-today-clicks")).toBeVisible();
  await expect(page.getByText("factor_ajuste_pdf")).toHaveCount(0);
  await expect(page.getByText("precio_objetivo_pdf")).toHaveCount(0);
  await expect(page.getByTestId("principal-detected-papers")).toBeVisible();
  await expect(page.getByTestId("principal-ranges")).toContainText("Bajadas Fullcolor / Kraft");
  await page.getByTestId("export-prices-pdf").click();
  await expect(page.getByTestId("principal-variables-message")).toContainText("PDF exportado correctamente");

  const tintaInput = page.getByTestId("principal-variable-adicional_tinta_blanca_base_1_copia");
  await tintaInput.fill("700");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByTestId("principal-variables-message")).toContainText("603");
  await expect(tintaInput).toHaveValue("700");
  await page.getByRole("button", { name: "Recargar valores" }).click();
  await expect(tintaInput).toHaveValue("700");
});

test("botón Limpiar y Copiar resultado", async ({ page }) => {
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

test("autoadhesivas especial + laca UV calcula y muestra regla adicional", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByTestId("categoria-select").selectOption("Bajadas Autoadhesivas");
  await page.getByTestId("autoadh-tipo-select").selectOption("especial");
  await page.getByLabel("Cantidad").fill("30");
  await page.getByTestId("autoadh-laca-uv-checkbox").check();

  await page.route("http://127.0.0.1:8000/bajadas-v2/cotizar", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        precio_unitario_sin_iva: 1389,
        precio_unitario_con_urgencia: 1389,
        precio_unitario_base_sin_iva: 1389,
        precio_unitario_con_adicional_sin_iva: 1495,
        adicional_laminado: "laca",
        adicional_unitario_sin_iva: 106,
        regla_adicional_aplicada: "ADICIONAL_LACA_UV_A3PLUS",
        fuente_adicional: "matriz_laca_uv_bajadas",
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
  await expect(page.getByText("ADICIONAL_LACA_UV_A3PLUS")).toBeVisible();
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

test("Folletos usa 10x15 como formato por defecto", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByTestId("categoria-select").selectOption("Folletos");
  await expect(page.getByTestId("formato-select")).toHaveValue("10x15");
});

test("Bajadas Fullcolor/ByN vuelve con formato default A3+", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByTestId("categoria-select").selectOption("Folletos");
  await page.getByTestId("categoria-select").selectOption("Bajadas Fullcolor/ByN");
  await expect(page.getByTestId("formato-select")).toHaveValue("A3+");
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
