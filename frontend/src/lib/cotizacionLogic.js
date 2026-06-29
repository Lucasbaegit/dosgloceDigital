const PRODUCT_KEY_BY_CATEGORY = {
  "Bajadas Fullcolor": "bajadas_fullcolor_byn",
  "Bajadas ByN": "bajadas_fullcolor_byn",
  "Bajadas Fullcolor/ByN": "bajadas_fullcolor_byn",
  "Bajadas Autoadhesivas": "bajadas_autoadhesivas",
  "Bajadas Kraft": "bajadas_kraft",
  "Tarjetas Personales": "tarjetas_9x5",
  "Tarjetas Personales 9x5": "tarjetas_9x5",
  "Tarjetas Postales": "tarjetas_postales",
  "Folletos": "folletos",
  "Carpetas": "carpetas",
  "Sobres": "sobres",
  "Stickers Corte Recto": "stickers_corte_recto",
  "Imanes Corte Recto": "imanes_corte_recto",
  "Stickers Circulares": "stickers_circulares",
  "Tarjetas Troqueladas Circulares": "tarjetas_troqueladas_circulares",
  "Plancha de Imán Impreso": "plancha_iman_impreso",
  "Agendas / Cuadernos": "agendas_cuadernos",
  "Agendas/Cuadernos": "agendas_cuadernos",
};
const TARJETAS_TERMINACIONES = [
  { label: "Sin laminar", value: "sin_laminar" },
  { label: "Laca UV", value: "laca_uv" },
  { label: "Laminado brillo", value: "laminado_brillo" },
  { label: "Laminado mate", value: "laminado_mate" },
];
const POSTALES_TERMINACIONES = TARJETAS_TERMINACIONES;
const CARPETAS_TERMINACIONES = [
  { label: "Sin laminar", value: "sin_laminar" },
  { label: "Laca UV", value: "laca_uv" },
  { label: "Laminado brillo", value: "laminado_brillo" },
  { label: "Laminado mate", value: "laminado_mate" },
];
const STICKERS_TERMINACIONES = [
  { label: "Sin laca UV", value: "sin_laca_uv" },
  { label: "Con laca UV", value: "con_laca_uv" },
];
const IMANES_TERMINACIONES = STICKERS_TERMINACIONES;
const STICKERS_CIRCULARES_TERMINACIONES = [
  { label: "Sin laca UV", value: "sin_laca_uv" },
  { label: "Laca UV brillo (+15%)", value: "con_laca_uv_brillo" },
];

function readableQuoteText(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b(\d+g)\s+Ilustracion\b/g, "Ilustración $1")
    .replace(/\b(\d+g)\s+Ilustración\b/g, "Ilustración $1")
    .replace(/\bIlustracion\b/g, "Ilustración")
    .replace(/\bimpresion\b/g, "impresión")
    .replace(/\blaminado brillo\b/g, "laminado brillo")
    .trim();
}

export function describeCurrentQuoteMaterial(payload) {
  const material = payload?.material || payload?.papel || payload?.tipo_papel || "Material no informado";
  const gramaje = payload?.gramaje && payload.gramaje !== "N/A" ? ` ${payload.gramaje}` : "";
  if (gramaje && String(material).toLowerCase().includes(String(payload.gramaje).toLowerCase())) return String(material).trim();
  return `${material}${gramaje}`.trim();
}



export function getQuoteProductKey(payload) {
  if (!payload) return null;
  if (payload.producto_key) return payload.producto_key;
  if (payload.categoria && PRODUCT_KEY_BY_CATEGORY[payload.categoria]) return PRODUCT_KEY_BY_CATEGORY[payload.categoria];
  if (payload.categoria_ui && PRODUCT_KEY_BY_CATEGORY[payload.categoria_ui]) return PRODUCT_KEY_BY_CATEGORY[payload.categoria_ui];
  if (payload.producto === "9x5") return "tarjetas_9x5";
  if (payload.producto === "postal") return "tarjetas_postales";
  if (payload.producto === "folleto") return "folletos";
  if (payload.producto === "carpeta_a4") return "carpetas";
  if (payload.producto === "sobre") return "sobres";
  if (payload.producto === "sticker_corte_recto") return "stickers_corte_recto";
  if (payload.producto === "iman_corte_recto") return "imanes_corte_recto";
  if (payload.producto === "sticker_circular") return "stickers_circulares";
  if (payload.producto === "tarjeta_troquelada_circular") return "tarjetas_troqueladas_circulares";
  if (payload.producto === "plancha_iman_impreso") return "plancha_iman_impreso";
  if (payload.producto === "agenda_cuaderno") return "agendas_cuadernos";
  return null;
}



export function getQuoteProductLabel(payload, impactData) {
  const productKey = getQuoteProductKey(payload);
  const fromMap = (impactData?.productos || []).find((item) => item.key === productKey);
  return fromMap?.label || payload?.categoria || payload?.categoria_ui || "Cotización actual";
}



export function normalizeScopeValue(value) {
  return String(value ?? "").trim().toLowerCase();
}



export function scopeIncludes(scopeValues, currentValues) {
  if (!Array.isArray(scopeValues) || !scopeValues.length) return true;
  const normalizedScope = scopeValues.map(normalizeScopeValue);
  const normalizedCurrent = (Array.isArray(currentValues) ? currentValues : [currentValues])
    .filter((value) => value !== undefined && value !== null && value !== "")
    .map(normalizeScopeValue);
  return normalizedCurrent.some((value) => normalizedScope.includes(value));
}



export function relationScopeKeys(relation) {
  return Object.keys(relation?.aplica_a || {}).filter((key) => {
    const value = relation.aplica_a[key];
    return Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null;
  });
}



export function relationMatchKind(relation) {
  const keys = relationScopeKeys(relation);
  if (!keys.length) return "base_dependency_match";
  const haystack = [
    relation?.variable,
    relation?.variable_label,
    relation?.componente,
    relation?.detalle,
    ...(relation?.ruta_calculo || []),
  ].filter(Boolean).join(" ").toLowerCase();
  if (keys.some((key) => ["formatos", "cantidades", "rangos", "terminaciones", "adicionales", "caras", "gramajes", "materiales", "modo_color", "tipo_papel"].includes(key))) {
    return "scope_exact_match";
  }
  if (haystack.includes("multiplicador") || haystack.includes("base") || haystack.includes("papel") || haystack.includes("material") || haystack.includes("click") || haystack.includes("cambio")) {
    return "base_dependency_match";
  }
  return "product_dependency_match";
}



export function relationContextBadge(relation) {
  const kind = relationMatchKind(relation);
  const haystack = [
    relation?.variable,
    relation?.variable_label,
    relation?.componente,
    relation?.detalle,
  ].filter(Boolean).join(" ").toLowerCase();
  if (kind === "base_dependency_match") {
    if (haystack.includes("papel") || haystack.includes("material") || haystack.includes("gramaje")) return "Papel / material";
    if (haystack.includes("click") || haystack.includes("impresi")) return "Impresión";
    if (haystack.includes("multiplicador")) return "Multiplicador";
    if (haystack.includes("cambio") || haystack.includes("usd")) return "Global usada";
    return "Base del cálculo";
  }
  if (haystack.includes("cantidad") || haystack.includes("rango")) return "Cantidad";
  if (haystack.includes("impresi") || haystack.includes("cara")) return "Impresión";
  if (haystack.includes("formato")) return "Formato";
  if (haystack.includes("terminaci") || haystack.includes("laca") || haystack.includes("laminado")) return "Terminación";
  if (haystack.includes("gramaje") || haystack.includes("papel") || haystack.includes("material")) return "Papel / material";
  return "Scope exacto";
}



export function getCurrentQuoteRange(payload, result) {
  return (
    result?.cantidad_rango_aplicado ||
    result?.rango_aplicado ||
    payload?.cantidad_rango ||
    payload?.cantidad_unidades
  );
}



export function getCurrentQuoteTerminacion(payload) {
  return (
    payload?.terminacion_stickers_circulares ||
    payload?.terminacion_stickers ||
    payload?.terminacion_imanes ||
    payload?.terminacion_tarjetas ||
    payload?.terminacion_carpetas ||
    payload?.terminacion ||
    payload?.adicional_laminado ||
    "sin_laca_uv"
  );
}



export function getCurrentQuoteAdditionsForScope(payload) {
  const additions = new Set();
  const adicional = payload?.adicional_laminado;
  if (adicional && adicional !== "sin_adicional") additions.add(adicional);
  if (payload?.adicional_laca_uv || adicional === "laca") {
    additions.add("laca");
    additions.add("adicional_laca_uv");
  }
  if (payload?.adicional_tinta_blanca || adicional === "tinta_blanca") {
    additions.add("tinta_blanca");
    additions.add("adicional_tinta_blanca");
  }
  if (payload?.adicional_troquelado) additions.add("troquelado_digital");
  if (payload?.solapa_impresa) additions.add("solapa_impresa");
  if (payload?.adicional_plastificado) additions.add("plastificado");
  if (payload?.adicional_laminado_por_lado && payload.adicional_laminado_por_lado !== "sin_adicional") {
    additions.add(payload.adicional_laminado_por_lado);
  }
  return Array.from(additions);
}



export function relationAppliesToCurrentQuote(relation, payload, result = null) {
  const applies = relation?.aplica_a || {};
  if (!payload || !applies || !Object.keys(applies).length) return true;
  if (!scopeIncludes(applies.formatos, [payload.formato, payload.formato_agendas])) {
    return false;
  }
  if (!scopeIncludes(applies.cantidades, payload.cantidad_unidades)) {
    return false;
  }
  if (!scopeIncludes(applies.rangos, getCurrentQuoteRange(payload, result))) {
    return false;
  }
  if (!scopeIncludes(applies.terminaciones, getCurrentQuoteTerminacion(payload))) {
    return false;
  }
  if (!scopeIncludes(applies.adicionales, getCurrentQuoteAdditionsForScope(payload))) {
    return false;
  }
  if (!scopeIncludes(applies.caras, [payload.caras, payload.caras_tarjetas_troq_circ])) {
    return false;
  }
  if (!scopeIncludes(applies.modo_color, [payload.modo_color, payload.modo_color_folleto])) {
    return false;
  }
  if (!scopeIncludes(applies.tipo_papel, payload.tipo_papel)) {
    return false;
  }
  if (!scopeIncludes(applies.gramajes, payload.gramaje)) {
    return false;
  }
  if (!scopeIncludes(applies.materiales, payload.material)) {
    return false;
  }
  if (!scopeIncludes(applies.tipos_sobre, payload.tipo_sobre)) {
    return false;
  }
  if (!scopeIncludes(applies.variantes, payload.variante)) {
    return false;
  }
  if (!scopeIncludes(applies.productos, payload.producto)) {
    return false;
  }
  if (!scopeIncludes(applies.paginas, payload.paginas)) {
    return false;
  }
  if (Array.isArray(applies.solapa_impresa) && applies.solapa_impresa.length) {
    const current = Boolean(payload.solapa_impresa);
    if (!applies.solapa_impresa.some((value) => Boolean(value) === current)) return false;
  }
  return true;
}



export function collectCurrentQuoteAdditions(payload, result) {
  const additions = [];
  if (result?.adicional_laminado && result.adicional_laminado !== "sin_adicional") {
    additions.push({
      label: result.adicional_laminado,
      value: result.total_adicional_sin_iva ?? result.adicional_unitario_sin_iva,
      detail: `Unitario ${formatMoney(result.adicional_unitario_sin_iva ?? 0)} x ${result.caras_adicional_laminado ?? payload?.caras_adicional_laminado ?? 1} cara(s)`,
      source: result.fuente_adicional || result.trazabilidad?.adicional_laminado?.fuente || "motor de adicionales",
    });
  }
  const autoadh = result?.trazabilidad?.adicionales_autoadhesiva || {};
  if (autoadh.laca_uv) {
    additions.push({ label: "Laca UV", value: autoadh.laca_uv.subtotal_laca_uv, detail: "Adicional autoadhesiva", source: autoadh.laca_uv.fuente || "matriz_laca_uv_bajadas" });
  }
  if (autoadh.tinta_blanca) {
    additions.push({ label: "Tinta blanca", value: autoadh.tinta_blanca.subtotal_tinta_blanca, detail: "Proporcional por cantidad", source: autoadh.tinta_blanca.fuente_config || "config autoadhesivas" });
  }
  const hoja4 = result?.trazabilidad?.adicionales_hoja4?.detalle || {};
  Object.entries(hoja4).forEach(([key, value]) => {
    if (value && value.subtotal) additions.push({ label: key, value: value.subtotal, detail: value.regla || "Adicional hoja 4", source: value.fuente || "PDF hoja 4 / Excel" });
  });
  if (result?.adicional_troquelado) {
    additions.push({
      label: `Troquelado ${result.complejidad_troquelado || payload?.complejidad_troquelado || ""}`.trim(),
      value: result.total_adicional_troquelado_sin_iva,
      detail: `Unitario ${formatMoney(result.adicional_troquelado_unitario_sin_iva ?? 0)}`,
      source: result.fuente_troquelado || "PDF Troqueles digitales",
    });
  }
  return additions;
}



export function optionLabel(options, value, fallback = "No aplica") {
  if (value === undefined || value === null || value === "") return fallback;
  const found = (options || []).find((item) => String(item.value) === String(value));
  return found?.label || String(value).replaceAll("_", " ");
}



export function getTerminacionOptionsForQuote(payload) {
  const productKey = getQuoteProductKey(payload);
  if (productKey === "tarjetas_9x5") return TARJETAS_TERMINACIONES;
  if (productKey === "tarjetas_postales") return POSTALES_TERMINACIONES;
  if (productKey === "carpetas") return CARPETAS_TERMINACIONES;
  if (productKey === "stickers_corte_recto") return STICKERS_TERMINACIONES;
  if (productKey === "imanes_corte_recto") return IMANES_TERMINACIONES;
  if (productKey === "stickers_circulares") return STICKERS_CIRCULARES_TERMINACIONES;
  return [];
}



export function describeQuoteTerminacion(payload) {
  if (!payload) return "No disponible";
  const productKey = getQuoteProductKey(payload);
  if (productKey === "carpetas") {
    const base = optionLabel(CARPETAS_TERMINACIONES, payload.terminacion, "Sin terminación");
    return payload.solapa_impresa ? `${base} + solapa impresa` : base;
  }
  if (productKey === "tarjetas_troqueladas_circulares") {
    if (!payload.adicional_laminado || payload.adicional_laminado === "sin_adicional") return "Sin laminado";
    const caras = Number(payload.caras_adicional_laminado || 0);
    return `${optionLabel([
      { value: "laminado_brillo", label: "Laminado brillo" },
      { value: "laminado_mate", label: "Laminado mate" },
    ], payload.adicional_laminado, payload.adicional_laminado)} · ${caras === 2 ? "ambas caras" : "1 cara"}`;
  }
  const terminacion = payload.terminacion || getCurrentQuoteTerminacion(payload);
  const options = getTerminacionOptionsForQuote(payload);
  if (!options.length) return "No aplica";
  return optionLabel(options, terminacion, "Sin terminación");
}



export function describeQuoteOperationalAdditions(payload, result) {
  const additions = collectCurrentQuoteAdditions(payload, result)
    .map((item) => item.label)
    .filter(Boolean);
  if (additions.length) return additions.join(" + ");
  const productKey = getQuoteProductKey(payload);
  if (productKey && !String(productKey).startsWith("bajadas_")) return "No aplica";
  return "Sin adicional";
}



export function inferPriceSourceKind(result) {
  const text = [
    result?.modo_precio,
    result?.modo_calculo,
    result?.fuente,
    result?.regla_aplicada,
    result?.trazabilidad?.modo_precio,
    result?.trazabilidad?.modo_calculo,
    result?.trazabilidad?.fuente_precio_final,
  ].filter(Boolean).join(" ").toLowerCase();
  if (text.includes("formula_editable") || text.includes("formula_calibrada")) return "formula_editable_calibrada";
  if (text.includes("formula") || text.includes("fórmula")) return "formula_directa";
  if (text.includes("pdf") || text.includes("matriz") || text.includes("lista")) return "matriz_pdf";
  return "motor_interno";
}



export function sourceKindLabel(kind) {
  if (kind === "formula_editable_calibrada") return "Fórmula editable calibrada";
  if (kind === "formula_directa") return "Fórmula directa";
  if (kind === "matriz_pdf") return "Matriz PDF/lista validada";
  return "Motor interno";
}



export function sourceKindExplanation(kind) {
  if (kind === "formula_editable_calibrada") {
    return "El precio se calcula con fórmula editable calibrada contra PDF/lista.";
  }
  if (kind === "formula_directa") {
    return "El precio se calcula directamente con variables editables del sistema.";
  }
  if (kind === "matriz_pdf") {
    return "El precio final sigue validado por matriz PDF/lista. Las variables editables sirven para preview, trazabilidad y futura fórmula calibrada.";
  }
  return "El precio sale del motor interno del producto. Si falta un dato de fuente, se muestra como no disponible sin inventarlo.";
}



export function quoteUsesFixedPdf(_payload, result, relation = {}) {
  if (!result) return false;
  if (relation?.modo_precio === "matriz_pdf" || relation?.tipo === "matriz_pdf") return true;
  return inferPriceSourceKind(result) === "matriz_pdf";
}



export function buildCurrentQuoteSummary(payload, result) {
  if (!payload || !result) return null;
  const product = payload.categoria || payload.producto || "Cotización";
  const format = payload.formato || "formato no disponible";
  const material = describeCurrentQuoteMaterial(payload);
  const print = payload.caras || payload.caras_tarjetas_troq_circ || "impresión no disponible";
  const quantity = payload.cantidad_unidades || result.cantidad_unidades || "cantidad no disponible";
  const range = result.cantidad_rango_aplicado || payload.cantidad_rango || result.cantidad_unidades || "no disponible";
  const addition = describeQuoteOperationalAdditions(payload, result);
  const terminacion = describeQuoteTerminacion(payload);
  const parts = [
    readableQuoteText(product),
    readableQuoteText(format),
    readableQuoteText(material),
    `impresión ${print}`,
    `cantidad ${quantity}`,
    `rango ${range}`,
    addition && addition !== "No aplica" ? addition : terminacion,
  ].filter(Boolean);
  const sourceKind = inferPriceSourceKind(result);
  return {
    sentence: `Esta cotización usa ${parts.join(", ")}.`,
    source: sourceKindExplanation(sourceKind),
    total: formatMoney(result.total_con_urgencia ?? result.total_sin_iva),
  };
}



export function inferFromCaras(caras) {
  const full = caras === "4/0" || caras === "4/4";
  return {
    modo_color: full ? "fullcolor" : "blanco_y_negro",
    categoria: full ? "Bajadas Fullcolor" : "Bajadas Blanco y Negro",
  };
}



export function inferQuoteContext(form) {
  if (form.categoria_ui === "Bajadas Autoadhesivas") {
    return {
      categoria: "Bajadas Autoadhesivas",
      modo_color: "fullcolor",
      formato: form.formato,
      caras: "4/0",
    };
  }
  if (form.categoria_ui === "Bajadas Kraft") {
    const byCaras = inferFromCaras(form.caras);
    return {
      categoria: "Bajadas Kraft",
      modo_color: byCaras.modo_color,
      formato: form.formato,
      caras: form.caras,
    };
  }
  if (form.categoria_ui === "Tarjetas Personales 9x5") {
    return {
      categoria: "Tarjetas Personales",
      modo_color: "fullcolor",
      formato: "9x5",
      caras: form.caras,
    };
  }
  if (form.categoria_ui === "Tarjetas Postales") {
    return { categoria: "Tarjetas Postales", modo_color: "fullcolor", formato: "postal", caras: form.caras };
  }
  if (form.categoria_ui === "Folletos") {
    return { categoria: "Folletos", modo_color: form.modo_color_folleto, formato: form.formato, caras: form.caras };
  }
  if (form.categoria_ui === "Carpetas") {
    return { categoria: "Carpetas", modo_color: "fullcolor", formato: "A4", caras: form.caras };
  }
  if (form.categoria_ui === "Sobres") {
    return { categoria: "Sobres", modo_color: "fullcolor", formato: "sobre", caras: "4/0" };
  }
  if (form.categoria_ui === "Stickers Corte Recto") {
    return { categoria: "Stickers Corte Recto", modo_color: "fullcolor", formato: form.formato, caras: "4/0" };
  }
  if (form.categoria_ui === "Imanes Corte Recto") {
    return { categoria: "Imanes Corte Recto", modo_color: "fullcolor", formato: form.formato, caras: "4/0" };
  }
  if (form.categoria_ui === "Stickers Circulares") {
    return { categoria: "Stickers Circulares", modo_color: "fullcolor", formato: form.formato, caras: "4/0" };
  }
  if (form.categoria_ui === "Tarjetas Troqueladas Circulares") {
    return { categoria: "Tarjetas Troqueladas Circulares", modo_color: "fullcolor", formato: form.formato, caras: form.caras_tarjetas_troq_circ || "4/4" };
  }
  if (form.categoria_ui === "Plancha de Imán Impreso") {
    return { categoria: "Plancha de Imán Impreso", modo_color: "fullcolor", formato: "30x46", caras: "4/0" };
  }
  if (form.categoria_ui === "Agendas / Cuadernos") {
    return { categoria: "Agendas / Cuadernos", modo_color: "fullcolor", formato: form.formato_agendas || "A5", caras: "N/A" };
  }
  const byCaras = inferFromCaras(form.caras);
  return {
    categoria: byCaras.categoria,
    modo_color: byCaras.modo_color,
    formato: form.formato,
    caras: form.caras,
  };
}



export function formatMoney(value) {
  if (typeof value !== "number") return "-";
  const numeric = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
  return `$${numeric} ARS`;
}



export function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
}



export function parseRangeLabel(label) {
  if (!label) return null;
  const clean = String(label).trim();
  if (clean === "1") return { label: clean, min: 1, max: 1 };
  const match = clean.match(/^(\d+)\s*a\s*(\d+)$/i);
  if (!match) return null;
  const min = Number(match[1]);
  const max = Number(match[2]);
  if (!Number.isInteger(min) || !Number.isInteger(max) || min > max) return null;
  return { label: clean, min, max };
}



export function deriveRangeFromQuantity(quantity, availableRanges) {
  if (!Number.isInteger(quantity) || quantity < 1) return null;
  const parsed = availableRanges.map(parseRangeLabel).filter(Boolean);
  const candidates = parsed.filter((r) => r.min <= quantity && quantity <= r.max);
  if (!candidates.length) return null;
  candidates.sort((a, b) => {
    const spanA = a.max - a.min;
    const spanB = b.max - b.min;
    if (spanA !== spanB) return spanA - spanB;
    if (a.min !== b.min) return b.min - a.min;
    return a.max - b.max;
  });
  return candidates[0].label;
}

