import { useEffect, useMemo, useState } from "react";
import {
  applyAdminPrecio,
  applyAdminPrecioRollback,
  approveBajadasConfigCandidate,
  cotizarBajadaV2,
  cotizarFolletos,
  cotizarTarjetasTroqueladasCirculares,
  cotizarPlanchaImanImpreso,
  cotizarAgendasCuadernos,
  cotizarImanesCorteRecto,
  cotizarStickersCirculares,
  cotizarCarpetas,
  cotizarStickersCorteRecto,
  cotizarSobres,
  cotizarTarjetas9x5,
  cotizarTarjetasPostales,
  createBajadasConfigCandidate,
  fetchBajadasActiveVersion,
  fetchBajadasBackupDetail,
  fetchBajadasBackups,
  previewRestoreBajadasBackup,
  fetchBajadasConfig,
  fetchBajadasConfigCandidates,
  fetchBajadasConfigDiff,
  fetchBajadasConfigHistory,
  fetchBajadasHealth,
  fetchBajadasMetrics,
  fetchAdminPreciosHistorial,
  fetchAdminPreciosVariables,
  fetchPrincipalVariables,
  fetchPrincipalVariablesAudit,
  fetchPrincipalVariablesRanges,
  fetchTraceGraph,
  fetchVariablesImpacto,
  exportPricesExcel,
  exportPricesPdf,
  previewAdminPrecio,
  previewAdminPrecioRollback,
  previewExcelMaestro,
  promoteBajadasConfigCandidate,
  rejectBajadasConfigCandidate,
  restoreBajadasConfig,
  restoreBajadasBackup,
  simulateRestoreBajadasBackup,
  simulateBajadasConfig,
  updateBajadasConfig,
  updatePrincipalVariables,
  validateBajadasConfig,
} from "../api/bajadasV2Api";
import optionRows from "../data/bajadasOptions.json";
import ConfiguracionAvanzadaPanel from "./cotizador/ConfiguracionAvanzadaPanel";
import EntenderPrecioPanel from "./cotizador/EntenderPrecioPanel";
import ExportarSoporteExcelPanel from "./cotizador/ExportarSoporteExcelPanel";
import HistorialBackupsPanel from "./cotizador/HistorialBackupsPanel";
import ImpactoCambiosPanel from "./cotizador/ImpactoCambiosPanel";
import ModificarPreciosWizard from "./cotizador/ModificarPreciosWizard";
import NavigationTabs from "./cotizador/NavigationTabs";
import ViewModeToggle from "./cotizador/ViewModeToggle";

const VIEW_MODE_STORAGE_KEY = "cotizador_view_mode";
const ADMIN_PRICE_STEPS = [
  { id: 1, label: "Elegir variable" },
  { id: 2, label: "Revisar impacto" },
  { id: 3, label: "Nuevo valor" },
  { id: 4, label: "Previsualizar" },
  { id: 5, label: "Confirmar" },
  { id: 6, label: "Historial" },
];
const TRACE_MODES = [
  { value: "cotizacion_actual", label: "Cotización actual" },
  { value: "casos_generales", label: "Casos de lógica general" },
];
const TRACE_DEFAULT_LEGEND = {
  variable_madre: "Variable madre editable",
  derivado: "Calculado desde otra variable o regla",
  tabla_pdf: "Precio fijo PDF",
  preparada: "Detectada/preparada, no conectada al cálculo actual",
  bloqueado: "Sin datos confiables",
  factor: "Factor o multiplicador de fórmula",
};
const CARAS = ["4/0", "4/4", "1/0", "1/1"];
const URGENCIAS = ["normal", "express", "super_express", "ya_24hs"];
const CATEGORIAS = [
  "Bajadas Fullcolor/ByN",
  "Bajadas Autoadhesivas",
  "Bajadas Kraft",
  "Tarjetas Personales 9x5",
  "Tarjetas Postales",
  "Folletos",
  "Carpetas",
  "Sobres",
  "Stickers Corte Recto",
  "Imanes Corte Recto",
  "Stickers Circulares",
  "Tarjetas Troqueladas Circulares",
  "Plancha de Imán Impreso",
  "Agendas / Cuadernos",
];
const AUTOADH_COLUMNAS = ["papel", "especial"];
const AUTOADH_FORMATOS = ["A3+", "XA3"];
const AUTOADH_RANGOS = ["1", "2 a 25", "26 a 50", "51 a 100", "101 a 300", "301 a 500", "501 a 1000"];
const KRAFT_FORMATOS = ["A3"];
const KRAFT_TIPO_PAPEL = "kraft";
const KRAFT_MATERIAL = "Kraft";
const KRAFT_GRAMAJES = ["80g", "200g"];
const KRAFT_RANGOS = ["1", "2 a 25", "26 a 50", "51 a 100", "101 a 300", "301 a 500"];
const TARJETAS_FORMATOS = ["9x5"];
const TARJETAS_GRAMAJES = ["300g", "350g"];
const TARJETAS_CARAS = ["4/0", "4/4"];
const TARJETAS_CANTIDADES = ["100", "200", "300", "500", "1000"];
const TARJETAS_TERMINACIONES = [
  { label: "Sin laminar", value: "sin_laminar" },
  { label: "Laca UV", value: "laca_uv" },
  { label: "Laminado brillo", value: "laminado_brillo" },
  { label: "Laminado mate", value: "laminado_mate" },
];
const POSTALES_FORMATOS = ["postal"];
const POSTALES_GRAMAJES = ["300g", "350g"];
const POSTALES_CARAS = ["4/0", "4/4"];
const POSTALES_CANTIDADES = ["100", "200", "300", "500", "1000"];
const POSTALES_TERMINACIONES = TARJETAS_TERMINACIONES;
const FOLLETOS_FORMATOS = ["10x10", "10x15", "15x21", "A4"];
const FOLLETOS_PAPELES = [
  { papel: "150g Ilustracion", gramaje: "150g" },
  { papel: "80g Ilustracion", gramaje: "80g" },
];
const FOLLETOS_MODO_COLOR = ["fullcolor", "escala_grises"];
const FOLLETOS_CANTIDADES = ["100", "200", "300", "500", "1000"];
const CARPETAS_FORMATOS = ["A4"];
const CARPETAS_PAPEL = "300g Ilustracion";
const CARPETAS_GRAMAJE = "300g";
const CARPETAS_CARAS = ["4/0", "4/4"];
const CARPETAS_RANGOS = ["1", "2 a 25", "26 a 50", "51 a 100", "101 a 300", "301 a 500", "501 a 1000"];
const CARPETAS_TERMINACIONES = [
  { label: "Sin laminar", value: "sin_laminar" },
  { label: "Laca UV", value: "laca_uv" },
  { label: "Laminado brillo", value: "laminado_brillo" },
  { label: "Laminado mate", value: "laminado_mate" },
];
const SOBRES_CANTIDADES = ["100", "200", "300", "500", "1000"];
const SOBRES_CARAS = ["4/0"];
const SOBRES_TIPOS = [
  { value: "sobre_bolsa_a4_22_9x32_4", label: "Sobre bolsa A4 22,9x32,4" },
  { value: "sobre_bolsa_27x37", label: "Sobre bolsa 27x37" },
  { value: "sobre_bolsa_25x35_3", label: "Sobre bolsa 25x35,3" },
  { value: "oficio_ingles_12x23_5", label: "Oficio inglés 12x23,5" },
];
const STICKERS_FORMATOS = ["6x4", "7x5", "9x5", "10x7"];
const STICKERS_TERMINACIONES = [
  { label: "Sin laca UV", value: "sin_laca_uv" },
  { label: "Con laca UV", value: "con_laca_uv" },
];
const STICKERS_CANTIDADES = ["100", "200", "300", "500", "1000"];
const IMANES_FORMATOS = ["6x4", "7x5", "9x5", "10x7"];
const IMANES_TERMINACIONES = STICKERS_TERMINACIONES;
const IMANES_CANTIDADES = ["100", "200", "300", "500", "1000"];
const STICKERS_CIRCULARES_MATERIALES = [
  { value: "obra_ilustracion_90g", label: "Papel obra/ilustración 90g" },
  { value: "fluo", label: "Papel flúo" },
  { value: "kraft_marron", label: "Kraft marrón" },
  { value: "opp", label: "OPP" },
];
const STICKERS_CIRCULARES_FORMATOS = [
  "1cm",
  "2cm",
  "3cm",
  "4cm",
  "5cm",
  "6cm",
  "7cm",
  "8cm",
  "9cm",
  "10cm",
  "11cm",
  "12-15cm",
  "16-17cm",
  "18-20cm",
];
const STICKERS_CIRCULARES_TERMINACIONES = [
  { label: "Sin laca UV", value: "sin_laca_uv" },
  { label: "Laca UV brillo (+15%)", value: "con_laca_uv_brillo" },
];
const ADICIONALES_POR_LADO = [
  { label: "Sin adicional por lado", value: "sin_adicional" },
  { label: "Laminado brillo por lado", value: "laminado_brillo_por_lado" },
  { label: "Laminado mate por lado", value: "laminado_mate_por_lado" },
  { label: "Laminado Soft Touch por lado", value: "laminado_soft_touch_por_lado" },
];
const STICKERS_CIRCULARES_CANTIDADES = ["100", "200", "300", "500", "1000"];
const TROQUELADO_COMPLEJIDADES = [
  { value: "simple", label: "Simple" },
  { value: "medio", label: "Medio" },
  { value: "complejo", label: "Complejo" },
  { value: "muy_complejo", label: "Muy complejo" },
  { value: "ultra_complejo", label: "Ultra complejo" },
];
const TARJETAS_TROQ_CIRC_FORMATOS = ["1cm", "2cm", "3cm", "4cm", "5cm", "6cm", "7cm", "8cm", "9cm"];
const TARJETAS_TROQ_CIRC_CANTIDADES = ["100", "200", "300", "500", "1000"];
const PLANCHA_IMAN_VARIANTES = [{ value: "papel_300g_ilustracion", label: "Papel 300g Ilustración (30x46, 4/0)" }];
const PLANCHA_IMAN_CANTIDADES_SUGERIDAS = ["1", "2", "25", "50", "100", "300", "500"];
const AGENDAS_PRODUCTOS = [
  { value: "cuaderno_escolar_abrochado", label: "Cuaderno Escolar (abrochado)" },
  { value: "cuaderno_universitario_ringwire", label: "Cuaderno Universitario (ring wire)" },
  { value: "agenda_2026", label: "Agenda 2026" },
];
const AGENDAS_FORMATOS = ["A5", "A4"];
const AGENDAS_PAGINAS = ["24", "48", "72", "100", "160"];
const ADICIONALES = [
  { label: "Sin adicional", value: "sin_adicional" },
  { label: "Laca UV", value: "laca" },
  { label: "Laminado brillo", value: "laminado_brillo" },
  { label: "Laminado mate", value: "laminado_mate" },
];
const ADICIONALES_LIVIANO = [
  { label: "Sin adicional", value: "sin_adicional" },
  { label: "Laca UV", value: "laca" },
];
const TRACE_GRAPH_CASES = [
  { value: "click_bajadas", label: "Click Bajadas por formato" },
  { value: "stickers_circulares", label: "Stickers Circulares fórmula calibrada" },
  { value: "autoadhesivas_tinta_blanca", label: "Autoadhesivas tinta blanca" },
  { value: "tarjetas_9x5", label: "Tarjetas 9x5 matriz PDF" },
];

const TRACE_TYPE_LABELS = {
  entrada: "Entrada",
  variable_madre: "Variable madre",
  derivado: "Derivado",
  tabla_pdf: "Tabla PDF",
  preparada: "Preparada",
  bloqueado: "Bloqueado",
  factor: "Factor / multiplicador",
};
const TRACE_NODE_WIDTH = 236;
const TRACE_NODE_HEIGHT = 98;

const INITIAL_FORM = {
  categoria_ui: "Bajadas Fullcolor/ByN",
  formato: "A4",
  tipo_papel: "",
  material: "",
  gramaje: "",
  columna_precio: "papel",
  cantidad_unidades: "1",
  caras: "4/0",
  urgencia: "normal",
  adicional_laminado: "sin_adicional",
  caras_adicional_laminado: "1",
  adicional_laminado_por_lado: "sin_adicional",
  adicional_plastificado: false,
  adicional_tinta_blanca: false,
  adicional_laca_uv: false,
  terminacion_tarjetas: "sin_laminar",
  gramaje_tarjetas: "300g",
  papel_folleto: "150g Ilustracion",
  modo_color_folleto: "fullcolor",
  caras_adicional_troq_circ: "0",
  adicional_laminado_troq_circ: "sin_adicional",
  terminacion_carpetas: "sin_laminar",
  solapa_impresa: false,
  tipo_sobre: "sobre_bolsa_a4_22_9x32_4",
  terminacion_stickers: "sin_laca_uv",
  terminacion_imanes: "sin_laca_uv",
  material_stickers_circulares: "obra_ilustracion_90g",
  terminacion_stickers_circulares: "sin_laca_uv",
  adicional_troquelado: false,
  complejidad_troquelado: "simple",
  caras_tarjetas_troq_circ: "4/4",
  variante_plancha_iman: "papel_300g_ilustracion",
  producto_agendas: "cuaderno_escolar_abrochado",
  formato_agendas: "A5",
  paginas_agendas: "24",
};

function formatTraceValue(node) {
  if (!node || node.value === null || node.value === undefined || node.value === "") return "-";
  const value = typeof node.value === "number" ? Number(node.value.toFixed(4)).toLocaleString("es-AR") : String(node.value);
  return node.unit ? `${value} ${node.unit}` : value;
}

function traceNodeVisualType(node) {
  if (!node) return "derivado";
  if (node.type === "variable_madre" && node.editable_en_sistema && node.impacta_hoy) return "variable_madre";
  if (node.type === "factor" || String(node.id || "").includes("factor") || String(node.id || "").includes("multiplicador")) return "factor";
  return node.type || "derivado";
}

function inferTraceBranch(node) {
  const id = String(node?.id || "");
  if (node?.branch) return node.branch;
  if (id.includes("material") || id.includes("papel")) return "material";
  if (id.includes("click") || id.includes("formato") || id.includes("caras") || id.includes("impresion")) return "impresion";
  if (id.includes("cantidad") || id.includes("rango")) return "cantidad";
  if (id.includes("adicional") || id.includes("troquel") || id.includes("laca") || id.includes("laminado")) return "adicionales";
  if (id.includes("urgencia")) return "urgencia";
  if (id.includes("total") || id.includes("precio") || id.includes("subtotal")) return "resultado";
  return "entrada";
}

function layoutTraceGraph(graph) {
  const nodes = graph?.nodes || [];
  const edges = graph?.edges || [];
  const explicitLayout = nodes.some((node) => node.column !== undefined || node.branch || node.row !== undefined);
  const positions = {};
  const xStep = 330;
  const yStep = 150;
  const marginX = 42;
  const marginY = 46;

  if (explicitLayout) {
    const branchOrder = ["material", "impresion", "cantidad", "adicionales", "urgencia", "entrada", "resultado"];
    const branchIndex = Object.fromEntries(branchOrder.map((branch, index) => [branch, index]));
    const lanes = nodes.map((node) => ({
      node,
      column: Number(node.column ?? 0),
      branch: inferTraceBranch(node),
      row: node.row,
      lane: node.lane,
    }));
    const grouped = lanes.reduce((acc, item) => {
      const key = `${item.column}:${item.branch}`;
      acc[key] = acc[key] || [];
      acc[key].push(item);
      return acc;
    }, {});
    Object.values(grouped).forEach((items) => {
      items.sort((a, b) => Number(a.row ?? 999) - Number(b.row ?? 999));
      items.forEach((item, index) => {
        if (item.row === undefined) item.autoRow = index;
      });
    });
    lanes.forEach((item) => {
      const lane = Number(item.lane ?? (branchIndex[item.branch] ?? branchIndex.entrada));
      const rowOffset = Number(item.row ?? item.autoRow ?? 0) * (TRACE_NODE_HEIGHT + 18);
      positions[item.node.id] = {
        x: marginX + item.column * xStep,
        y: marginY + lane * yStep + rowOffset,
      };
    });
    const maxX = Math.max(0, ...Object.values(positions).map((pos) => pos.x));
    const maxY = Math.max(0, ...Object.values(positions).map((pos) => pos.y));
    return {
      positions,
      width: Math.max(1180, maxX + TRACE_NODE_WIDTH + 90),
      height: Math.max(780, maxY + TRACE_NODE_HEIGHT + 80),
    };
  }

  const depths = Object.fromEntries(nodes.map((node) => [node.id, 0]));
  for (let pass = 0; pass < nodes.length; pass += 1) {
    edges.forEach((edge) => {
      if (depths[edge.source] === undefined || depths[edge.target] === undefined) return;
      depths[edge.target] = Math.max(depths[edge.target], depths[edge.source] + 1);
    });
  }
  const groups = nodes.reduce((acc, node) => {
    const depth = depths[node.id] || 0;
    acc[depth] = acc[depth] || [];
    acc[depth].push(node);
    return acc;
  }, {});
  Object.entries(groups).forEach(([depthKey, group]) => {
    const depth = Number(depthKey);
    group.forEach((node, index) => {
      positions[node.id] = { x: marginX + depth * xStep, y: marginY + index * yStep };
    });
  });
  const maxDepth = Math.max(0, ...Object.keys(groups).map(Number));
  const maxRows = Math.max(1, ...Object.values(groups).map((group) => group.length));
  return {
    positions,
    width: Math.max(980, marginX + (maxDepth + 1) * xStep + TRACE_NODE_WIDTH),
    height: Math.max(520, marginY + maxRows * yStep + TRACE_NODE_HEIGHT),
  };
}

function traceNode(id, label, type, value, unit, description, source, operation, observation, meta = {}) {
  return {
    id,
    label,
    type,
    value,
    unit,
    editable_en_sistema: false,
    impacta_hoy: type !== "tabla_pdf",
    description,
    source,
    operation,
    observation,
    ...meta,
  };
}

function traceEdge(id, source, target, label) {
  return { id, source, target, label };
}

function describeCurrentQuoteMaterial(payload) {
  const material = payload?.material || payload?.papel || payload?.tipo_papel || "Material no informado";
  const gramaje = payload?.gramaje && payload.gramaje !== "N/A" ? ` ${payload.gramaje}` : "";
  return `${material}${gramaje}`.trim();
}

function collectCurrentQuoteAdditions(payload, result) {
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

function buildCurrentQuoteTraceGraph(payload, result) {
  if (!payload || !result) return null;
  const quantity = Number(payload.cantidad_unidades || result.cantidad_unidades || 0);
  const materialLabel = describeCurrentQuoteMaterial(payload);
  const range = result.cantidad_rango_aplicado || payload.cantidad_rango || "Sin rango";
  const baseUnit = result.precio_unitario_base_sin_iva ?? result.precio_base_unitario_sin_iva ?? result.precio_unitario_sin_iva ?? result.precio_sin_iva;
  const baseTotal = result.total_base_sin_iva ?? result.total_sin_adicional_sin_iva ?? (Number.isFinite(baseUnit) && quantity ? baseUnit * quantity : null);
  const totalFinal = result.total_con_urgencia ?? result.total_sin_iva ?? result.precio_con_recargo_urgencia ?? result.precio_sin_iva;
  const urgencyValue = result.trazabilidad?.recargo_urgencia_aplicado ?? payload.urgencia ?? "normal";
  const additions = collectCurrentQuoteAdditions(payload, result);
  const additionsTotal = additions.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  const subtotalWithAdditions = result.total_sin_iva ?? (Number.isFinite(baseTotal) ? baseTotal + additionsTotal : null);
  const source = result.fuente || result.trazabilidad?.fuente_precio_final || "motor de cotización";
  const rule = result.regla_aplicada || result.trazabilidad?.modo_calculo || "regla aplicada";
  const modeColor = payload.modo_color || (String(payload.caras || "").startsWith("4") ? "fullcolor" : "blanco_y_negro");

  const nodes = [
    traceNode("entrada_usuario", "Entrada del usuario", "entrada", payload.categoria || "Cotización actual", null, `Cantidad: ${quantity || "-"}. Producto: ${payload.producto || payload.categoria || "-"}.`, "payload actual", "captura del formulario", "Nodo raíz: contiene la selección real calculada por el usuario.", { branch: "entrada", column: 0, lane: 3, row: 0 }),

    traceNode("origen_material", "Origen papel/material", "preparada", payload.tipo_papel || payload.papel || payload.material || "material", null, "Fuente semántica del material seleccionado. Si hay variable madre conectada, aparece como origen; si no, queda como tabla/preparado.", "payload + configuración comercial", "define familia de material", "No reemplaza al material cotizado real; solo explica su origen.", { branch: "material", column: 0, lane: 0, row: 0 }),
    traceNode("material_cotizado", `Material ${materialLabel}`, "derivado", materialLabel, null, "Material real de la cotización actual.", "lastPayload.material / lastPayload.papel / lastPayload.gramaje", "selección del usuario", "Debe coincidir con lo cotizado, por ejemplo Ilustracion 115g.", { branch: "material", column: 1, lane: 0, row: 0 }),

    traceNode("click_base", `Click ${modeColor}`, "variable_madre", modeColor, null, "Rama de click/impresión usada para explicar el origen del costo de impresión.", "variables comerciales / motor de cotización", "define base de impresión", "Cuando el producto usa PDF fijo, el nodo queda como referencia lógica y el precio final sigue viniendo del resultado real.", { branch: "impresion", column: 0, lane: 1, row: 0, editable_en_sistema: true, impacta_hoy: true }),
    traceNode("formato", `Formato ${payload.formato || "-"}`, "derivado", payload.formato || "-", null, "Formato cotizado y posible derivación proporcional del click/base.", "lastPayload.formato", "deriva tamaño/formato", "Debe coincidir con el formulario de la cotización actual.", { branch: "impresion", column: 1, lane: 1, row: 0 }),
    traceNode("caras", `Impresión ${payload.caras || "-"}`, "derivado", payload.caras || "-", null, "Caras / impresión solicitada.", "lastPayload.caras", "define caras y modo color", "Separa visualmente la impresión de papel y cantidad.", { branch: "impresion", column: 2, lane: 1, row: 0 }),

    traceNode("cantidad", "Cantidad ingresada", "entrada", quantity || "-", "u.", "Cantidad ingresada por el usuario.", "lastPayload.cantidad_unidades", "entrada directa", "Desde acá se define rango o cantidad de matriz.", { branch: "cantidad", column: 0, lane: 2, row: 0 }),
    traceNode("rango", `Rango aplicado ${range}`, "factor", range, null, "Rango aplicado por cantidad.", "result.cantidad_rango_aplicado / lastPayload.cantidad_rango", "lookup por cantidad", "Si el producto usa matriz exacta, muestra la cantidad o rango devuelto.", { branch: "cantidad", column: 1, lane: 2, row: 0 }),

    traceNode("precio_base_unitario", "Precio base unitario", "tabla_pdf", baseUnit, "ARS", "Precio base unitario de la cotización actual.", source, rule, "Se toma del resultado real, no de un caso fijo.", { branch: "resultado", column: 3, lane: 2, row: 0 }),
    traceNode("base_total", "Base x cantidad", "derivado", baseTotal, "ARS", "Subtotal base antes de adicionales y urgencia.", "resultado actual", "precio base unitario x cantidad", "Convergencia de material, click, formato, impresión y rango.", { branch: "resultado", column: 4, lane: 2, row: 0 }),
  ];

  const edges = [
    traceEdge("e_entrada_material", "entrada_usuario", "material_cotizado", "usa"),
    traceEdge("e_origen_material", "origen_material", "material_cotizado", "define"),
    traceEdge("e_material_base", "material_cotizado", "precio_base_unitario", "aporta"),

    traceEdge("e_entrada_formato", "entrada_usuario", "formato", "usa"),
    traceEdge("e_click_formato", "click_base", "formato", "deriva"),
    traceEdge("e_formato_caras", "formato", "caras", "aplica"),
    traceEdge("e_caras_base", "caras", "precio_base_unitario", "aporta"),

    traceEdge("e_entrada_cantidad", "entrada_usuario", "cantidad", "usa"),
    traceEdge("e_cantidad_rango", "cantidad", "rango", "lookup"),
    traceEdge("e_rango_base", "rango", "precio_base_unitario", "define"),
    traceEdge("e_base_total", "precio_base_unitario", "base_total", "x cantidad"),
  ];

  if (additions.length) {
    additions.forEach((addition, index) => {
      const id = `adicional_${index + 1}`;
      nodes.push(traceNode(id, `Adicional ${addition.label}`, "factor", addition.value, "ARS", addition.detail || "Adicional aplicado.", addition.source || "resultado actual", "suma al subtotal", "Adicional real de la cotización actual.", { branch: "adicionales", column: 1 + index, lane: 3, row: 0 }));
      edges.push(traceEdge(`e_entrada_${id}`, "entrada_usuario", id, "elige"));
      edges.push(traceEdge(`e_${id}_subtotal`, id, "subtotal_con_adicionales", "suma"));
    });
  } else {
    nodes.push(traceNode("sin_adicional", "Sin adicional", "derivado", 0, "ARS", "La cotización actual no tiene adicionales aplicados.", "lastPayload/result", "sin suma adicional", "Nodo explícito para evitar ambigüedad.", { branch: "adicionales", column: 1, lane: 3, row: 0 }));
    edges.push(traceEdge("e_entrada_sin_adicional", "entrada_usuario", "sin_adicional", "elige"));
    edges.push(traceEdge("e_sin_adicional_subtotal", "sin_adicional", "subtotal_con_adicionales", "no suma"));
  }

  nodes.push(
    traceNode("subtotal_con_adicionales", "Subtotal con adicionales", "derivado", subtotalWithAdditions, "ARS", "Subtotal antes de urgencia.", "resultado actual", "base + adicionales", "Punto de convergencia de base y extras.", { branch: "resultado", column: 5, lane: 2, row: 0 }),
    traceNode("urgencia", `Urgencia ${payload.urgencia || "normal"}`, "factor", urgencyValue, typeof urgencyValue === "number" ? "factor" : null, "Recargo de urgencia aplicado.", "result.trazabilidad.recargo_urgencia_aplicado", "recarga o mantiene", "Urgencia normal funciona como factor neutro.", { branch: "urgencia", column: 6, lane: 4, row: 0 }),
    traceNode("total_final", "Total final", "derivado", totalFinal, "ARS", "Total final de la cotización actual.", "result.total_con_urgencia / result.total_sin_iva", "subtotal + urgencia", "Valor que ve el usuario en el panel de resultado.", { branch: "resultado", column: 7, lane: 2, row: 0 })
  );

  edges.push(traceEdge("e_base_subtotal", "base_total", "subtotal_con_adicionales", "base"));
  edges.push(traceEdge("e_entrada_urgencia", "entrada_usuario", "urgencia", "elige"));
  edges.push(traceEdge("e_subtotal_urgencia", "subtotal_con_adicionales", "urgencia", "recarga"));
  edges.push(traceEdge("e_urgencia_total", "urgencia", "total_final", "total"));

  return {
    ok: true,
    producto: payload.categoria || "Cotización actual",
    caso: "cotizacion_actual",
    layout: "branched",
    nodes,
    edges,
    legend: TRACE_DEFAULT_LEGEND,
  };
}

function inferFromCaras(caras) {
  const full = caras === "4/0" || caras === "4/4";
  return {
    modo_color: full ? "fullcolor" : "blanco_y_negro",
    categoria: full ? "Bajadas Fullcolor" : "Bajadas Blanco y Negro",
  };
}

function inferQuoteContext(form) {
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

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
}

function parseRangeLabel(label) {
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

function deriveRangeFromQuantity(quantity, availableRanges) {
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

function formatMoney(value) {
  if (typeof value !== "number") return "-";
  const numeric = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
  return `$${numeric} ARS`;
}

async function copyToClipboard(text) {
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fallback below
    }
  }
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textArea);
    return Boolean(ok);
  } catch {
    return false;
  }
}

export default function CotizadorBajadasV2() {
  const [activeTab, setActiveTab] = useState("Cotizar");
  const [viewMode, setViewMode] = useState(() => {
    try {
      const stored = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      return stored === "advanced" ? "advanced" : "simple";
    } catch {
      return "simple";
    }
  });
  const [understandMode, setUnderstandMode] = useState("detalle");
  const [form, setForm] = useState(INITIAL_FORM);
  const [result, setResult] = useState(null);
  const [lastPayload, setLastPayload] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [apiConnected, setApiConnected] = useState(false);

  const [cfg, setCfg] = useState(null);
  const [cfgHistory, setCfgHistory] = useState([]);
  const [cfgDiff, setCfgDiff] = useState([]);
  const [cfgCandidates, setCfgCandidates] = useState([]);
  const [cfgMsg, setCfgMsg] = useState("");
  const [cfgValidation, setCfgValidation] = useState(null);
  const [cfgSimulation, setCfgSimulation] = useState(null);
  const [cfgActiveVersion, setCfgActiveVersion] = useState(null);
  const [cfgBackups, setCfgBackups] = useState([]);
  const [cfgBackupDetail, setCfgBackupDetail] = useState(null);
  const [cfgBackupPreview, setCfgBackupPreview] = useState(null);
  const [cfgBackupSimulation, setCfgBackupSimulation] = useState(null);
  const [principalVariables, setPrincipalVariables] = useState(null);
  const [principalDraft, setPrincipalDraft] = useState({});
  const [principalAudit, setPrincipalAudit] = useState(null);
  const [principalRanges, setPrincipalRanges] = useState(null);
  const [principalMsg, setPrincipalMsg] = useState("");
  const [excelImportFile, setExcelImportFile] = useState(null);
  const [excelImportPreview, setExcelImportPreview] = useState(null);
  const [excelImportLoading, setExcelImportLoading] = useState(false);
  const [excelImportError, setExcelImportError] = useState("");
  const [traceMode, setTraceMode] = useState("cotizacion_actual");
  const [traceCase, setTraceCase] = useState("click_bajadas");
  const [traceGraph, setTraceGraph] = useState(null);
  const [traceLoading, setTraceLoading] = useState(false);
  const [traceError, setTraceError] = useState("");
  const [selectedTraceNodeId, setSelectedTraceNodeId] = useState(null);
  const [impactData, setImpactData] = useState(null);
  const [impactLoading, setImpactLoading] = useState(false);
  const [impactError, setImpactError] = useState("");
  const [impactMode, setImpactMode] = useState("variable");
  const [impactVariable, setImpactVariable] = useState("click_color");
  const [impactProduct, setImpactProduct] = useState("bajadas_fullcolor_byn");
  const [adminPrices, setAdminPrices] = useState(null);
  const [adminHistory, setAdminHistory] = useState([]);
  const [adminVariable, setAdminVariable] = useState("click_color");
  const [adminNewValue, setAdminNewValue] = useState("");
  const [adminPreview, setAdminPreview] = useState(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminMsg, setAdminMsg] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminWizardStep, setAdminWizardStep] = useState(1);
  const [adminRollbackPreview, setAdminRollbackPreview] = useState(null);
  const [adminRollbackTargetId, setAdminRollbackTargetId] = useState(null);
  const isAdvancedMode = viewMode === "advanced";
  const isSimpleMode = viewMode === "simple";

  const inferred = useMemo(() => inferQuoteContext(form), [form]);
  const isAutoadhesivas = inferred.categoria === "Bajadas Autoadhesivas";
  const isKraft = inferred.categoria === "Bajadas Kraft";
  const isTarjetas = inferred.categoria === "Tarjetas Personales";
  const isPostales = inferred.categoria === "Tarjetas Postales";
  const isFolletos = inferred.categoria === "Folletos";
  const isCarpetas = inferred.categoria === "Carpetas";
  const isSobres = inferred.categoria === "Sobres";
  const isStickers = inferred.categoria === "Stickers Corte Recto";
  const isImanes = inferred.categoria === "Imanes Corte Recto";
  const isStickersCirculares = inferred.categoria === "Stickers Circulares";
  const isTarjetasTroqCirc = inferred.categoria === "Tarjetas Troqueladas Circulares";
  const isPlanchaIman = inferred.categoria === "Plancha de Imán Impreso";
  const isAgendasCuadernos = inferred.categoria === "Agendas / Cuadernos";
  const isNoRangeProduct = isPlanchaIman || isAgendasCuadernos;
  const isBajadasFlow = inferred.categoria.startsWith("Bajadas");
  const isMatrixProduct =
    isTarjetas || isPostales || isFolletos || isSobres || isStickers || isImanes || isStickersCirculares || isTarjetasTroqCirc;
  const isLivianoBajadaNoAutoadhesiva =
    (inferred.categoria === "Bajadas Fullcolor" || inferred.categoria === "Bajadas Blanco y Negro") &&
    String(form.tipo_papel || "").toLowerCase() === "liviano";
  const adicionalesDisponibles = useMemo(() => {
    if (!isBajadasFlow) return ADICIONALES;
    if (isAutoadhesivas) return ADICIONALES_LIVIANO;
    if (isLivianoBajadaNoAutoadhesiva) return ADICIONALES_LIVIANO;
    return ADICIONALES;
  }, [isBajadasFlow, isAutoadhesivas, isLivianoBajadaNoAutoadhesiva]);
  const formatoDataSource = useMemo(() => {
    if (isKraft || isTarjetas || isPostales || isFolletos || isCarpetas || isSobres || isStickers || isImanes || isStickersCirculares || isTarjetasTroqCirc || isPlanchaIman || isAgendasCuadernos) return form.formato;
    if (form.formato === "XA3") return "A3+";
    return form.formato;
  }, [form.formato, isKraft, isTarjetas, isPostales, isFolletos, isCarpetas, isSobres, isStickers, isImanes, isStickersCirculares, isTarjetasTroqCirc, isPlanchaIman, isAgendasCuadernos]);

  const validRows = useMemo(
    () =>
      optionRows.filter(
        (r) => r.categoria === inferred.categoria && r.modo_color === inferred.modo_color && r.caras === inferred.caras
      ),
    [inferred]
  );
  const formatoOptions = useMemo(() => uniqueSorted(validRows.map((r) => r.formato)), [validRows]);
  const effectiveFormatoOptions = useMemo(() => {
    if (isKraft) return KRAFT_FORMATOS;
    if (isTarjetas) return TARJETAS_FORMATOS;
    if (isPostales) return POSTALES_FORMATOS;
    if (isFolletos) return FOLLETOS_FORMATOS;
    if (isCarpetas) return CARPETAS_FORMATOS;
    if (isSobres) return ["sobre"];
    if (isStickers) return STICKERS_FORMATOS;
    if (isImanes) return IMANES_FORMATOS;
    if (isStickersCirculares) return STICKERS_CIRCULARES_FORMATOS;
    if (isTarjetasTroqCirc) return TARJETAS_TROQ_CIRC_FORMATOS;
    if (isPlanchaIman) return ["30x46"];
    if (isAgendasCuadernos) return AGENDAS_FORMATOS;
    if (isAutoadhesivas) return AUTOADH_FORMATOS;
    if (formatoOptions.includes("A3+") && !formatoOptions.includes("XA3")) {
      return uniqueSorted([...formatoOptions, "XA3"]);
    }
    return formatoOptions;
  }, [isAutoadhesivas, isKraft, isTarjetas, isPostales, isFolletos, isCarpetas, isSobres, isStickers, isImanes, isStickersCirculares, isTarjetasTroqCirc, isPlanchaIman, isAgendasCuadernos, formatoOptions]);
  const tipoPapelOptions = useMemo(
    () => uniqueSorted(validRows.filter((r) => r.formato === formatoDataSource).map((r) => r.tipo_papel)),
    [validRows, formatoDataSource]
  );
  const materialOptions = useMemo(
    () => uniqueSorted(validRows.filter((r) => r.formato === formatoDataSource && r.tipo_papel === form.tipo_papel).map((r) => r.material)),
    [validRows, formatoDataSource, form.tipo_papel]
  );
  const gramajeOptions = useMemo(
    () =>
      uniqueSorted(
        validRows
          .filter((r) => r.formato === formatoDataSource && r.tipo_papel === form.tipo_papel && r.material === form.material)
          .map((r) => r.gramaje)
      ),
    [validRows, formatoDataSource, form.tipo_papel, form.material]
  );
  const cantidadOptions = useMemo(() => {
    if (isKraft) return KRAFT_RANGOS;
    if (isTarjetas) return TARJETAS_CANTIDADES;
    if (isPostales) return POSTALES_CANTIDADES;
    if (isFolletos) return FOLLETOS_CANTIDADES;
    if (isCarpetas) return CARPETAS_RANGOS;
    if (isSobres) return SOBRES_CANTIDADES;
    if (isStickers) return STICKERS_CANTIDADES;
    if (isImanes) return IMANES_CANTIDADES;
    if (isStickersCirculares) return STICKERS_CIRCULARES_CANTIDADES;
    if (isTarjetasTroqCirc) return TARJETAS_TROQ_CIRC_CANTIDADES;
    if (isPlanchaIman) return PLANCHA_IMAN_CANTIDADES_SUGERIDAS;
    if (isAgendasCuadernos) return ["2", "5", "10", "20"];
    if (isAutoadhesivas) return AUTOADH_RANGOS;
    return uniqueSorted(
      validRows
        .filter(
          (r) =>
            r.formato === formatoDataSource &&
            r.tipo_papel === form.tipo_papel &&
            r.material === form.material &&
            r.gramaje === form.gramaje
        )
        .map((r) => r.cantidad_rango)
    );
  }, [isKraft, isTarjetas, isPostales, isFolletos, isCarpetas, isSobres, isStickers, isImanes, isStickersCirculares, isTarjetasTroqCirc, isPlanchaIman, isAgendasCuadernos, isAutoadhesivas, validRows, formatoDataSource, form.tipo_papel, form.material, form.gramaje]);
  const cantidadUnidades = useMemo(() => Number(form.cantidad_unidades), [form.cantidad_unidades]);
  const derivedRange = useMemo(() => deriveRangeFromQuantity(cantidadUnidades, cantidadOptions), [cantidadUnidades, cantidadOptions]);

  const loadConfigData = async () => {
    try {
      const [conf, hist, diff, candidates, activeVersion, backups] = await Promise.all([
        fetchBajadasConfig(),
        fetchBajadasConfigHistory(),
        fetchBajadasConfigDiff(),
        fetchBajadasConfigCandidates(),
        fetchBajadasActiveVersion(),
        fetchBajadasBackups(),
      ]);
      setCfg(conf);
      setCfgHistory(hist?.history || []);
      setCfgDiff(diff?.diff || []);
      setCfgCandidates(candidates?.candidates || []);
      setCfgActiveVersion(activeVersion || null);
      setCfgBackups(backups?.backups || []);
    } catch {
      setCfgMsg("No se pudo cargar configuración editable.");
    }
  };

  const loadPrincipalVariables = async () => {
    try {
      setPrincipalMsg("");
      const [variables, audit, ranges] = await Promise.all([
        fetchPrincipalVariables(),
        fetchPrincipalVariablesAudit(),
        fetchPrincipalVariablesRanges(),
      ]);
      const draft = {};
      ["tipo_cambio", "clicks", "papeles", "multiplicadores", "adicionales"].forEach((group) => {
        (variables[group] || []).forEach((item) => {
          draft[item.key] = item.value;
        });
      });
      setPrincipalVariables(variables);
      setPrincipalDraft(draft);
      setPrincipalAudit(audit);
      setPrincipalRanges(ranges);
    } catch (err) {
      setPrincipalMsg(err.message || "No se pudieron cargar las variables principales.");
    }
  };

  const loadTraceGraph = async (selectedCase = traceCase) => {
    try {
      setTraceLoading(true);
      setTraceError("");
      const graph = await fetchTraceGraph({ caso: selectedCase });
      setTraceGraph(graph);
      setSelectedTraceNodeId(graph?.nodes?.[0]?.id || null);
    } catch (err) {
      setTraceGraph(null);
      setSelectedTraceNodeId(null);
      setTraceError(err.message || "No se pudo cargar la trazabilidad visual.");
    } finally {
      setTraceLoading(false);
    }
  };

  const loadVariablesImpacto = async () => {
    try {
      setImpactLoading(true);
      setImpactError("");
      const data = await fetchVariablesImpacto();
      setImpactData(data);
      if (data?.variables?.length && !data.variables.some((item) => item.key === impactVariable)) {
        setImpactVariable(data.variables[0].key);
      }
      if (data?.productos?.length && !data.productos.some((item) => item.key === impactProduct)) {
        setImpactProduct(data.productos[0].key);
      }
    } catch (err) {
      setImpactData(null);
      setImpactError(err.message || "No se pudo cargar el impacto de variables.");
    } finally {
      setImpactLoading(false);
    }
  };

  const loadAdminPrices = async () => {
    try {
      setAdminLoading(true);
      setAdminError("");
      const [variables, history] = await Promise.all([
        fetchAdminPreciosVariables(),
        fetchAdminPreciosHistorial(),
      ]);
      setAdminPrices(variables);
      setAdminHistory(history?.historial || []);
      if (variables?.variables?.length) {
        const selectedKey = variables.variables.some((item) => item.key === adminVariable)
          ? adminVariable
          : variables.variables[0].key;
        const selectedItem = variables.variables.find((item) => item.key === selectedKey);
        setAdminVariable(selectedKey);
        if (adminNewValue === "" && selectedItem) {
          setAdminNewValue(String(selectedItem.value));
        }
      }
    } catch (err) {
      setAdminError(err.message || "No se pudo cargar Administrador de precios.");
    } finally {
      setAdminLoading(false);
    }
  };

  const handleAdminPreview = async () => {
    try {
      setAdminLoading(true);
      setAdminError("");
      setAdminMsg("");
      const preview = await previewAdminPrecio({ variable: adminVariable, nuevo_valor: Number(adminNewValue) });
      setAdminPreview(preview);
      setAdminMsg("Preview válido. Revisá impactos antes de guardar.");
      setAdminWizardStep(5);
    } catch (err) {
      setAdminPreview(null);
      setAdminError(err.message || "No se pudo previsualizar el cambio.");
    } finally {
      setAdminLoading(false);
    }
  };

  const handleAdminApply = async () => {
    if (!adminPreview || adminPreview.variable !== adminVariable || Number(adminPreview.nuevo_valor) !== Number(adminNewValue)) {
      setAdminError("Primero generá un preview válido para este valor.");
      return;
    }
    const selected = (adminPrices?.variables || []).find((item) => item.key === adminVariable);
    const confirmed = window.confirm(
      `Vas a cambiar ${selected?.label || adminVariable} de ${selected?.value ?? adminPreview.valor_actual} a ${adminNewValue}. Se creará backup e historial. ¿Confirmás?`
    );
    if (!confirmed) return;
    try {
      setAdminLoading(true);
      setAdminError("");
      const applied = await applyAdminPrecio({ variable: adminVariable, nuevo_valor: Number(adminNewValue), confirmado: true });
      setAdminMsg(`Cambio guardado. Backup: ${(applied.backup || []).join(", ") || "-"}`);
      setAdminPreview(null);
      setAdminRollbackPreview(null);
      setAdminRollbackTargetId(null);
      setAdminWizardStep(6);
      await loadAdminPrices();
      await loadPrincipalVariables();
      setImpactData(null);
    } catch (err) {
      setAdminError(err.message || "No se pudo guardar el cambio.");
    } finally {
      setAdminLoading(false);
    }
  };

  const handleAdminRollbackPreview = async (historialId) => {
    try {
      setAdminLoading(true);
      setAdminError("");
      setAdminMsg("");
      const preview = await previewAdminPrecioRollback({ historial_id: historialId });
      setAdminRollbackPreview(preview);
      setAdminRollbackTargetId(historialId);
      setAdminMsg("Preview de restauración listo. Revisá antes de restaurar.");
      setAdminWizardStep(6);
    } catch (err) {
      setAdminRollbackPreview(null);
      setAdminRollbackTargetId(null);
      setAdminError(err.message || "No se pudo previsualizar la restauración.");
    } finally {
      setAdminLoading(false);
    }
  };

  const handleAdminRollbackApply = async () => {
    if (!adminRollbackPreview || !adminRollbackTargetId) {
      setAdminError("Primero previsualizá la restauración.");
      return;
    }
    const confirmed = window.confirm(
      `Vas a restaurar ${adminRollbackPreview.variable} de ${adminRollbackPreview.valor_actual} a ${adminRollbackPreview.valor_rollback}. Se creará un nuevo backup y se registrará el rollback.`
    );
    if (!confirmed) return;
    try {
      setAdminLoading(true);
      setAdminError("");
      const applied = await applyAdminPrecioRollback({ historial_id: adminRollbackTargetId, confirmado: true });
      setAdminMsg(`Rollback aplicado. Backup: ${(applied.backup || []).join(", ") || "-"}`);
      setAdminRollbackPreview(null);
      setAdminRollbackTargetId(null);
      setAdminPreview(null);
      await loadAdminPrices();
      await loadPrincipalVariables();
      setImpactData(null);
      setAdminWizardStep(6);
    } catch (err) {
      setAdminError(err.message || "No se pudo aplicar el rollback.");
    } finally {
      setAdminLoading(false);
    }
  };

  const handleLoadCurrentQuoteGraph = () => {
    setTraceError("");

    if (!result || !lastPayload) {
      setTraceGraph(null);
      setSelectedTraceNodeId(null);
      setTraceError("Primero calculá una cotización para ver su trazabilidad visual.");
      return;
    }

    try {
      const graph = buildCurrentQuoteTraceGraph(lastPayload, result);

      if (!graph || !Array.isArray(graph.nodes) || graph.nodes.length === 0) {
        setTraceGraph(null);
        setSelectedTraceNodeId(null);
        setTraceError("No se pudo construir el grafo de la cotización actual.");
        return;
      }

      setTraceGraph(graph);
      setSelectedTraceNodeId(graph.nodes[0]?.id ?? null);
    } catch (err) {
      setTraceGraph(null);
      setSelectedTraceNodeId(null);
      setTraceError(err.message || "No se pudo construir el grafo de la cotización actual.");
    }
  };

  const downloadPricesPdf = async () => {
    try {
      setPrincipalMsg("Generando PDF...");
      const { filename, blob } = await exportPricesPdf();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setPrincipalMsg("PDF exportado correctamente.");
    } catch (err) {
      setPrincipalMsg(err.message || "No se pudo exportar PDF. Revisar backend.");
    }
  };

  const downloadPricesExcel = async () => {
    try {
      setPrincipalMsg("Generando Excel maestro...");
      const { filename, blob } = await exportPricesExcel();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setPrincipalMsg("Excel maestro exportado correctamente.");
    } catch (err) {
      setPrincipalMsg(err.message || "No se pudo exportar Excel maestro. Revisar backend.");
    }
  };

  const previewExcelImport = async () => {
    if (!excelImportFile) {
      setExcelImportError("Seleccioná un archivo .xlsx para previsualizar.");
      setExcelImportPreview(null);
      return;
    }
    try {
      setExcelImportLoading(true);
      setExcelImportError("");
      const preview = await previewExcelMaestro(excelImportFile);
      setExcelImportPreview(preview);
      setPrincipalMsg("Preview de Excel maestro generado. No se aplicaron cambios.");
    } catch (err) {
      setExcelImportPreview(null);
      setExcelImportError(err.message || "No se pudo previsualizar el Excel maestro.");
    } finally {
      setExcelImportLoading(false);
    }
  };

  const savePrincipalVariables = async () => {
    if (!principalVariables) return;
    const updates = [];
    ["tipo_cambio", "clicks", "papeles", "multiplicadores", "adicionales"].forEach((group) => {
      (principalVariables[group] || []).forEach((item) => {
        const value = Number(principalDraft[item.key]);
        if (Number.isFinite(value) && value !== Number(item.value)) updates.push({ key: item.key, value });
      });
    });
    if (!updates.length) {
      setPrincipalMsg("No hay cambios para guardar.");
      return;
    }
    try {
      const response = await updatePrincipalVariables(updates);
      const summary = (response.updates || [])
        .map((item) => `${item.key}: ${item.previous_value} → ${item.new_value}`)
        .join(" · ");
      await loadPrincipalVariables();
      setPrincipalMsg(`Variables actualizadas: ${summary}`);
    } catch (err) {
      setPrincipalMsg(err.message || "No se pudieron guardar las variables principales.");
    }
  };

  const runValidateConfig = async () => {
    try {
      const res = await validateBajadasConfig();
      setCfgValidation(res);
      setCfgMsg(res.valid ? "Configuración válida." : "Configuración con errores.");
    } catch (err) {
      setCfgMsg(err.message || "No se pudo validar configuración.");
    }
  };

  const runSimulation = async () => {
    if (!lastPayload) {
      setCfgMsg("Primero calculá una cotización para simular.");
      return;
    }
    try {
      const sim = await simulateBajadasConfig({ quote: lastPayload, use_config_editable: true });
      setCfgSimulation(sim);
      setCfgMsg("Simulación ejecutada.");
    } catch (err) {
      setCfgMsg(err.message || "No se pudo simular configuración.");
    }
  };

  const createCandidate = async () => {
    try {
      setCfgMsg("");
      await createBajadasConfigCandidate({ motivo: "staging_desde_ui" });
      await loadConfigData();
      setCfgMsg("Candidato creado en estado PENDIENTE_APROBACION.");
    } catch (err) {
      setCfgMsg(err.message || "No se pudo crear candidato.");
    }
  };

  const rejectCandidate = async (candidateId) => {
    try {
      setCfgMsg("");
      await rejectBajadasConfigCandidate(candidateId, "rechazo_desde_ui");
      await loadConfigData();
      setCfgMsg(`Candidato ${candidateId} rechazado.`);
    } catch (err) {
      setCfgMsg(err.message || "No se pudo rechazar candidato.");
    }
  };

  const approveCandidate = async (candidateId) => {
    try {
      setCfgMsg("");
      await approveBajadasConfigCandidate(candidateId, "aprobacion_desde_ui");
      await loadConfigData();
      setCfgMsg(`Candidato ${candidateId} aprobado. No se aplicaron cambios productivos.`);
    } catch (err) {
      setCfgMsg(err.message || "No se pudo aprobar candidato.");
    }
  };

  const showBackupDetail = async (backupFilename) => {
    try {
      setCfgMsg("");
      const detail = await fetchBajadasBackupDetail(backupFilename);
      setCfgBackupDetail(detail);
    } catch (err) {
      setCfgMsg(err.message || "No se pudo leer detalle de backup.");
    }
  };

  const restoreBackup = async (backupFilename) => {
    const confirmation = window.prompt(
      "Para restaurar escribí exactamente: RESTAURAR_BACKUP_BAJADAS_V2"
    );
    if (confirmation === null) return;
    try {
      setCfgMsg("");
      const response = await restoreBajadasBackup(backupFilename, {
        confirmacion: confirmation,
        motivo: "restore_backup_desde_ui",
        usuario: "local",
      });
      await loadConfigData();
      setCfgMsg(
        `Backup restaurado: ${response.backup_restaurado}. Pre-restore creado: ${response.backup_pre_restore_creado}.`
      );
    } catch (err) {
      setCfgMsg(err.message || "No se pudo restaurar backup.");
    }
  };

  const previewRestoreBackup = async (backupFilename) => {
    try {
      setCfgMsg("");
      const preview = await previewRestoreBajadasBackup(backupFilename);
      setCfgBackupPreview(preview);
      setCfgMsg("Preview generado. Esta previsualización no modifica la configuración productiva.");
    } catch (err) {
      setCfgMsg(err.message || "No se pudo previsualizar restore.");
    }
  };

  const simulateBackupQuote = async (backupFilename) => {
    if (!lastPayload) {
      setCfgMsg("Primero calculá una cotización para usarla como base de simulación.");
      return;
    }
    try {
      setCfgMsg("");
      const simulation = await simulateRestoreBajadasBackup(backupFilename, lastPayload);
      setCfgBackupSimulation(simulation);
      setCfgMsg("Simulación ejecutada. Esta simulación no restaura el backup.");
    } catch (err) {
      setCfgMsg(err.message || "No se pudo simular cotización con backup.");
    }
  };

  const promoteCandidate = async (candidateId) => {
    const confirmation = window.prompt(
      "Para promover escribí exactamente: PROMOVER_CONFIG_BAJADAS_V2"
    );
    if (confirmation === null) return;
    try {
      setCfgMsg("");
      await promoteBajadasConfigCandidate(candidateId, {
        confirmacion: confirmation,
        motivo: "promocion_desde_ui",
        usuario: "local",
      });
      await loadConfigData();
      setCfgMsg(
        `Candidato ${candidateId} promovido. Se reemplazó config productiva con backup automático.`
      );
    } catch (err) {
      setCfgMsg(err.message || "No se pudo promover candidato.");
    }
  };

  useEffect(() => {
    fetchBajadasMetrics().then(setMetrics).catch(() => setMetrics(null));
    fetchBajadasHealth()
      .then((res) => setApiConnected(Boolean(res?.status === "ok" && Object.values(res?.checks ?? {}).every(Boolean))))
      .catch(() => setApiConnected(false));
    loadConfigData();
    loadPrincipalVariables();
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
    } catch {
      // Persistencia best-effort: el modo visual no debe bloquear la app.
    }
    if (viewMode === "simple" && understandMode === "trazabilidad") {
      setUnderstandMode("detalle");
    }
  }, [viewMode, understandMode]);

  useEffect(() => {
    setForm((prev) => {
      const next = { ...prev };
      if (next.categoria_ui === "Bajadas Autoadhesivas") {
        if (!AUTOADH_FORMATOS.includes(next.formato)) next.formato = "A3+";
        next.caras = "4/0";
        next.tipo_papel = next.columna_precio || "papel";
        next.material = next.columna_precio === "especial" ? "OPP blanco" : "Sticker";
        next.gramaje = next.columna_precio === "especial" ? "N/A" : "N/A";
        next.adicional_laminado_por_lado = "sin_adicional";
        next.adicional_plastificado = false;
        next.caras_adicional_laminado = "1";
        next.adicional_laminado = "sin_adicional";
        next.adicional_laca_uv = false;
        next.adicional_tinta_blanca = false;
        return next;
      }
      if (next.categoria_ui === "Bajadas Kraft") {
        if (!KRAFT_FORMATOS.includes(next.formato)) next.formato = "A3";
        if (!CARAS.includes(next.caras)) next.caras = "4/0";
        next.tipo_papel = KRAFT_TIPO_PAPEL;
        next.material = KRAFT_MATERIAL;
        if (!KRAFT_GRAMAJES.includes(next.gramaje)) next.gramaje = KRAFT_GRAMAJES[0];
        return next;
      }
      if (next.categoria_ui === "Tarjetas Personales 9x5") {
        next.formato = "9x5";
        if (!TARJETAS_CARAS.includes(next.caras)) next.caras = "4/0";
        if (!TARJETAS_GRAMAJES.includes(next.gramaje_tarjetas)) next.gramaje_tarjetas = "300g";
        next.tipo_papel = `${next.gramaje_tarjetas} Ilustracion`;
        next.material = `${next.gramaje_tarjetas} Ilustracion`;
        next.gramaje = next.gramaje_tarjetas;
        if (!TARJETAS_CANTIDADES.includes(String(next.cantidad_unidades))) next.cantidad_unidades = "100";
        if (!TARJETAS_TERMINACIONES.some((t) => t.value === next.terminacion_tarjetas)) next.terminacion_tarjetas = "sin_laminar";
        next.adicional_laminado = "sin_adicional";
        return next;
      }
      if (next.categoria_ui === "Tarjetas Postales") {
        next.formato = "postal";
        if (!POSTALES_CARAS.includes(next.caras)) next.caras = "4/0";
        if (!POSTALES_GRAMAJES.includes(next.gramaje_tarjetas)) next.gramaje_tarjetas = "300g";
        next.tipo_papel = `${next.gramaje_tarjetas} Ilustracion`;
        next.material = `${next.gramaje_tarjetas} Ilustracion`;
        next.gramaje = next.gramaje_tarjetas;
        if (!POSTALES_CANTIDADES.includes(String(next.cantidad_unidades))) next.cantidad_unidades = "100";
        if (!POSTALES_TERMINACIONES.some((t) => t.value === next.terminacion_tarjetas)) next.terminacion_tarjetas = "sin_laminar";
        next.adicional_laminado = "sin_adicional";
        return next;
      }
      if (next.categoria_ui === "Folletos") {
        next.formato = "10x15";
        if (!FOLLETOS_CANTIDADES.includes(String(next.cantidad_unidades))) next.cantidad_unidades = "100";
        if (!FOLLETOS_MODO_COLOR.includes(next.modo_color_folleto)) next.modo_color_folleto = "fullcolor";
        if (!FOLLETOS_PAPELES.find((p) => p.papel === next.papel_folleto)) next.papel_folleto = FOLLETOS_PAPELES[0].papel;
        next.tipo_papel = next.papel_folleto;
        next.material = next.papel_folleto;
        next.gramaje = FOLLETOS_PAPELES.find((p) => p.papel === next.papel_folleto)?.gramaje || "150g";
        const validCaras = next.modo_color_folleto === "fullcolor" ? ["4/0", "4/4"] : ["1/0", "1/1"];
        if (!validCaras.includes(next.caras)) next.caras = validCaras[0];
        next.adicional_laminado = "sin_adicional";
        return next;
      }
      if (next.categoria_ui === "Carpetas") {
        next.formato = "A4";
        if (!CARPETAS_CARAS.includes(next.caras)) next.caras = "4/0";
        next.tipo_papel = CARPETAS_PAPEL;
        next.material = CARPETAS_PAPEL;
        next.gramaje = CARPETAS_GRAMAJE;
        if (!CARPETAS_TERMINACIONES.some((t) => t.value === next.terminacion_carpetas)) next.terminacion_carpetas = "sin_laminar";
        if (!Number.isInteger(Number(next.cantidad_unidades)) || Number(next.cantidad_unidades) < 1) next.cantidad_unidades = "1";
        next.adicional_laminado = "sin_adicional";
        return next;
      }
      if (next.categoria_ui === "Sobres") {
        next.formato = "sobre";
        next.caras = "4/0";
        next.tipo_papel = "63g";
        next.material = "blanco";
        next.gramaje = "63g";
        if (!SOBRES_TIPOS.some((s) => s.value === next.tipo_sobre)) next.tipo_sobre = SOBRES_TIPOS[0].value;
        if (!SOBRES_CANTIDADES.includes(String(next.cantidad_unidades))) next.cantidad_unidades = "100";
        next.adicional_laminado = "sin_adicional";
        return next;
      }
      if (next.categoria_ui === "Stickers Corte Recto") {
        if (!STICKERS_FORMATOS.includes(next.formato)) next.formato = STICKERS_FORMATOS[0];
        next.caras = "4/0";
        next.tipo_papel = "sticker";
        next.material = "Sticker";
        next.gramaje = "N/A";
        if (!STICKERS_CANTIDADES.includes(String(next.cantidad_unidades))) next.cantidad_unidades = "100";
        if (!STICKERS_TERMINACIONES.some((t) => t.value === next.terminacion_stickers)) next.terminacion_stickers = "sin_laca_uv";
        next.adicional_laminado = "sin_adicional";
        return next;
      }
      if (next.categoria_ui === "Imanes Corte Recto") {
        if (!IMANES_FORMATOS.includes(next.formato)) next.formato = IMANES_FORMATOS[0];
        next.caras = "4/0";
        next.tipo_papel = "300g Ilustracion";
        next.material = "300g Ilustracion";
        next.gramaje = "300g";
        if (!IMANES_CANTIDADES.includes(String(next.cantidad_unidades))) next.cantidad_unidades = "100";
        if (!IMANES_TERMINACIONES.some((t) => t.value === next.terminacion_imanes)) next.terminacion_imanes = "sin_laca_uv";
        next.adicional_laminado = "sin_adicional";
        return next;
      }
      if (next.categoria_ui === "Stickers Circulares") {
        if (!STICKERS_CIRCULARES_FORMATOS.includes(next.formato)) next.formato = STICKERS_CIRCULARES_FORMATOS[0];
        next.caras = "4/0";
        next.tipo_papel = "sticker_circular";
        next.material = next.material_stickers_circulares || STICKERS_CIRCULARES_MATERIALES[0].value;
        next.gramaje = "N/A";
        if (!STICKERS_CIRCULARES_CANTIDADES.includes(String(next.cantidad_unidades))) next.cantidad_unidades = "100";
        if (!STICKERS_CIRCULARES_TERMINACIONES.some((t) => t.value === next.terminacion_stickers_circulares)) next.terminacion_stickers_circulares = "sin_laca_uv";
        if (!STICKERS_CIRCULARES_MATERIALES.some((m) => m.value === next.material_stickers_circulares)) next.material_stickers_circulares = STICKERS_CIRCULARES_MATERIALES[0].value;
        next.adicional_laminado = "sin_adicional";
        return next;
      }
      if (next.categoria_ui === "Tarjetas Troqueladas Circulares") {
        if (!TARJETAS_TROQ_CIRC_FORMATOS.includes(next.formato)) next.formato = TARJETAS_TROQ_CIRC_FORMATOS[0];
        if (!["4/0", "4/4"].includes(next.caras_tarjetas_troq_circ)) next.caras_tarjetas_troq_circ = "4/4";
        next.caras = next.caras_tarjetas_troq_circ;
        next.tipo_papel = "300g Ilustracion";
        next.material = "300g Ilustracion";
        next.gramaje = "300g";
        if (!TARJETAS_TROQ_CIRC_CANTIDADES.includes(String(next.cantidad_unidades))) next.cantidad_unidades = "100";
        next.adicional_laminado = "sin_adicional";
        if (!["sin_adicional", "laminado_brillo", "laminado_mate"].includes(next.adicional_laminado_troq_circ)) next.adicional_laminado_troq_circ = "sin_adicional";
        if (!["0", "1", "2"].includes(String(next.caras_adicional_troq_circ))) next.caras_adicional_troq_circ = "0";
        return next;
      }
      if (next.categoria_ui === "Plancha de Imán Impreso") {
        next.formato = "30x46";
        next.caras = "4/0";
        next.tipo_papel = "300g Ilustracion";
        next.material = "Imán 0.3mm";
        next.gramaje = "N/A";
        if (!PLANCHA_IMAN_VARIANTES.some((v) => v.value === next.variante_plancha_iman)) next.variante_plancha_iman = PLANCHA_IMAN_VARIANTES[0].value;
        if (!PLANCHA_IMAN_CANTIDADES_SUGERIDAS.includes(String(next.cantidad_unidades))) next.cantidad_unidades = "1";
        next.adicional_laminado = "sin_adicional";
        return next;
      }
      if (next.categoria_ui === "Agendas / Cuadernos") {
        if (!AGENDAS_PRODUCTOS.some((v) => v.value === next.producto_agendas)) next.producto_agendas = AGENDAS_PRODUCTOS[0].value;
        if (!AGENDAS_FORMATOS.includes(next.formato_agendas)) next.formato_agendas = "A5";
        if (!AGENDAS_PAGINAS.includes(String(next.paginas_agendas))) next.paginas_agendas = "24";
        next.formato = next.formato_agendas;
        next.caras = "N/A";
        next.tipo_papel = "300g tapas";
        next.material = "Promocional";
        next.gramaje = "N/A";
        if (Number(next.cantidad_unidades) < 2) next.cantidad_unidades = "2";
        next.adicional_laminado = "sin_adicional";
        next.adicional_troquelado = false;
        return next;
      }
      if (!next.categoria_ui.startsWith("Bajadas")) {
        next.adicional_laminado = "sin_adicional";
        next.adicional_troquelado = false;
      }
      if (!effectiveFormatoOptions.includes(next.formato)) next.formato = effectiveFormatoOptions[0] || "";
      return next;
    });
  }, [effectiveFormatoOptions]);

  useEffect(() => {
    setForm((prev) => {
      const next = { ...prev };
      if (
        next.categoria_ui === "Bajadas Autoadhesivas" ||
        next.categoria_ui === "Tarjetas Personales 9x5" ||
        next.categoria_ui === "Tarjetas Postales" ||
        next.categoria_ui === "Folletos" ||
        next.categoria_ui === "Carpetas" ||
        next.categoria_ui === "Sobres" ||
        next.categoria_ui === "Stickers Corte Recto" ||
        next.categoria_ui === "Imanes Corte Recto" ||
        next.categoria_ui === "Stickers Circulares" ||
        next.categoria_ui === "Tarjetas Troqueladas Circulares" ||
        next.categoria_ui === "Plancha de Imán Impreso" ||
        next.categoria_ui === "Agendas / Cuadernos"
      ) {
        return next;
      }
      if (next.categoria_ui === "Bajadas Kraft") {
        next.tipo_papel = KRAFT_TIPO_PAPEL;
        next.material = KRAFT_MATERIAL;
        if (!KRAFT_GRAMAJES.includes(next.gramaje)) next.gramaje = KRAFT_GRAMAJES[0];
        return next;
      }
      if (!tipoPapelOptions.includes(next.tipo_papel)) next.tipo_papel = tipoPapelOptions[0] || "";
      if (!materialOptions.includes(next.material)) next.material = materialOptions[0] || "";
      if (!gramajeOptions.includes(next.gramaje)) next.gramaje = gramajeOptions[0] || "";
      return next;
    });
  }, [tipoPapelOptions, materialOptions, gramajeOptions]);

  useEffect(() => {
    setForm((prev) => {
      const allowed = new Set(adicionalesDisponibles.map((a) => a.value));
      if (!allowed.has(prev.adicional_laminado)) {
        return { ...prev, adicional_laminado: "sin_adicional" };
      }
      return prev;
    });
  }, [adicionalesDisponibles]);

  useEffect(() => {
    if (!isFolletos) return;
    setForm((prev) => {
      const next = { ...prev };
      const paper = FOLLETOS_PAPELES.find((p) => p.papel === next.papel_folleto) || FOLLETOS_PAPELES[0];
      next.tipo_papel = paper.papel;
      next.material = paper.papel;
      next.gramaje = paper.gramaje;
      const allowedCaras = next.modo_color_folleto === "fullcolor" ? ["4/0", "4/4"] : ["1/0", "1/1"];
      if (!allowedCaras.includes(next.caras)) next.caras = allowedCaras[0];
      return next;
    });
  }, [isFolletos, form.papel_folleto, form.modo_color_folleto]);

  useEffect(() => {
    if (!isTarjetasTroqCirc) return;
    setForm((prev) => {
      if (prev.adicional_laminado_troq_circ === "sin_adicional" && prev.caras_adicional_troq_circ !== "0") {
        return { ...prev, caras_adicional_troq_circ: "0" };
      }
      if (prev.adicional_laminado_troq_circ !== "sin_adicional" && prev.caras_adicional_troq_circ === "0") {
        return { ...prev, caras_adicional_troq_circ: "1" };
      }
      return prev;
    });
  }, [isTarjetasTroqCirc, form.adicional_laminado_troq_circ]);

  const missingFields = useMemo(() => {
    const required = isAutoadhesivas
      ? ["urgencia", "columna_precio"]
      : isTarjetas
      ? ["formato", "tipo_papel", "material", "gramaje", "caras", "urgencia", "terminacion_tarjetas"]
      : isPostales
      ? ["formato", "tipo_papel", "material", "gramaje", "caras", "urgencia", "terminacion_tarjetas"]
      : isFolletos
      ? ["formato", "tipo_papel", "material", "gramaje", "caras", "urgencia", "modo_color_folleto"]
      : isCarpetas
      ? ["formato", "tipo_papel", "material", "gramaje", "caras", "urgencia", "terminacion_carpetas"]
      : isSobres
      ? ["tipo_sobre", "tipo_papel", "material", "gramaje", "caras", "urgencia"]
      : isStickers
      ? ["formato", "terminacion_stickers", "urgencia"]
      : isImanes
      ? ["formato", "tipo_papel", "material", "gramaje", "terminacion_imanes", "urgencia"]
      : isStickersCirculares
      ? ["formato", "material_stickers_circulares", "terminacion_stickers_circulares", "urgencia"]
      : isTarjetasTroqCirc
      ? ["formato", "caras_tarjetas_troq_circ", "urgencia"]
      : isPlanchaIman
      ? ["variante_plancha_iman", "urgencia"]
      : isAgendasCuadernos
      ? ["producto_agendas", "formato_agendas", "paginas_agendas", "urgencia"]
      : ["formato", "tipo_papel", "material", "gramaje", "caras", "urgencia"];
    return required.filter((field) => !String(form[field] ?? "").trim());
  }, [form, isAutoadhesivas, isTarjetas, isPostales, isFolletos, isCarpetas, isSobres, isStickers, isImanes, isStickersCirculares, isTarjetasTroqCirc, isPlanchaIman, isAgendasCuadernos]);

  const updateField = (field) => (event) => {
    setCopyStatus("");
    const value = event.target.value;
    if (field === "categoria_ui" && value === "Bajadas Fullcolor/ByN") {
      setForm((prev) => ({
        ...prev,
        categoria_ui: value,
        formato: "A3+",
      }));
      return;
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateCfgField = (field, value) => {
    setCfg((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      const parts = field.split(".");
      let target = next;
      for (let i = 0; i < parts.length - 1; i += 1) target = target[parts[i]];
      target[parts[parts.length - 1]] = value;
      return next;
    });
  };

  const saveCfgField = async (field, value) => {
    try {
      setCfgMsg("");
      await updateBajadasConfig({ field, value, motivo: "edicion_ui" });
      await loadConfigData();
      setCfgMsg(`Guardado: ${field}`);
    } catch (err) {
      setCfgMsg(err.message || "No se pudo guardar configuración.");
    }
  };

  const saveScales = async () => {
    try {
      setCfgMsg("");
      await updateBajadasConfig({ field: "escalas_cantidad", value: cfg?.escalas_cantidad || [], motivo: "edicion_ui" });
      await loadConfigData();
      setCfgMsg("Escalas guardadas.");
    } catch (err) {
      setCfgMsg(err.message || "No se pudieron guardar escalas.");
    }
  };

  const restoreCfg = async () => {
    try {
      setCfgMsg("");
      await restoreBajadasConfig({ motivo: "restaurar_desde_ui" });
      await loadConfigData();
      setCfgMsg("Configuración restaurada desde config final.");
    } catch (err) {
      setCfgMsg(err.message || "No se pudo restaurar configuración.");
    }
  };

  const handleClear = () => {
    setForm((prev) => ({
      ...prev,
      cantidad_unidades:
        prev.categoria_ui === "Tarjetas Personales 9x5" ||
        prev.categoria_ui === "Tarjetas Postales" ||
        prev.categoria_ui === "Folletos" ||
        prev.categoria_ui === "Sobres" ||
        prev.categoria_ui === "Stickers Corte Recto" ||
        prev.categoria_ui === "Imanes Corte Recto" ||
        prev.categoria_ui === "Stickers Circulares" ||
        prev.categoria_ui === "Tarjetas Troqueladas Circulares"
          ? "100"
          : prev.categoria_ui === "Agendas / Cuadernos"
          ? "2"
          : "1",
      urgencia: "normal",
      adicional_laminado: "sin_adicional",
      caras_adicional_laminado: "1",
      adicional_tinta_blanca: false,
      adicional_laca_uv: false,
      adicional_troquelado: false,
      complejidad_troquelado: "simple",
      terminacion_tarjetas: "sin_laminar",
      gramaje_tarjetas: "300g",
      terminacion_carpetas: "sin_laminar",
      terminacion_stickers: "sin_laca_uv",
      terminacion_imanes: "sin_laca_uv",
      material_stickers_circulares: STICKERS_CIRCULARES_MATERIALES[0].value,
      terminacion_stickers_circulares: "sin_laca_uv",
      caras_tarjetas_troq_circ: "4/4",
      adicional_laminado_troq_circ: "sin_adicional",
      caras_adicional_troq_circ: "0",
      variante_plancha_iman: PLANCHA_IMAN_VARIANTES[0].value,
      producto_agendas: AGENDAS_PRODUCTOS[0].value,
      formato_agendas: "A5",
      paginas_agendas: "24",
      solapa_impresa: false,
      tipo_sobre: SOBRES_TIPOS[0].value,
      papel_folleto: "150g Ilustracion",
      modo_color_folleto: "fullcolor",
    }));
    setResult(null);
    setLastPayload(null);
    setError("");
    setCopyStatus("");
    setLoading(false);
  };

  const handleCopy = async () => {
    if (!result) {
      setCopyStatus("Primero calculá una cotización.");
      return;
    }
    const finalValue = Number(result.total_con_urgencia ?? result.total_sin_iva ?? 0);
    const text = String(Math.round(finalValue));
    try {
      const copied = await copyToClipboard(text);
      setCopyStatus(copied ? "Precio final copiado." : "No se pudo copiar automáticamente.");
    } catch {
      setCopyStatus("No se pudo copiar automáticamente.");
    }
  };

  useEffect(() => {
    if (activeTab !== "Entender un precio" || understandMode !== "trazabilidad" || traceGraph || traceLoading) return;
    if (traceMode === "casos_generales") {
      loadTraceGraph(traceCase);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, understandMode, traceMode]);

  useEffect(() => {
    if (activeTab !== "Ver impacto de cambios" || impactData || impactLoading) return;
    loadVariablesImpacto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (!["Modificar precios", "Historial y backups"].includes(activeTab) || adminPrices || adminLoading) return;
    loadAdminPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setResult(null);
    if (traceMode === "cotizacion_actual") {
      setTraceGraph(null);
      setSelectedTraceNodeId(null);
    }
    setCopyStatus("");

    if (missingFields.length > 0) {
      setError(`Faltan campos obligatorios: ${missingFields.join(", ")}`);
      return;
    }
    if (!Number.isInteger(cantidadUnidades) || cantidadUnidades < 1) {
      setError("Cantidad inválida. Ingresá un entero mayor o igual a 1.");
      return;
    }
    if (!isMatrixProduct && !isNoRangeProduct && !derivedRange) {
      setError("La cantidad ingresada no entra en ningún rango disponible para esta combinación.");
      return;
    }
    if (isTarjetas && !TARJETAS_CANTIDADES.includes(String(cantidadUnidades))) {
      setError("Tarjetas 9x5 solo permite cantidades: 100, 200, 300, 500 o 1000.");
      return;
    }
    if (isPostales && !POSTALES_CANTIDADES.includes(String(cantidadUnidades))) {
      setError("Tarjetas Postales solo permite cantidades: 100, 200, 300, 500 o 1000.");
      return;
    }
    if (isFolletos && !FOLLETOS_CANTIDADES.includes(String(cantidadUnidades))) {
      setError("Folletos solo permite cantidades: 100, 200, 300, 500 o 1000.");
      return;
    }
    if (isCarpetas && cantidadUnidades > 1000) {
      setError("Carpetas solo permite cantidades de 1 a 1000.");
      return;
    }
    if (isSobres && !SOBRES_CANTIDADES.includes(String(cantidadUnidades))) {
      setError("Sobres solo permite cantidades: 100, 200, 300, 500 o 1000.");
      return;
    }
    if (isStickers && !STICKERS_CANTIDADES.includes(String(cantidadUnidades))) {
      setError("Stickers Corte Recto solo permite cantidades: 100, 200, 300, 500 o 1000.");
      return;
    }
    if (isImanes && !IMANES_CANTIDADES.includes(String(cantidadUnidades))) {
      setError("Imanes Corte Recto solo permite cantidades: 100, 200, 300, 500 o 1000.");
      return;
    }
    if (isStickersCirculares && !STICKERS_CIRCULARES_CANTIDADES.includes(String(cantidadUnidades))) {
      setError("Stickers Circulares solo permite cantidades: 100, 200, 300, 500 o 1000.");
      return;
    }
    if (isTarjetasTroqCirc && !TARJETAS_TROQ_CIRC_CANTIDADES.includes(String(cantidadUnidades))) {
      setError("Tarjetas Troqueladas Circulares solo permite cantidades: 100, 200, 300, 500 o 1000.");
      return;
    }
    if (isPlanchaIman && (cantidadUnidades < 1 || cantidadUnidades > 500)) {
      setError("Plancha de Imán Impreso permite cantidades de 1 a 500.");
      return;
    }
    if (isAgendasCuadernos && cantidadUnidades < 2) {
      setError("Agendas / Cuadernos requiere mínimo 2 unidades.");
      return;
    }
    if (isBajadasFlow && form.adicional_troquelado && !form.complejidad_troquelado) {
      setError("Debés elegir complejidad de troquelado.");
      return;
    }

    const payload = isTarjetas
      ? {
          categoria: "Tarjetas Personales",
          producto: "9x5",
          formato: "9x5",
          papel: `${form.gramaje_tarjetas} Ilustracion`,
          gramaje: form.gramaje_tarjetas,
          terminacion: form.terminacion_tarjetas,
          caras: inferred.caras,
          cantidad_unidades: cantidadUnidades,
          terminaciones_extra: {
            puntas_redondeadas: false,
            agujerado: false,
          },
          urgencia: form.urgencia,
        }
      : isPostales
      ? {
          categoria: "Tarjetas Postales",
          producto: "postal",
          formato: "postal",
          papel: `${form.gramaje_tarjetas} Ilustracion`,
          gramaje: form.gramaje_tarjetas,
          terminacion: form.terminacion_tarjetas,
          caras: inferred.caras,
          cantidad_unidades: cantidadUnidades,
          terminaciones_extra: {
            puntas_redondeadas: false,
            agujerado: false,
          },
          urgencia: form.urgencia,
        }
      : isFolletos
      ? {
          categoria: "Folletos",
          producto: "folleto",
          formato: form.formato,
          papel: form.papel_folleto,
          gramaje: FOLLETOS_PAPELES.find((p) => p.papel === form.papel_folleto)?.gramaje || "150g",
          modo_color: form.modo_color_folleto,
          caras: inferred.caras,
          cantidad_unidades: cantidadUnidades,
          urgencia: form.urgencia,
        }
      : isCarpetas
      ? {
          categoria: "Carpetas",
          producto: "carpeta_a4",
          formato: "A4",
          papel: CARPETAS_PAPEL,
          gramaje: CARPETAS_GRAMAJE,
          terminacion: form.terminacion_carpetas,
          caras: inferred.caras,
          cantidad_unidades: cantidadUnidades,
          solapa_impresa: Boolean(form.solapa_impresa),
          urgencia: form.urgencia,
        }
      : isSobres
      ? {
          categoria: "Sobres",
          producto: "sobre",
          tipo_sobre: form.tipo_sobre,
          papel: "63g",
          color: "blanco",
          caras: "4/0",
          cantidad_unidades: cantidadUnidades,
          urgencia: form.urgencia,
        }
      : isStickers
      ? {
          categoria: "Stickers Corte Recto",
          producto: "sticker_corte_recto",
          formato: form.formato,
          terminacion: form.terminacion_stickers,
          cantidad_unidades: cantidadUnidades,
          urgencia: form.urgencia,
        }
      : isImanes
      ? {
          categoria: "Imanes Corte Recto",
          producto: "iman_corte_recto",
          formato: form.formato,
          papel: "300g Ilustracion",
          gramaje: "300g",
          terminacion: form.terminacion_imanes,
          cantidad_unidades: cantidadUnidades,
          urgencia: form.urgencia,
        }
      : isStickersCirculares
      ? {
          categoria: "Stickers Circulares",
          producto: "sticker_circular",
          material: form.material_stickers_circulares,
          formato: form.formato,
          terminacion: form.terminacion_stickers_circulares,
          cantidad_unidades: cantidadUnidades,
          urgencia: form.urgencia,
        }
      : isTarjetasTroqCirc
      ? {
          categoria: "Tarjetas Troqueladas Circulares",
          producto: "tarjeta_troquelada_circular",
          formato: form.formato,
          caras: form.caras_tarjetas_troq_circ,
          adicional_laminado: form.adicional_laminado_troq_circ,
          caras_adicional_laminado: Number(form.caras_adicional_troq_circ || 0),
          cantidad_unidades: cantidadUnidades,
          urgencia: form.urgencia,
        }
      : isPlanchaIman
      ? {
          categoria: "Plancha de Imán Impreso",
          producto: "plancha_iman_impreso",
          variante: form.variante_plancha_iman,
          cantidad_unidades: cantidadUnidades,
          urgencia: form.urgencia,
        }
      : isAgendasCuadernos
      ? {
          categoria: "Agendas / Cuadernos",
          producto: form.producto_agendas,
          formato: form.formato_agendas,
          paginas: Number(form.paginas_agendas),
          cantidad_unidades: cantidadUnidades,
          urgencia: form.urgencia,
        }
      : {
          categoria: inferred.categoria,
          modo_color: inferred.modo_color,
          formato: inferred.formato,
          tipo_papel: isAutoadhesivas ? form.columna_precio : (isKraft ? KRAFT_TIPO_PAPEL : form.tipo_papel),
          material: isAutoadhesivas ? (form.columna_precio === "especial" ? "OPP blanco" : "Sticker") : (isKraft ? KRAFT_MATERIAL : form.material),
          gramaje: isAutoadhesivas ? "N/A" : (isKraft ? form.gramaje : form.gramaje),
          cantidad_unidades: cantidadUnidades,
          cantidad_rango: derivedRange,
          caras: inferred.caras,
          urgencia: form.urgencia,
          adicional_laminado: form.adicional_laminado || "sin_adicional",
          caras_adicional_laminado:
            !isAutoadhesivas && ["laca", "laminado_brillo", "laminado_mate"].includes(form.adicional_laminado)
              ? Number(form.caras_adicional_laminado || 1)
              : 1,
          adicional_laminado_por_lado:
            !isAutoadhesivas && (inferred.formato === "A3+" || inferred.formato === "XA3")
              ? (form.adicional_laminado_por_lado || "sin_adicional")
              : "sin_adicional",
          adicional_plastificado:
            !isAutoadhesivas && (inferred.formato === "A3+" || inferred.formato === "XA3")
              ? Boolean(form.adicional_plastificado)
              : false,
          adicional_tinta_blanca: isAutoadhesivas ? Boolean(form.adicional_tinta_blanca) : false,
          adicional_laca_uv: isAutoadhesivas ? Boolean(form.adicional_laca_uv) : false,
          adicional_troquelado: Boolean(form.adicional_troquelado),
          complejidad_troquelado: form.adicional_troquelado ? form.complejidad_troquelado : undefined,
          tipo_producto: isAutoadhesivas ? "autoadhesiva" : undefined,
          columna_precio: isAutoadhesivas ? form.columna_precio : undefined,
        };

    setLoading(true);
    try {
      const response = isTarjetas
        ? await cotizarTarjetas9x5(payload)
        : isPostales
        ? await cotizarTarjetasPostales(payload)
        : isFolletos
        ? await cotizarFolletos(payload)
        : isCarpetas
        ? await cotizarCarpetas(payload)
        : isSobres
        ? await cotizarSobres(payload)
        : isStickers
        ? await cotizarStickersCorteRecto(payload)
        : isImanes
        ? await cotizarImanesCorteRecto(payload)
        : isStickersCirculares
        ? await cotizarStickersCirculares(payload)
        : isTarjetasTroqCirc
        ? await cotizarTarjetasTroqueladasCirculares(payload)
        : isPlanchaIman
        ? await cotizarPlanchaImanImpreso(payload)
        : isAgendasCuadernos
        ? await cotizarAgendasCuadernos(payload)
        : await cotizarBajadaV2(payload);
      setResult(response);
      setLastPayload(payload);
    } catch (err) {
      if (err.code === "cantidad_fuera_de_matriz") {
        setError("Cantidad fuera de matriz para este producto.");
      } else if (err.code === "cantidad_minima_no_alcanzada") {
        setError("Cantidad mínima no alcanzada para este producto.");
      } else if (err.code === "terminacion_no_soportada") {
        setError("Terminación no soportada.");
      } else if (err.code === "formato_no_soportado") {
        setError("Formato no soportado para Folletos.");
      } else if (err.code === "caras_no_compatibles") {
        setError("Caras incompatibles con modo color.");
      } else if (err.code === "caras_no_soportadas") {
        setError("Caras no soportadas para este producto.");
      } else if (err.code === "tipo_sobre_no_soportado") {
        setError("Tipo de sobre no soportado.");
      } else if (err.code === "material_no_soportado") {
        setError("Material no soportado para Stickers Circulares.");
      } else if (err.code === "material_opp_pendiente_datos") {
        setError("OPP pendiente de datos confiables para Stickers Circulares.");
      } else if (err.code === "tinta_blanca_bloqueada_por_falta_de_datos") {
        setError("Tinta blanca bloqueada por falta de datos confiables.");
      } else if (err.code === "tinta_blanca_bloqueada_por_falta_de_valor_base_1_copia") {
        setError("Tinta blanca bloqueada: falta valor base de 1 copia para cálculo proporcional.");
      } else if (err.code === "adicional_no_soportado_para_liviano") {
        setError("Para papel liviano solo se permite Sin adicional o Laca UV.");
      } else if (err.code === "adicional_no_soportado_para_autoadhesivas") {
        setError("Autoadhesivas no admite laminado por lado ni plastificado.");
      } else if (err.code === "adicionales_hoja4_solo_a3plus_xa3") {
        setError("Laminado por lado y plastificado solo aplican a A3+ o XA3.");
      } else if (err.code === "complejidad_troquelado_requerida") {
        setError("Debés elegir complejidad de troquelado.");
      } else if (err.code === "complejidad_troquelado_no_soportada") {
        setError("Complejidad de troquelado no soportada.");
      } else if (err.code === "combinacion_no_encontrada") {
        setError("La combinación seleccionada no existe en la tabla de Bajadas v2. Revisá formato, papel, gramaje y rango.");
      } else if (err.code === "urgencia_invalida") {
        setError("Urgencia inválida. Revisá el campo Urgencia.");
      } else if (err.status >= 500) {
        setError("La API respondió con error interno.");
      } else if (err.status === 0 || err.message.includes("Failed to fetch")) {
        setError("API caída o inaccesible en http://127.0.0.1:8000.");
      } else {
        setError(err.message || "No se pudo calcular.");
      }
    } finally {
      setLoading(false);
    }
  };

  const renderTreeTab = () => {
    if (!result || !lastPayload) {
      return (
        <section className="card result-card">
          <div className="card-head"><h3>Detalle del cálculo</h3></div>
          <div className="placeholder"><p>Completá los datos y presioná Calcular.</p></div>
        </section>
      );
    }
    if (isSimpleMode) {
      return (
        <section className="card result-card" data-testid="understand-simple-summary">
          <div className="card-head">
            <div>
              <h3>Resumen simple del precio</h3>
              <p>Primero ves un resumen simple. Activá modo avanzado para ver grafo, árbol y fuentes de cálculo.</p>
            </div>
            <span>Modo simple</span>
          </div>
          <div className="simple-summary-card">
            <div className="detail-list compact-detail-list">
              <div><strong>Material</strong><span>{lastPayload.material ?? lastPayload.papel ?? "-"}</span></div>
              <div><strong>Impresión / click</strong><span>{lastPayload.caras ?? "-"}</span></div>
              <div><strong>Cantidad</strong><span>{lastPayload.cantidad_unidades ?? "-"}</span></div>
              <div><strong>Rango o cantidad</strong><span>{result.cantidad_rango_aplicado ?? result.cantidad_unidades ?? "-"}</span></div>
              <div><strong>Adicionales</strong><span>{result.adicional_troquelado ? "Troquelado incluido" : (result.adicional_laminado ?? "sin_adicional")}</span></div>
              <div><strong>Urgencia</strong><span>{lastPayload.urgencia ?? "normal"}</span></div>
              <div><strong>Total final</strong><span>{formatMoney(result.total_con_urgencia ?? result.total_sin_iva)}</span></div>
            </div>
            <p>El total combina entrada del usuario, cantidad/rango, adicionales y urgencia. El modo avanzado muestra reglas, árbol completo, grafo y fuentes.</p>
          </div>
        </section>
      );
    }
    return (
      <section className="card result-card">
        <div className="card-head"><h3>Detalle del cálculo</h3><span>Último cálculo</span></div>
        <div className="tree-grid">
          <details open><summary>Entrada del usuario</summary><ul><li>Formato: {lastPayload.formato}</li><li>Impresión: {lastPayload.caras}</li><li>Tipo papel: {lastPayload.tipo_papel ?? lastPayload.papel ?? "-"}</li><li>Tipo autoadhesivo: {lastPayload.columna_precio ?? "-"}</li><li>Terminación: {lastPayload.terminacion ?? "-"}</li><li>Material: {lastPayload.material ?? lastPayload.papel ?? "-"}</li><li>Gramaje: {lastPayload.gramaje}</li><li>Cantidad: {lastPayload.cantidad_unidades}</li><li>Urgencia: {lastPayload.urgencia}</li></ul></details>
          <details open><summary>Rango aplicado</summary><ul><li>{result.cantidad_rango_aplicado}</li></ul></details>
          <details open><summary>Precio unitario</summary><ul><li>Sin IVA: {formatMoney(result.precio_unitario_sin_iva)}</li><li>Con urgencia: {formatMoney(result.precio_unitario_con_urgencia)}</li></ul></details>
          <details open><summary>Adicional laminado/laca</summary><ul><li>selección: {result.adicional_laminado ?? "sin_adicional"}</li><li>adicional_unitario_sin_iva: {formatMoney(result.adicional_unitario_sin_iva ?? 0)}</li><li>regla_adicional_aplicada: {result.regla_adicional_aplicada ?? "-"}</li><li>fuente_adicional: {result.fuente_adicional ?? "-"}</li><li>rango_aplicado: {result.trazabilidad?.adicional_laminado?.rango_aplicado ?? "-"}</li><li>nota: Laca / laminado se suma antes de urgencia.</li><li>no_combinable: true</li></ul></details>
          <details open><summary>Adicionales hoja 4</summary><ul><li>laminado_por_lado: {result.adicional_laminado_por_lado ?? "sin_adicional"}</li><li>plastificado: {result.adicional_plastificado ? "sí" : "no"}</li><li>unitario_total_hoja4: {formatMoney(result.adicional_hoja4_unitario_sin_iva ?? 0)}</li><li>subtotal_hoja4: {formatMoney(result.total_adicional_hoja4_sin_iva ?? 0)}</li><li>fuente: {result.trazabilidad?.adicionales_hoja4?.detalle?.laminado_por_lado?.fuente ?? result.trazabilidad?.adicionales_hoja4?.detalle?.plastificado?.fuente ?? "-"}</li><li>nota: solo A3+ / XA3; Oficio no aplica.</li></ul></details>
          <details open><summary>Adicional Troquelado Digital</summary><ul><li>selección: {result.adicional_troquelado ? "sí" : "no"}</li><li>complejidad: {result.complejidad_troquelado ?? "-"}</li><li>precio_unitario_troquelado: {formatMoney(result.adicional_troquelado_unitario_sin_iva ?? 0)}</li><li>subtotal_troquelado: {formatMoney(result.total_adicional_troquelado_sin_iva ?? 0)}</li><li>rango_aplicado: {result.trazabilidad?.adicional_troquelado?.rango_aplicado ?? "-"}</li><li>regla_aplicada: {result.regla_troquelado_aplicada ?? "-"}</li><li>fuente: {result.fuente_troquelado ?? "-"}</li><li>nota: No incluye costo de impresión; se suma como adicional.</li></ul></details>
          <details open><summary>Total</summary><ul><li>Sin IVA: {formatMoney(result.total_sin_iva)}</li><li>Con urgencia: {formatMoney(result.total_con_urgencia)}</li></ul></details>
          <details open data-testid="price-tree-rule-section"><summary>Regla</summary><ul><li>regla_aplicada: {result.regla_aplicada}</li><li>fuente: {result.fuente}</li><li>base_formato: {result.trazabilidad?.base_formato ?? "-"}</li><li>factor_aplicado: {result.trazabilidad?.factor_aplicado ?? "-"}</li><li>regla_especial: {result.trazabilidad?.regla_especial ?? "-"}</li><li>correccion_logica: {result.trazabilidad?.correccion_logica ?? "-"}</li></ul></details>
          <details open><summary>Origen</summary><ul><li>origen_excel: {result.trazabilidad?.origen_excel ?? "-"}</li><li>precio_objetivo_csv: {result.trazabilidad?.precio_objetivo_csv ?? result.trazabilidad?.precio_objetivo_pdf ?? "-"}</li><li>precio_unitario_csv: {result.trazabilidad?.precio_unitario_csv ?? "-"}</li><li>modelo_tecnico_referencia: {result.trazabilidad?.modelo_tecnico_referencia ?? "-"}</li><li>precio_b3_referencia: {result.trazabilidad?.precio_b3_referencia ?? "-"}</li><li>an40_estado: {result.trazabilidad?.an40_estado ?? "-"}</li></ul></details>
          <details open><summary>Adicionales excluidos</summary><ul>{(result.trazabilidad?.adicionales_excluidos ?? []).length ? (result.trazabilidad.adicionales_excluidos.map((item) => <li key={item}>{item}</li>)) : <li>-</li>}</ul></details>
          <details open><summary>Urgencia</summary><ul><li>recargo_urgencia_aplicado: {result.trazabilidad?.recargo_urgencia_aplicado ?? "-"}</li></ul></details>
        </div>
        <details className="raw-json"><summary>Ver JSON técnico</summary><pre>{JSON.stringify({ payload: lastPayload, result }, null, 2)}</pre></details>
      </section>
    );
  };

  const renderTraceVisualTab = () => {
    const graph = traceGraph || { nodes: [], edges: [], legend: {} };
    const { positions, width, height } = layoutTraceGraph(graph);
    const selectedNode = graph.nodes.find((node) => node.id === selectedTraceNodeId) || graph.nodes[0] || null;
    const selectedCase = TRACE_GRAPH_CASES.find((item) => item.value === traceCase);
    const isCurrentMode = traceMode === "cotizacion_actual";

    return (
      <section className="card result-card trace-visual-card">
        <div className="card-head">
          <div>
            <h3 data-testid="trace-visual-title">Trazabilidad visual avanzada</h3>
            <p>Modo avanzado: relaciones entre variable madre, derivado, factor y precio final. Es lectura: no modifica precios.</p>
          </div>
          <span>{isCurrentMode ? "Cotización actual" : graph.producto || selectedCase?.label || "Grafo"}</span>
        </div>

        <div className="trace-mode-box">
          <span>Modo de trazabilidad</span>
          <div className="trace-mode-options" role="group" aria-label="Modo de trazabilidad">
            {TRACE_MODES.map((mode) => (
              <button
                key={mode.value}
                type="button"
                className={traceMode === mode.value ? "trace-mode-pill active" : "trace-mode-pill"}
                data-testid={`trace-mode-${mode.value}`}
                onClick={() => {
                  setTraceMode(mode.value);
                  setTraceGraph(null);
                  setSelectedTraceNodeId(null);
                  setTraceError("");
                }}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div className="trace-toolbar">
          {isCurrentMode ? (
            <>
              <div className="trace-current-summary" data-testid="trace-current-summary">
                {lastPayload && result ? (
                  <>
                    <strong>{lastPayload.categoria || "Cotización actual"}</strong>
                    <span>{describeCurrentQuoteMaterial(lastPayload)} · {lastPayload.formato || "-"} · {lastPayload.caras || "-"} · {lastPayload.cantidad_unidades || "-"} u.</span>
                  </>
                ) : (
                  <span>Primero calculá una cotización para ver su trazabilidad visual.</span>
                )}
              </div>
              <button type="button" className="secondary-button" data-testid="trace-current-load-button" onClick={handleLoadCurrentQuoteGraph} disabled={!lastPayload || !result}>
                Cargar grafo de cotización actual
              </button>
            </>
          ) : (
            <>
              <label>
                <span>Casos de lógica general</span>
                <select
                  data-testid="trace-case-select"
                  value={traceCase}
                  onChange={(event) => {
                    const nextCase = event.target.value;
                    setTraceCase(nextCase);
                    setTraceGraph(null);
                    setSelectedTraceNodeId(null);
                  }}
                >
                  {TRACE_GRAPH_CASES.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
              <button type="button" className="secondary-button" data-testid="trace-load-button" onClick={() => loadTraceGraph(traceCase)} disabled={traceLoading}>
                {traceLoading ? "Cargando..." : "Cargar caso fijo"}
              </button>
            </>
          )}
        </div>

        {traceError ? <div className="error-banner">{traceError}</div> : null}

        <div className="trace-legend" data-testid="trace-legend">
          {Object.entries(graph.legend || {}).map(([type, label]) => (
            <span className={`legend-chip ${type}`} key={type}><i />{TRACE_TYPE_LABELS[type] || type}: {label}</span>
          ))}
        </div>

        <div className="trace-layout">
          <div className="trace-graph-card" data-testid="trace-graph-container">
            {graph.nodes.length ? (
              <svg className="trace-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Grafo de trazabilidad de precios">
                <defs>
                  <marker id="trace-arrow" markerWidth="13" markerHeight="13" refX="11" refY="4" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L0,8 L11,4 z" fill="#8aa4d6" />
                  </marker>
                </defs>
                {graph.edges.map((edge) => {
                  const from = positions[edge.source];
                  const to = positions[edge.target];
                  if (!from || !to) return null;
                  const startX = from.x + TRACE_NODE_WIDTH;
                  const startY = from.y + TRACE_NODE_HEIGHT / 2;
                  const endX = to.x - 12;
                  const endY = to.y + TRACE_NODE_HEIGHT / 2;
                  const curve = Math.max(80, Math.abs(endX - startX) / 2);
                  return (
                    <g key={edge.id}>
                      <path className="trace-edge" d={`M ${startX} ${startY} C ${startX + curve} ${startY}, ${endX - curve} ${endY}, ${endX} ${endY}`} markerEnd="url(#trace-arrow)" />
                      <text className="trace-edge-label" x={(startX + endX) / 2} y={(startY + endY) / 2 - 6}>{edge.label}</text>
                    </g>
                  );
                })}
                {graph.nodes.map((node) => {
                  const pos = positions[node.id] || { x: 0, y: 0 };
                  const visualType = traceNodeVisualType(node);
                  const selected = selectedNode?.id === node.id;
                  return (
                    <g key={node.id} className={`trace-node ${visualType} ${selected ? "selected" : ""}`} transform={`translate(${pos.x} ${pos.y})`} onClick={() => setSelectedTraceNodeId(node.id)} tabIndex="0" role="button" aria-label={`Nodo ${node.label}`}>
                      <rect className="trace-node-rect" width={TRACE_NODE_WIDTH} height={TRACE_NODE_HEIGHT} rx="18" />
                      <text className="trace-node-title" x="18" y="30">{node.label}</text>
                      <text className="trace-node-meta" x="18" y="56">{TRACE_TYPE_LABELS[visualType] || visualType}</text>
                      <text className="trace-node-value" x="18" y="80">{formatTraceValue(node)}</text>
                    </g>
                  );
                })}
              </svg>
            ) : (
              <div className="placeholder">
                <p>
                  {traceLoading
                    ? "Cargando grafo..."
                    : isCurrentMode
                      ? "Presioná Cargar grafo de cotización actual para ver la trazabilidad del último cálculo."
                      : "Elegí un caso y presioná Cargar grafo."}
                </p>
              </div>
            )}
          </div>

          <aside className="trace-detail" data-testid="trace-node-detail">
            <h4>Detalle del nodo</h4>
            {selectedNode ? (
              <div className="trace-detail-grid">
                <div><strong>Nombre</strong><span>{selectedNode.label}</span></div>
                <div><strong>Valor</strong><span>{formatTraceValue(selectedNode)}</span></div>
                <div><strong>Tipo</strong><span>{TRACE_TYPE_LABELS[traceNodeVisualType(selectedNode)] || selectedNode.type}</span></div>
                <div><strong>Editable</strong><span>{selectedNode.editable_en_sistema ? "sí" : "no"}</span></div>
                <div><strong>Impacta hoy</strong><span>{selectedNode.impacta_hoy ? "sí" : "no"}</span></div>
                <div><strong>Fuente</strong><span>{selectedNode.source || "-"}</span></div>
                <div><strong>Operación</strong><span>{selectedNode.operation || "-"}</span></div>
                <div><strong>Descripción</strong><span>{selectedNode.description || "-"}</span></div>
                <div><strong>Observación</strong><span>{selectedNode.observation || "-"}</span></div>
              </div>
            ) : (
              <p>Seleccioná un nodo del grafo para ver fuente, operación y observación.</p>
            )}
          </aside>
        </div>
      </section>
    );
  };

  const renderUnderstandPriceTab = () => (
    <EntenderPrecioPanel
      isSimpleMode={isSimpleMode}
      isAdvancedMode={isAdvancedMode}
      understandMode={understandMode}
      setUnderstandMode={setUnderstandMode}
      renderTreeTab={renderTreeTab}
      renderTraceVisualTab={renderTraceVisualTab}
    />
  );
  const formatHistoryValue = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    return String(value);
  };

  const renderRollbackPreviewPanel = () => (
    <section className="rollback-preview-panel" data-testid="admin-rollback-preview">
      <div className="rollback-preview-head">
        <div>
          <strong>Preview de restauración</strong>
          <p>
            {adminRollbackPreview
              ? `Vas a restaurar ${adminRollbackPreview.variable} de ${adminRollbackPreview.valor_actual} a ${adminRollbackPreview.valor_rollback}.`
              : "Elegí un cambio y previsualizá antes de restaurar."}
          </p>
        </div>
        <span>{adminRollbackPreview ? "Listo para confirmar" : "Requiere preview"}</span>
      </div>
      {adminRollbackPreview ? (
        <>
          <div className="rollback-preview-grid">
            <div>
              <span>Valor actual</span>
              <strong>{formatHistoryValue(adminRollbackPreview.valor_actual)} {adminRollbackPreview.unidad || ""}</strong>
            </div>
            <div>
              <span>Valor a restaurar</span>
              <strong>{formatHistoryValue(adminRollbackPreview.valor_rollback)} {adminRollbackPreview.unidad || ""}</strong>
            </div>
            <div>
              <span>Productos afectados</span>
              <strong>{(adminRollbackPreview.impactos || []).length || "Sin impactos directos"}</strong>
            </div>
          </div>
          {(adminRollbackPreview.advertencias || []).length ? (
            <ul className="rollback-warning-list">
              {adminRollbackPreview.advertencias.map((warning) => <li key={warning}>{warning}</li>)}
            </ul>
          ) : null}
        </>
      ) : (
        <p className="range-hint">El botón Restaurar queda deshabilitado hasta tener un preview válido.</p>
      )}
      <div className="principal-actions">
        <button
          type="button"
          className="calculate-btn compact-calculate-btn"
          data-testid="admin-rollback-apply-button"
          onClick={handleAdminRollbackApply}
          disabled={!adminRollbackPreview || !adminRollbackTargetId || adminLoading}
        >
          Restaurar este cambio
        </button>
      </div>
    </section>
  );

  const renderAdminHistoryEntries = ({ limit = 10 } = {}) => {
    const entries = adminHistory.slice().reverse().slice(0, limit);
    if (!entries.length) {
      return <p className="range-hint">Sin cambios registrados todavía.</p>;
    }
    return (
      <div className="history-list rollback-history-list">
        {entries.map((item, index) => {
          const historyId = item.id || `${item.timestamp}-${item.variable}-${index}`;
          const isRollback = item.tipo === "rollback";
          return (
            <article className="history-event-card" key={historyId} data-testid={`history-event-${historyId}`}>
              <div className="history-event-head">
                <span className={isRollback ? "history-event-badge rollback" : "history-event-badge"}>
                  {isRollback ? "Rollback" : "Cambio"}
                </span>
                <span>{item.timestamp || "-"}</span>
              </div>
              <div className="history-event-main">
                <strong>{item.variable || "-"}</strong>
                <span>{formatHistoryValue(item.valor_anterior)} → {formatHistoryValue(item.valor_nuevo)}</span>
              </div>
              <p className="range-hint">{item.descripcion || `${item.fuente || "sistema"} · ${historyId}`}</p>
              {isAdvancedMode ? (
                <div className="history-event-meta" data-testid="history-advanced-meta">
                  <span>Fuente: {item.fuente || "sistema"}</span>
                  <span>Backup: {(item.backup || []).length ? item.backup.join(", ") : "-"}</span>
                  <span>ID: {historyId}</span>
                  {isRollback ? <span>Rollback de: {item.rollback_de || "-"}</span> : null}
                </div>
              ) : (
                <div className="history-event-meta simple-history-meta">
                  <span>Estado: {isRollback ? "Restauración registrada" : "Restaurable con preview"}</span>
                </div>
              )}
              <div className="history-event-actions">
                {isRollback ? (
                  <button type="button" className="secondary-btn" disabled>Evento rollback no restaurable</button>
                ) : (
                  <button
                    type="button"
                    className="secondary-btn"
                    data-testid="admin-rollback-preview-button"
                    onClick={() => handleAdminRollbackPreview(historyId)}
                    disabled={adminLoading}
                  >
                    Previsualizar restauración
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    );
  };

  const renderHistoryBackupsTab = () => (
    <HistorialBackupsPanel
      renderAdminHistoryEntries={renderAdminHistoryEntries}
      renderRollbackPreviewPanel={renderRollbackPreviewPanel}
      cfgBackups={cfgBackups}
      adminError={adminError}
      adminMsg={adminMsg}
      adminLoading={adminLoading}
      adminPrices={adminPrices}
    />
  );

  const renderExportSupportExcelTab = () => (
    <ExportarSoporteExcelPanel
      isSimpleMode={isSimpleMode}
      principalMsg={principalMsg}
      downloadPricesExcel={downloadPricesExcel}
      downloadPricesPdf={downloadPricesPdf}
    />
  );

  const renderAdvancedConfigTab = () => (
    <ConfiguracionAvanzadaPanel
      isSimpleMode={isSimpleMode}
      isAdvancedMode={isAdvancedMode}
      setViewMode={setViewMode}
      renderPrincipalVariablesTab={renderPrincipalVariablesTab}
      renderConfigTab={renderConfigTab}
    />
  );
  const renderConfigTab = () => {
    if (!cfg) return <section className="card result-card"><div className="placeholder"><p>Cargando configuración...</p></div></section>;

    return (
      <section className="card result-card">
        <div className="card-head"><h3 data-testid="config-editable-title">Configuración editable</h3><span>Version {cfg?.editable_meta?.version ?? 1}</span></div>
        {cfgMsg ? <div className="info-box">{cfgMsg}</div> : null}
        <div className="warning-box">La configuración editable todavía no afecta al cotizador productivo.</div>
        <div className="warning-box">
          Promover reemplaza la configuración productiva. Se creará backup automático.
        </div>

        <h4 className="subhead">Versión activa</h4>
        <div className="detail-list">
          <div><strong>Estado</strong><span>{cfgActiveVersion?.estado || "-"}</span></div>
          <div><strong>Versión</strong><span>{cfgActiveVersion?.version_activa || "-"}</span></div>
          <div><strong>Candidato origen</strong><span>{cfgActiveVersion?.candidato_origen || "-"}</span></div>
          <div><strong>Hash config final</strong><span>{cfgActiveVersion?.hash_config_final || "-"}</span></div>
        </div>

        <h4 className="subhead">Candidato de configuración</h4>
        <div className="actions-row">
          <button type="button" className="secondary-btn" onClick={createCandidate}>Crear candidato</button>
        </div>
        <div className="diff-table">
          {(cfgCandidates || []).slice().reverse().slice(0, 20).map((c) => (
            <div key={c.candidate_id} className="diff-row">
              <span>{c.candidate_id}</span>
              <span>{c.estado}</span>
              <span>{c.criticidad_maxima}</span>
              <button
                type="button"
                className="secondary-btn"
                disabled={c.estado !== "PENDIENTE_APROBACION"}
                onClick={() => approveCandidate(c.candidate_id)}
              >
                Aprobar
              </button>
              <button
                type="button"
                className="secondary-btn"
                disabled={c.estado !== "APROBADO"}
                onClick={() => promoteCandidate(c.candidate_id)}
              >
                Promover
              </button>
              <button
                type="button"
                className="secondary-btn"
                disabled={c.estado === "RECHAZADO" || c.estado === "PROMOVIDO"}
                onClick={() => rejectCandidate(c.candidate_id)}
              >
                Rechazar
              </button>
            </div>
          ))}
        </div>

        <h4 className="subhead">Backups disponibles</h4>
        <div className="diff-table">
          {(cfgBackups || []).slice(0, 20).map((b) => (
            <div key={b.archivo} className="diff-row">
              <span>{b.archivo}</span>
              <span>{b.fecha || "-"}</span>
              <span>{b.tamano_bytes ?? "-"}</span>
              <button type="button" className="secondary-btn" onClick={() => showBackupDetail(b.archivo)}>Ver detalle</button>
              <button type="button" className="secondary-btn" onClick={() => previewRestoreBackup(b.archivo)}>Previsualizar restore</button>
              <button type="button" className="secondary-btn" onClick={() => simulateBackupQuote(b.archivo)}>Simular cotización con backup</button>
              <button type="button" className="secondary-btn" onClick={() => restoreBackup(b.archivo)}>Restaurar backup</button>
            </div>
          ))}
        </div>
        <div className="warning-box">
          Restaurar un backup reemplaza la configuración productiva actual. Se creará un backup previo automático.
        </div>
        {cfgBackupDetail ? (
          <div className="detail-list">
            <div><strong>Backup</strong><span>{cfgBackupDetail.archivo}</span></div>
            <div><strong>Hash</strong><span>{cfgBackupDetail.hash || "-"}</span></div>
            <div><strong>Valid</strong><span>{String(cfgBackupDetail.valid)}</span></div>
            <div><strong>Warnings</strong><span>{(cfgBackupDetail.warnings || []).length}</span></div>
            <div><strong>Errors</strong><span>{(cfgBackupDetail.errors || []).length}</span></div>
          </div>
        ) : null}
        {cfgBackupPreview ? (
          <>
            <div className="detail-list">
              <div><strong>Hash actual</strong><span>{cfgBackupPreview.config_final_hash_actual || "-"}</span></div>
              <div><strong>Hash backup</strong><span>{cfgBackupPreview.backup_hash || "-"}</span></div>
              <div><strong>Cambios</strong><span>{cfgBackupPreview.resumen?.cantidad_cambios ?? 0}</span></div>
              <div><strong>Criticidad</strong><span>{cfgBackupPreview.resumen?.criticidad_maxima ?? "-"}</span></div>
              <div><strong>Puede restaurarse</strong><span>{String(cfgBackupPreview.resumen?.puede_restaurarse ?? false)}</span></div>
            </div>
            <div className="warning-box">Esta previsualización no modifica la configuración productiva.</div>
            <div className="diff-table">
              {(cfgBackupPreview.diff_preview || []).filter((d) => d.estado !== "igual").slice(0, 50).map((d, idx) => (
                <div key={`${d.campo}-${idx}`} className="diff-row">
                  <span>{d.campo}</span>
                  <span>{d.estado}</span>
                  <span>{d.criticidad}</span>
                </div>
              ))}
            </div>
          </>
        ) : null}
        {cfgBackupSimulation ? (
          <>
            <div className="detail-list">
              <div><strong>Precio actual (total urgencia)</strong><span>{formatMoney(cfgBackupSimulation.resultado_config_final?.total_con_urgencia)}</span></div>
              <div><strong>Precio backup (total urgencia)</strong><span>{formatMoney(cfgBackupSimulation.resultado_backup?.total_con_urgencia)}</span></div>
              <div><strong>Diferencia total</strong><span>{cfgBackupSimulation.diferencia_total_con_urgencia}</span></div>
              <div><strong>Diferencia % total</strong><span>{cfgBackupSimulation.diferencia_porcentual_total}%</span></div>
            </div>
            <div className="warning-box">Esta simulación no restaura el backup.</div>
            <details className="raw-json">
              <summary>Ver trazabilidad comparativa</summary>
              <pre>{JSON.stringify(cfgBackupSimulation.trazabilidad_comparativa || {}, null, 2)}</pre>
            </details>
          </>
        ) : null}

        <h4 className="subhead">Cambios pendientes</h4>
        <div className="diff-table">
          {(cfgDiff || []).filter((d) => d.estado !== "igual").slice(0, 50).map((d, idx) => (
            <div key={`${d.campo}-${idx}`} className="diff-row">
              <span>{d.campo}</span>
              <span>{d.estado}</span>
              <span>{d.criticidad}</span>
            </div>
          ))}
        </div>

        <div className="config-grid">
          <label><span>Dólar anterior Excel</span><input type="number" value={cfg.dolar_anterior_excel} onChange={(e) => updateCfgField("dolar_anterior_excel", Number(e.target.value))} /><button type="button" className="secondary-btn" onClick={() => saveCfgField("dolar_anterior_excel", cfg.dolar_anterior_excel)}>Guardar</button></label>
          <label><span>Dólar actual</span><input type="number" value={cfg.dolar_actual} onChange={(e) => updateCfgField("dolar_actual", Number(e.target.value))} /><button type="button" className="secondary-btn" onClick={() => saveCfgField("dolar_actual", cfg.dolar_actual)}>Guardar</button></label>
          <label><span>Factor XA3</span><input type="number" step="0.0001" value={cfg.factor_xa3} onChange={(e) => updateCfgField("factor_xa3", Number(e.target.value))} /><button type="button" className="secondary-btn" onClick={() => saveCfgField("factor_xa3", cfg.factor_xa3)}>Guardar</button></label>
          <label><span>Recargo express</span><input type="number" step="0.01" value={cfg.recargos_urgencia?.express ?? 0} onChange={(e) => updateCfgField("recargos_urgencia.express", Number(e.target.value))} /><button type="button" className="secondary-btn" onClick={() => saveCfgField("recargos_urgencia.express", cfg.recargos_urgencia?.express ?? 0)}>Guardar</button></label>
          <label><span>Factor XL ByN liviano|1/0</span><input type="number" step="0.0001" value={cfg.regla_especial_xl_byn?.factores?.["liviano|1/0"] ?? 0} onChange={(e) => updateCfgField("regla_especial_xl_byn.factores.liviano|1/0", Number(e.target.value))} /><button type="button" className="secondary-btn" onClick={() => saveCfgField("regla_especial_xl_byn.factores.liviano|1/0", cfg.regla_especial_xl_byn?.factores?.["liviano|1/0"] ?? 0)}>Guardar</button></label>
          <label><span>Factor XL global (editable)</span><input type="number" step="0.0001" value={cfg.factores_xl_a4?.xl_global ?? 1} onChange={(e) => updateCfgField("factores_xl_a4.xl_global", Number(e.target.value))} /><button type="button" className="secondary-btn" onClick={() => saveCfgField("factores_xl_a4.xl_global", cfg.factores_xl_a4?.xl_global ?? 1)}>Guardar</button></label>
        </div>

        <h4 className="subhead">Escalas de cantidad</h4>
        <div className="scales-table">
          {(cfg.escalas_cantidad || []).map((row, idx) => (
            <div key={`${row.etiqueta}-${idx}`} className="scale-row">
              <input type="number" value={row.desde} onChange={(e) => {
                const next = [...cfg.escalas_cantidad];
                next[idx] = { ...next[idx], desde: Number(e.target.value) };
                setCfg({ ...cfg, escalas_cantidad: next });
              }} />
              <input type="number" value={row.hasta} onChange={(e) => {
                const next = [...cfg.escalas_cantidad];
                next[idx] = { ...next[idx], hasta: Number(e.target.value) };
                setCfg({ ...cfg, escalas_cantidad: next });
              }} />
              <input value={row.etiqueta} onChange={(e) => {
                const next = [...cfg.escalas_cantidad];
                next[idx] = { ...next[idx], etiqueta: e.target.value };
                setCfg({ ...cfg, escalas_cantidad: next });
              }} />
              <input type="checkbox" checked={Boolean(row.activa)} onChange={(e) => {
                const next = [...cfg.escalas_cantidad];
                next[idx] = { ...next[idx], activa: e.target.checked };
                setCfg({ ...cfg, escalas_cantidad: next });
              }} />
              <input type="number" value={row.orden} onChange={(e) => {
                const next = [...cfg.escalas_cantidad];
                next[idx] = { ...next[idx], orden: Number(e.target.value) };
                setCfg({ ...cfg, escalas_cantidad: next });
              }} />
            </div>
          ))}
        </div>
        <div className="actions-row">
          <button type="button" className="calculate-btn" data-testid="config-save-scales-button" onClick={saveScales}>Guardar cambios</button>
          <button type="button" className="secondary-btn" onClick={restoreCfg}>Restaurar desde config final</button>
        </div>

        <div className="actions-row">
          <button type="button" className="secondary-btn" onClick={runValidateConfig}>Validar configuración</button>
          <button type="button" className="secondary-btn" onClick={runSimulation}>Simular con configuración editable</button>
        </div>

        {cfgValidation ? (
          <div className="detail-list">
            <div><strong>Valid</strong><span>{String(cfgValidation.valid)}</span></div>
            <div><strong>Errores</strong><span>{(cfgValidation.errors || []).length}</span></div>
            <div><strong>Warnings</strong><span>{(cfgValidation.warnings || []).length}</span></div>
          </div>
        ) : null}

        {cfgSimulation ? (
          <div className="detail-list">
            <div><strong>Total final (config final)</strong><span>{formatMoney(cfgSimulation?.precio_config_final?.total_con_urgencia)}</span></div>
            <div><strong>Total final (config editable)</strong><span>{formatMoney(cfgSimulation?.precio_config_editable?.total_con_urgencia)}</span></div>
            <div><strong>Diferencia absoluta</strong><span>{cfgSimulation?.diferencia_absoluta}</span></div>
            <div><strong>Diferencia porcentual</strong><span>{cfgSimulation?.diferencia_porcentual}%</span></div>
          </div>
        ) : null}

        <h4 className="subhead">Historial</h4>
        <div className="history-list">
          {cfgHistory.slice().reverse().slice(0, 20).map((h, idx) => (
            <div key={`${h.fecha}-${idx}`}><strong>{h.campo}</strong> · v{h.version} · {h.motivo}</div>
          ))}
        </div>
      </section>
    );
  };

  const renderVariableImpactTab = () => (
    <ImpactoCambiosPanel
      isSimpleMode={isSimpleMode}
      isAdvancedMode={isAdvancedMode}
      impactData={impactData}
      impactError={impactError}
      impactLoading={impactLoading}
      impactMode={impactMode}
      setImpactMode={setImpactMode}
      impactVariable={impactVariable}
      setImpactVariable={setImpactVariable}
      impactProduct={impactProduct}
      setImpactProduct={setImpactProduct}
    />
  );
  const renderAdminPricesTab = () => {
    const variables = adminPrices?.variables || [];
    const selected = variables.find((item) => item.key === adminVariable);
    const numericValue = Number(adminNewValue);
    const currentValue = Number(selected?.value);
    const previewMatches = adminPreview && adminPreview.variable === adminVariable && Number(adminPreview.nuevo_valor) === numericValue;
    const productosAfectados = selected?.productos_afectados || [];
    const minValue = selected?.min ?? 0;
    const maxValue = selected?.max;
    const valueValidation = (() => {
      if (!selected) return "Eleg? una variable para continuar.";
      if (String(adminNewValue).trim() === "") return "Ingres? un nuevo valor.";
      if (!Number.isFinite(numericValue)) return "El valor debe ser num?rico.";
      if (Number.isFinite(Number(minValue)) && numericValue < Number(minValue)) return `El valor no puede ser menor que ${minValue}.`;
      if (maxValue != null && Number.isFinite(Number(maxValue)) && numericValue > Number(maxValue)) return `El valor no puede ser mayor que ${maxValue}.`;
      if (Number.isFinite(currentValue) && numericValue === currentValue) return "El nuevo valor debe ser distinto del valor actual.";
      return "";
    })();
    const canPreviewAdmin = !valueValidation && !adminLoading;
    const canConfirmAdmin = Boolean(previewMatches) && !adminLoading;
    const deltaValue = Number.isFinite(numericValue) && Number.isFinite(currentValue) ? numericValue - currentValue : null;
    const deltaPercent = deltaValue != null && currentValue !== 0 ? (deltaValue / currentValue) * 100 : null;
    const goToAdminStep = (step) => setAdminWizardStep(Math.max(1, Math.min(6, step)));
    const selectAdminVariable = (item) => {
      setAdminVariable(item.key);
      setAdminNewValue(String(item.value));
      setAdminPreview(null);
      setAdminMsg("");
      setAdminError("");
      setAdminWizardStep(2);
    };
    const previewImpacts = adminPreview?.impactos || [];
    const previewExamples = adminPreview?.precios_ejemplo || [];

    const renderAdminStepper = () => (
      <div className="admin-wizard-stepper" data-testid="admin-wizard-stepper">
        {ADMIN_PRICE_STEPS.map((step) => {
          const isActive = adminWizardStep === step.id;
          const isDone = adminWizardStep > step.id;
          return (
            <button
              type="button"
              key={step.id}
              className={isActive ? "admin-step active" : isDone ? "admin-step done" : "admin-step"}
              onClick={() => goToAdminStep(step.id)}
              data-testid={`admin-step-${step.id}`}
            >
              <span>{step.id}</span>
              <strong>{step.label}</strong>
            </button>
          );
        })}
      </div>
    );

    const renderStepActions = ({ back, next, nextDisabled = false, nextLabel = "Continuar" } = {}) => (
      <div className="admin-wizard-actions">
        {back ? <button type="button" className="secondary-btn" onClick={() => goToAdminStep(back)}>Volver</button> : null}
        {next ? <button type="button" className="calculate-btn compact-calculate-btn" disabled={nextDisabled} onClick={() => goToAdminStep(next)}>{nextLabel}</button> : null}
      </div>
    );

    const renderVariableList = () => (
      <div className="admin-wizard-panel" data-testid="admin-variable-list">
        <div className="admin-wizard-panel-head">
          <span>Paso 1</span>
          <h4>Eleg? qu? variable quer?s modificar</h4>
          <p>
            {isSimpleMode
              ? "Solo aparecen variables habilitadas para edición segura. Los detalles técnicos están disponibles en modo avanzado."
              : "Solo aparecen variables habilitadas para edici?n segura desde el sistema."}
          </p>
        </div>
        <div className="admin-variable-list wizard-list">
          {variables.map((item) => (
            <button
              type="button"
              key={item.key}
              className={adminVariable === item.key ? "admin-variable-item active" : "admin-variable-item"}
              onClick={() => selectAdminVariable(item)}
              data-testid={`admin-variable-${item.key}`}
            >
              <strong>{item.label}</strong>
              {isAdvancedMode ? <span>{item.key}</span> : null}
              <small>{item.description}</small>
              <div className="admin-variable-meta">
                <em>{item.value} {item.unit || ""}</em>
                {isSimpleMode ? <em>{(item.productos_afectados || []).length} productos</em> : null}
                {isAdvancedMode ? <em>{item.impacta_hoy ? "Impacta hoy" : "Preparada"}</em> : null}
                {isAdvancedMode ? <em>{item.editable ? "Editable" : "Solo lectura"}</em> : null}
              </div>
            </button>
          ))}
        </div>
      </div>
    );

    const renderImpactStep = () => (
      <div className="admin-wizard-panel" data-testid="admin-impact-step">
        <div className="admin-wizard-panel-head">
          <span>Paso 2</span>
          <h4>Revis? el impacto actual</h4>
          <p>{isSimpleMode ? "Antes de cambiar un número, revisá qué productos se podrían afectar." : "Antes de cambiar un n?mero, mir? d?nde interviene esta variable y qu? partes est?n protegidas por tabla fija PDF."}</p>
        </div>
        <div className="admin-editor-head">
          <div>
            <span>Variable seleccionada</span>
            <strong>{selected?.label || adminVariable}</strong>
            {isAdvancedMode ? <small>Clave técnica: {selected?.key || adminVariable}</small> : null}
          </div>
          {isAdvancedMode ? <em>{selected?.impacta_hoy ? "Impacta hoy" : "Preparada"}</em> : null}
        </div>
        <div className="admin-current-grid">
          <div><span>Valor actual</span><strong>{selected?.value ?? "-"}</strong></div>
          <div><span>Unidad</span><strong>{selected?.unit || "-"}</strong></div>
          {isSimpleMode ? <div><span>Productos afectados</span><strong>{productosAfectados.length}</strong></div> : null}
          {isAdvancedMode ? <div><span>Estado editable</span><strong>{selected?.editable ? "Editable en sistema" : "No editable"}</strong></div> : null}
          {isAdvancedMode ? <div><span>Estado operativo</span><strong>{selected?.estado || selected?.estado_operativo || "-"}</strong></div> : null}
        </div>
        <h4>Productos afectados</h4>
        {productosAfectados.length ? (
          <div className="admin-impact-chips" data-testid="admin-products-affected">
            {productosAfectados.map((product) => <span key={product}>{product}</span>)}
          </div>
        ) : <p className="range-hint">No hay productos afectados informados para esta variable.</p>}
        <div className="warning-box">
          {isSimpleMode
            ? "Los precios finales protegidos no se editan directamente. El preview avisa antes de guardar."
            : "Los precios finales fijos PDF y factores calibrados no se editan directamente desde ac?. Si una tabla est? protegida, el preview lo informa antes de guardar."}
        </div>
        {renderStepActions({ back: 1, next: 3 })}
      </div>
    );

    const renderValueStep = () => (
      <div className="admin-wizard-panel" data-testid="admin-new-value-step">
        <div className="admin-wizard-panel-head">
          <span>Paso 3</span>
          <h4>Ingres? el nuevo valor</h4>
          <p>El sistema valida que sea num?rico, permitido, distinto al valor actual y dentro de rango.</p>
        </div>
        <div className="admin-current-grid">
          <div><span>Valor actual</span><strong>{selected?.value ?? "-"}</strong></div>
          <div><span>Nuevo valor</span><strong>{adminNewValue || "-"}</strong></div>
          <div><span>Diferencia estimada</span><strong>{deltaValue == null ? "-" : deltaValue.toFixed(4)}</strong></div>
          <div><span>Diferencia %</span><strong>{deltaPercent == null ? "-" : `${deltaPercent.toFixed(2)}%`}</strong></div>
        </div>
        <label className="admin-new-value">
          <span>Nuevo valor para {selected?.label || adminVariable}</span>
          <input
            type="number"
            data-testid="admin-new-value-input"
            value={adminNewValue}
            placeholder={selected ? String(selected.value) : ""}
            min={selected?.min}
            max={selected?.max}
            step={selected?.step || "0.01"}
            onChange={(event) => {
              setAdminNewValue(event.target.value);
              setAdminPreview(null);
              setAdminMsg("");
              setAdminError("");
            }}
          />
        </label>
        {valueValidation ? <div className="error-box" data-testid="admin-value-validation">{valueValidation}</div> : <div className="info-box">Valor v?lido para previsualizar.</div>}
        {renderStepActions({ back: 2, next: 4, nextDisabled: Boolean(valueValidation) })}
      </div>
    );

    const renderPreviewStep = () => (
      <div className="admin-wizard-panel" data-testid="admin-preview-step">
        <div className="admin-wizard-panel-head">
          <span>Paso 4</span>
          <h4>Previsualiz? el impacto</h4>
          <p>El preview no guarda cambios. Sirve para revisar diferencias, advertencias y productos afectados.</p>
        </div>
        <div className="principal-actions">
          <button
            type="button"
            className="secondary-btn"
            data-testid="admin-preview-button"
            onClick={handleAdminPreview}
            disabled={!canPreviewAdmin}
          >
            Previsualizar impacto
          </button>
          <button type="button" className="secondary-btn" onClick={() => goToAdminStep(3)}>Volver a editar valor</button>
        </div>
        {valueValidation ? <div className="error-box">{valueValidation}</div> : null}
        {adminPreview ? renderPreviewPanel() : <div className="placeholder"><p>Gener? un preview para habilitar la confirmaci?n.</p></div>}
      </div>
    );

    const renderPreviewPanel = () => (
      <div className="admin-preview-panel" data-testid="admin-preview-panel">
        <h4>Preview de impacto</h4>
        <div className="admin-current-grid">
          <div><span>Actual</span><strong>{adminPreview.valor_actual}</strong></div>
          <div><span>Nuevo</span><strong>{adminPreview.nuevo_valor}</strong></div>
          <div><span>Diferencia</span><strong>{adminPreview.diferencia}</strong></div>
          <div><span>Diferencia %</span><strong>{adminPreview.diferencia_porcentual == null ? "-" : `${adminPreview.diferencia_porcentual.toFixed(2)}%`}</strong></div>
        </div>
        {adminPreview.advertencias?.length ? <div className="warning-box">{adminPreview.advertencias.join(" ? ")}</div> : null}
        <h4>Productos afectados</h4>
        <div className="impact-results">
          {previewImpacts.map((impact) => (
            <article className={`impact-relation-card ${impact.estado === "bloqueado" ? "bloqueado" : impact.impacta_hoy ? "variable_madre" : "preparada"}`} key={`${impact.variable}-${impact.producto_key}-${impact.componente}`}>
              <div className="impact-relation-head">
                <div>
                  <strong>{impact.producto}</strong>
                  <span>{isAdvancedMode ? impact.componente : "Producto afectado"}</span>
                </div>
                <em>{impact.impacta_hoy ? "Impacta hoy" : "Documentado"}</em>
              </div>
              <p>{impact.detalle}</p>
              {isAdvancedMode ? <small>Fuente: {impact.fuente}</small> : null}
            </article>
          ))}
        </div>
        {previewExamples.length ? (
          <>
            <h4>Precios de ejemplo</h4>
            <div className="admin-example-grid">
              {previewExamples.map((example) => (
                <article key={example.nombre}>
                  <strong>{example.nombre}</strong>
                  <span>Antes: {example.antes == null ? "-" : formatMoney(example.antes)}</span>
                  <span>Despu?s: {example.despues == null ? "-" : formatMoney(example.despues)}</span>
                  <small>{example.detalle}</small>
                </article>
              ))}
            </div>
          </>
        ) : null}
      </div>
    );

    const renderConfirmStep = () => (
      <div className="admin-wizard-panel" data-testid="admin-confirm-step">
        <div className="admin-wizard-panel-head">
          <span>Paso 5</span>
          <h4>Confirm? y guard?</h4>
          <p>Este cambio modifica una variable operativa. Revis? el impacto antes de guardar.</p>
        </div>
        <div className="warning-box" data-testid="admin-confirmation-copy">
          Vas a cambiar {selected?.label || adminVariable} de {selected?.value ?? adminPreview?.valor_actual ?? "-"} a {adminNewValue}. Se crear? backup e historial. ?Confirm?s?
        </div>
        {adminPreview ? renderPreviewPanel() : <div className="placeholder"><p>Primero gener? un preview v?lido para este valor.</p></div>}
        <div className="principal-actions">
          <button type="button" className="secondary-btn" onClick={() => goToAdminStep(4)}>Volver al preview</button>
          <button
            type="button"
            className="calculate-btn compact-calculate-btn"
            data-testid="admin-apply-button"
            onClick={handleAdminApply}
            disabled={!canConfirmAdmin}
          >
            Guardar cambio
          </button>
        </div>
      </div>
    );

    const renderHistoryStep = () => (
      <section className="admin-wizard-panel admin-history" data-testid="admin-history">
        <div className="admin-wizard-panel-head">
          <span>Paso 6</span>
          <h4>Historial reciente y backups</h4>
          <p>Registro de cambios aplicados desde el sistema. Podés previsualizar y restaurar una variable editable con backup automático.</p>
        </div>
        {renderAdminHistoryEntries({ limit: 10 })}
        {renderRollbackPreviewPanel()}
        {renderStepActions({ back: 5 })}
      </section>
    );

    return (
      <ModificarPreciosWizard
        adminError={adminError}
        adminMsg={adminMsg}
        adminLoading={adminLoading}
        adminPrices={adminPrices}
        renderAdminStepper={renderAdminStepper}
        adminWizardStep={adminWizardStep}
        renderVariableList={renderVariableList}
        renderImpactStep={renderImpactStep}
        renderValueStep={renderValueStep}
        renderPreviewStep={renderPreviewStep}
        renderConfirmStep={renderConfirmStep}
        renderHistoryStep={renderHistoryStep}
      />
    );
  };
  const renderPrincipalVariablesTab = () => {
    const groups = [
      ["tipo_cambio", "Variables madre editables - Tipo de cambio"],
      ["clicks", "Variables madre editables - Clicks"],
      ["papeles", "Papeles base en USD"],
      ["multiplicadores", "Variables madre editables - Multiplicadores"],
      ["adicionales", "Variables madre editables - Adicionales puntuales"],
    ];
    if (!principalVariables) {
      return <section className="card result-card"><div className="placeholder"><p>Cargando variables principales...</p></div></section>;
    }
    const renderPrincipalVariable = (item) => (
      <label className="principal-variable" key={item.key}>
        <span className="principal-variable-title">{item.label}</span>
        <span className="principal-badge">{item.tipo === "variable_madre" ? "Variable madre editable" : item.tipo}</span>
        <div className="principal-input-row">
          <input
            type="number"
            min={item.min}
            max={item.max}
            step={item.step}
            value={principalDraft[item.key] ?? ""}
            data-testid={`principal-variable-${item.key}`}
            onChange={(event) => setPrincipalDraft((prev) => ({ ...prev, [item.key]: event.target.value }))}
          />
          <strong>{item.unit}</strong>
        </div>
        <small>{item.description}</small>
        <small>Confiabilidad: {item.confiabilidad || "alta"}</small>
        <small>{item.impacta_hoy ? `Impacta hoy: ${item.impact}` : `Preparada, no impacta todavía: ${item.impact}`}</small>
        {(item.productos_afectados || []).length ? <small>Productos afectados: {item.productos_afectados.join(", ")}</small> : null}
        <button
          type="button"
          className="impact-link-btn"
          onClick={() => {
            setImpactMode("variable");
            setImpactVariable(item.key);
            setActiveTab("Ver impacto de cambios");
          }}
        >
          Ver impacto
        </button>
      </label>
    );
    const renderPrincipalGroupSet = (title, hint, predicate, testId) => (
      <section className="principal-group" data-testid={testId}>
        <h4>{title}</h4>
        <p className="range-hint">{hint}</p>
        <div className="principal-groups">
          {groups.map(([groupKey, label]) => {
            const items = (principalVariables[groupKey] || []).filter(predicate);
            return (
              <section className="principal-group" key={`${testId}-${groupKey}`} data-testid={`principal-group-${testId}-${groupKey}`}>
                <h4>{label}</h4>
                {items.length ? <div className="principal-grid">{items.map(renderPrincipalVariable)}</div> : <p className="range-hint">Sin variables en este grupo.</p>}
              </section>
            );
          })}
        </div>
      </section>
    );
    const previewSummary = excelImportPreview?.resumen || {};
    const previewChanges = excelImportPreview?.cambios || [];
    const previewBlocked = excelImportPreview?.bloqueados || [];
    const previewWarnings = excelImportPreview?.advertencias || [];
    const previewErrors = excelImportPreview?.errores || [];
    return (
      <section className="card result-card principal-variables-card">
        <div className="card-head">
          <div>
            <h3 data-testid="principal-variables-title">Variables principales</h3>
            <p>Solo se editan variables madre: tipo de cambio, click, costos base y adicionales puntuales. Las tablas PDF, rangos y precios finales son fijos o derivados.</p>
          </div>
          <span>{Object.values(principalDraft).length} variables madre</span>
        </div>
        <div className="warning-box">
          Los precios finales de las tablas no se editan manualmente. Solo se editan costos base, click y tipo de cambio; los productos en modo PDF fijo mantienen sus precios publicados.
        </div>
        {principalMsg ? <div className="info-box" data-testid="principal-variables-message">{principalMsg}</div> : null}
        <div className="principal-actions">
          <button type="button" className="calculate-btn compact-calculate-btn" data-testid="principal-save-button" onClick={savePrincipalVariables}>Guardar cambios</button>
          <button type="button" className="secondary-btn" onClick={loadPrincipalVariables}>Recargar valores</button>
          <button type="button" className="secondary-btn" data-testid="export-prices-pdf" onClick={downloadPricesPdf}>Exportar tablas PDF</button>
          <button type="button" className="secondary-btn" data-testid="export-prices-excel" onClick={downloadPricesExcel}>Exportar Excel maestro</button>
        </div>
        <section className="principal-group" data-testid="excel-import-preview-section">
          <h4>Importar Excel maestro</h4>
          <p className="range-hint">Modo actual: solo preview. Se leen únicamente variables operativas de 01_VARIABLES_MADRE y no se aplican cambios.</p>
          <div className="principal-actions">
            <input
              type="file"
              accept=".xlsx"
              data-testid="excel-import-file"
              onChange={(event) => {
                setExcelImportFile(event.target.files?.[0] || null);
                setExcelImportPreview(null);
                setExcelImportError("");
              }}
            />
            <button
              type="button"
              className="secondary-btn"
              data-testid="excel-import-preview-button"
              onClick={previewExcelImport}
              disabled={excelImportLoading}
            >
              {excelImportLoading ? "Previsualizando..." : "Previsualizar cambios"}
            </button>
            <button type="button" className="secondary-btn" data-testid="excel-import-apply-disabled" disabled>
              Aplicación de cambios disponible en próxima etapa.
            </button>
          </div>
          {excelImportError ? <div className="error-box" data-testid="excel-import-error">{excelImportError}</div> : null}
          {excelImportPreview ? (
            <>
              <div className="info-box" data-testid="excel-import-summary">
                Archivo: {excelImportPreview.archivo || "-"} · Cambios importables: {previewSummary.cambios_importables ?? 0} · Bloqueados: {previewSummary.cambios_bloqueados ?? 0} · Sin cambios: {previewSummary.sin_cambios ?? 0}
              </div>
              <div className="ranges-control-grid">
                <section>
                  <h4>Cambios importables</h4>
                  <div className="diff-table" data-testid="excel-import-changes">
                    {previewChanges.length ? previewChanges.map((item) => (
                      <div key={item.key} className="diff-row">
                        <span>{item.key}</span>
                        <span>{item.valor_actual} → {item.valor_excel}</span>
                        <span>{item.estado}</span>
                      </div>
                    )) : <p className="range-hint">Sin cambios importables.</p>}
                  </div>
                </section>
                <section>
                  <h4>Cambios bloqueados</h4>
                  <div className="diff-table" data-testid="excel-import-blocked">
                    {previewBlocked.length ? previewBlocked.map((item, index) => (
                      <div key={`${item.key}-${index}`} className="diff-row">
                        <span>{item.key}</span>
                        <span>{item.valor_excel ?? "-"}</span>
                        <span>{item.motivo}</span>
                      </div>
                    )) : <p className="range-hint">Sin cambios bloqueados.</p>}
                  </div>
                </section>
              </div>
              {previewWarnings.length ? <div className="warning-box" data-testid="excel-import-warnings">Advertencias: {previewWarnings.join(" · ")}</div> : null}
              {previewErrors.length ? <div className="error-box" data-testid="excel-import-errors">Errores: {previewErrors.join(" · ")}</div> : null}
            </>
          ) : null}
        </section>
        {renderPrincipalGroupSet(
          "Variables madre que impactan hoy",
          "Cambian trazabilidad o cálculo actual donde el producto ya usa fórmula editable.",
          (item) => item.impacta_hoy,
          "principal-impact-today"
        )}
        {renderPrincipalGroupSet(
          "Variables madre preparadas, no impactan todavía",
          "Valores base confiables encontrados en Excel histórico. Se pueden preparar, pero aún no recalculan productos PDF fijos.",
          (item) => !item.impacta_hoy,
          "principal-prepared"
        )}
        <section className="principal-group" data-testid="principal-detected-papers">
          <h4>Papeles detectados y estado comercial</h4>
          <p className="range-hint">Este papel aparece en las tablas, pero solo se edita si tenemos su costo base en dólares. Los demás quedan como detectados sin costo base o tabla fija PDF.</p>
          <div className="paper-family-grid">
            {Object.entries(principalVariables.papeles_detectados || {}).map(([family, papers]) => (
              <article className="paper-family" key={family}>
                <strong>{family}</strong>
                <ul>{papers.map((paper) => (
                  <li key={paper.key}>
                    {paper.label}
                    <span>{paper.tipo === "variable_madre" ? "Variable madre editable" : "Detectado sin costo base"}</span>
                  </li>
                ))}</ul>
              </article>
            ))}
          </div>
        </section>
        <section className="principal-group" data-testid="principal-derived-fixed">
          <h4>Valores derivados y tablas PDF fijas</h4>
          <p className="range-hint">Estos valores no se editan directamente. Se recalculan desde variables madre cuando el producto usa fórmula variable, o permanecen fijos si provienen del PDF.</p>
          <div className="ranges-control-grid">
            {[...(principalVariables.valores_derivados || []), ...(principalVariables.tablas_fijas_pdf || [])].map((item) => (
              <article className="range-control-card" key={item.key}>
                <strong>{item.label}</strong>
                <div><span>{item.tipo === "tabla_fija_pdf" ? "Tabla fija PDF" : "Derivado"}</span><span>No editable</span></div>
                <small>{item.motivo_no_editable}</small>
              </article>
            ))}
          </div>
        </section>
        <section className="principal-group" data-testid="principal-ranges">
          <h4>Rangos fijos de matrices</h4>
          <p className="range-hint">{principalRanges?.warning || "Los rangos se muestran para control. No son editables en esta etapa."}</p>
          <div className="ranges-control-grid">
            {(principalRanges?.rangos || []).map((entry) => (
              <article className="range-control-card" key={entry.grupo}>
                <strong>{entry.grupo}</strong>
                <div>{entry.rangos.map((range) => <span key={range}>{range}</span>)}</div>
                <small>{entry.tipo === "rango_fijo" ? "Rango fijo · No editable" : "No editable"} · {entry.motivo || "Matriz cerrada"}</small>
                <small>Fuente: {entry.fuente}</small>
              </article>
            ))}
          </div>
        </section>
        <div className="info-box">El PDF exportado muestra tablas finales vigentes. No implica que esas tablas sean editables.</div>
        <details className="raw-json">
          <summary>Ver auditoría</summary>
          <div className="warning-box">No encontradas: {(principalAudit?.variables_no_encontradas || []).join(", ") || "-"}</div>
          <pre>{JSON.stringify(principalAudit, null, 2)}</pre>
        </details>
      </section>
    );
  };

  const renderCotizador = () => (
    <div className="cotizador-layout" data-testid="cotizador-layout">
      <form className="card form-card compact-card" onSubmit={handleSubmit}>
        <div className="card-head"><h3>1. Configura tu impresión</h3><span>Enter = calcular</span></div>
        <div className="form-grid compact-grid">
          <label><span>Categoría</span><select data-testid="categoria-select" value={form.categoria_ui} onChange={updateField("categoria_ui")}>{CATEGORIAS.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
          {!isAutoadhesivas && !isTarjetas && !isPostales && !isFolletos && !isCarpetas && !isSobres && !isStickers && !isImanes && !isStickersCirculares && !isTarjetasTroqCirc && !isPlanchaIman && !isAgendasCuadernos ? (
            <>
              <label><span>Impresión</span><div className="caras-row">{CARAS.map((cara) => <button key={cara} data-testid={`print-option-${cara.replace("/", "-")}`} type="button" className={form.caras === cara ? "pill active" : "pill"} onClick={() => setForm((prev) => ({ ...prev, caras: cara }))}>{cara}</button>)}</div></label>
              <label><span>Categoría (automática)</span><input value={inferred.categoria} readOnly /></label>
              <label><span>Medida / formato</span><select data-testid="formato-select" value={form.formato} onChange={updateField("formato")}>{effectiveFormatoOptions.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
              <label><span>Tipo de papel</span><select value={form.tipo_papel} onChange={updateField("tipo_papel")} disabled={isKraft}>{(isKraft ? [KRAFT_TIPO_PAPEL] : tipoPapelOptions).map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
              <label><span>Material</span><select value={form.material} onChange={updateField("material")} disabled={isKraft}>{(isKraft ? [KRAFT_MATERIAL] : materialOptions).map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
              <label><span>Gramaje</span><select value={form.gramaje} onChange={updateField("gramaje")}>{(isKraft ? KRAFT_GRAMAJES : gramajeOptions).map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
            </>
          ) : isAutoadhesivas ? (
            <>
              <label><span>Medida / formato</span><select data-testid="formato-select" value={form.formato} onChange={updateField("formato")}>{AUTOADH_FORMATOS.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
              <label><span>Tipo</span><select data-testid="autoadh-tipo-select" value={form.columna_precio} onChange={updateField("columna_precio")}>{AUTOADH_COLUMNAS.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
              <label><span>Modo color</span><input value="fullcolor" readOnly /></label>
              <label><span>Impresión</span><input value="4/0" readOnly /></label>
            </>
          ) : isTarjetas ? (
            <>
              <label><span>Producto</span><input value="Tarjetas Personales 9x5" readOnly /></label>
              <label><span>Medida / formato</span><select data-testid="formato-select" value={form.formato} onChange={updateField("formato")}>{TARJETAS_FORMATOS.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
              <label><span>Papel</span><input value={`${form.gramaje_tarjetas} Ilustracion`} readOnly /></label>
              <label><span>Gramaje</span><select value={form.gramaje_tarjetas} onChange={updateField("gramaje_tarjetas")}>{TARJETAS_GRAMAJES.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
              <label><span>Impresión</span><div className="caras-row">{TARJETAS_CARAS.map((cara) => <button key={cara} data-testid={`print-option-${cara.replace("/", "-")}`} type="button" className={form.caras === cara ? "pill active" : "pill"} onClick={() => setForm((prev) => ({ ...prev, caras: cara }))}>{cara}</button>)}</div></label>
              <label><span>Terminación</span><select value={form.terminacion_tarjetas} onChange={updateField("terminacion_tarjetas")}>{TARJETAS_TERMINACIONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></label>
              <label><span>Nota</span><input value={form.gramaje_tarjetas === "350g" ? "350g: +10% sobre 300g" : "300g base PDF"} readOnly /></label>
            </>
          ) : isPostales ? (
            <>
              <label><span>Producto</span><input value="Tarjetas Postales" readOnly /></label>
              <label><span>Formato</span><select data-testid="formato-select" value={form.formato} onChange={updateField("formato")}>{POSTALES_FORMATOS.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
              <label><span>Papel</span><input value={`${form.gramaje_tarjetas} Ilustracion`} readOnly /></label>
              <label><span>Gramaje</span><select value={form.gramaje_tarjetas} onChange={updateField("gramaje_tarjetas")}>{POSTALES_GRAMAJES.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
              <label><span>Impresión</span><div className="caras-row">{POSTALES_CARAS.map((cara) => <button key={cara} data-testid={`print-option-${cara.replace("/", "-")}`} type="button" className={form.caras === cara ? "pill active" : "pill"} onClick={() => setForm((prev) => ({ ...prev, caras: cara }))}>{cara}</button>)}</div></label>
              <label><span>Terminación</span><select value={form.terminacion_tarjetas} onChange={updateField("terminacion_tarjetas")}>{POSTALES_TERMINACIONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></label>
              <label><span>Nota</span><input value={form.gramaje_tarjetas === "350g" ? "350g: +10% sobre 300g" : "300g base PDF"} readOnly /></label>
            </>
          ) : isFolletos ? (
            <>
              <label><span>Producto</span><input value="Folletos" readOnly /></label>
              <label><span>Formato</span><select data-testid="formato-select" value={form.formato} onChange={updateField("formato")}>{FOLLETOS_FORMATOS.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
              <label><span>Papel</span><select value={form.papel_folleto} onChange={updateField("papel_folleto")}>{FOLLETOS_PAPELES.map((p) => <option key={p.papel} value={p.papel}>{p.papel}</option>)}</select></label>
              <label><span>Modo color</span><select value={form.modo_color_folleto} onChange={updateField("modo_color_folleto")}>{FOLLETOS_MODO_COLOR.map((m) => <option key={m} value={m}>{m}</option>)}</select></label>
              <label><span>Impresión</span><div className="caras-row">{(form.modo_color_folleto === "fullcolor" ? ["4/0", "4/4"] : ["1/0", "1/1"]).map((cara) => <button key={cara} data-testid={`print-option-${cara.replace("/", "-")}`} type="button" className={form.caras === cara ? "pill active" : "pill"} onClick={() => setForm((prev) => ({ ...prev, caras: cara }))}>{cara}</button>)}</div></label>
              <label><span>Gramaje</span><input value={FOLLETOS_PAPELES.find((p) => p.papel === form.papel_folleto)?.gramaje || "-"} readOnly /></label>
            </>
          ) : isCarpetas ? (
            <>
              <label><span>Producto</span><input value="Carpetas A4" readOnly /></label>
              <label><span>Formato</span><select data-testid="formato-select" value={form.formato} onChange={updateField("formato")}>{CARPETAS_FORMATOS.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
              <label><span>Papel</span><input value={CARPETAS_PAPEL} readOnly /></label>
              <label><span>Gramaje</span><input value={CARPETAS_GRAMAJE} readOnly /></label>
              <label><span>Impresión</span><div className="caras-row">{CARPETAS_CARAS.map((cara) => <button key={cara} data-testid={`print-option-${cara.replace("/", "-")}`} type="button" className={form.caras === cara ? "pill active" : "pill"} onClick={() => setForm((prev) => ({ ...prev, caras: cara }))}>{cara}</button>)}</div></label>
              <label><span>Terminación</span><select value={form.terminacion_carpetas} onChange={updateField("terminacion_carpetas")}>{CARPETAS_TERMINACIONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></label>
              <label><span>Solapa</span><div className="caras-row"><button type="button" className={form.solapa_impresa ? "pill active" : "pill"} onClick={() => setForm((prev) => ({ ...prev, solapa_impresa: !prev.solapa_impresa }))}>{form.solapa_impresa ? "Impresa" : "Blanca pegada"}</button></div></label>
            </>
          ) : isSobres ? (
            <>
              <label><span>Producto</span><input value="Sobres" readOnly /></label>
              <label><span>Tipo de sobre</span><select value={form.tipo_sobre} onChange={updateField("tipo_sobre")}>{SOBRES_TIPOS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></label>
              <label><span>Papel</span><input value="63g" readOnly /></label>
              <label><span>Color</span><input value="blanco" readOnly /></label>
              <label><span>Impresión</span><input value="4/0" readOnly /></label>
              <label><span>Formato</span><input value="sobre" readOnly /></label>
            </>
          ) : isStickers ? (
            <>
              <label><span>Producto</span><input value="Stickers Corte Recto" readOnly /></label>
              <label><span>Formato</span><select data-testid="formato-select" value={form.formato} onChange={updateField("formato")}>{STICKERS_FORMATOS.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
              <label><span>Terminación</span><select value={form.terminacion_stickers} onChange={updateField("terminacion_stickers")}>{STICKERS_TERMINACIONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></label>
              <label><span>Impresión</span><input value="4/0" readOnly /></label>
              <label><span>Papel</span><input value="Sticker" readOnly /></label>
              <label><span>Gramaje</span><input value="N/A" readOnly /></label>
            </>
          ) : isImanes ? (
            <>
              <label><span>Producto</span><input value="Imanes Corte Recto" readOnly /></label>
              <label><span>Formato</span><select data-testid="formato-select" value={form.formato} onChange={updateField("formato")}>{IMANES_FORMATOS.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
              <label><span>Terminación</span><select value={form.terminacion_imanes} onChange={updateField("terminacion_imanes")}>{IMANES_TERMINACIONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></label>
              <label><span>Impresión</span><input value="4/0" readOnly /></label>
              <label><span>Papel</span><input value="300g Ilustracion" readOnly /></label>
              <label><span>Gramaje</span><input value="300g" readOnly /></label>
            </>
          ) : isStickersCirculares ? (
            <>
              <label><span>Producto</span><input value="Stickers Circulares" readOnly /></label>
              <label><span>Material</span><select value={form.material_stickers_circulares} onChange={updateField("material_stickers_circulares")}>{STICKERS_CIRCULARES_MATERIALES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</select></label>
              <label><span>Formato / diámetro</span><select data-testid="formato-select" value={form.formato} onChange={updateField("formato")}>{STICKERS_CIRCULARES_FORMATOS.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
              <label><span>Terminación</span><select value={form.terminacion_stickers_circulares} onChange={updateField("terminacion_stickers_circulares")}>{STICKERS_CIRCULARES_TERMINACIONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></label>
              <label><span>Impresión</span><input value="4/0" readOnly /></label>
              <label><span>Papel base</span><input value={STICKERS_CIRCULARES_MATERIALES.find((m) => m.value === form.material_stickers_circulares)?.label || "Papel obra/ilustración 90g"} readOnly /></label>
            </>
          ) : isTarjetasTroqCirc ? (
            <>
              <label><span>Producto</span><input value="Tarjetas Troqueladas Circulares" readOnly /></label>
              <label><span>Formato</span><select data-testid="formato-select" value={form.formato} onChange={updateField("formato")}>{TARJETAS_TROQ_CIRC_FORMATOS.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
              <label><span>Impresión</span><div className="caras-row">{["4/0", "4/4"].map((cara) => <button key={cara} type="button" className={form.caras_tarjetas_troq_circ === cara ? "pill active" : "pill"} onClick={() => setForm((prev) => ({ ...prev, caras_tarjetas_troq_circ: cara }))}>{cara}</button>)}</div></label>
              <label><span>Papel</span><input value="300g Ilustración" readOnly /></label>
              <label>
                <span>Laminado</span>
                <select value={form.adicional_laminado_troq_circ} onChange={updateField("adicional_laminado_troq_circ")}>
                  <option value="sin_adicional">Sin laminado</option>
                  <option value="laminado_brillo">Laminado brillo</option>
                  <option value="laminado_mate">Laminado mate</option>
                </select>
              </label>
              <label>
                <span>Caras laminado</span>
                <select value={form.caras_adicional_troq_circ} onChange={updateField("caras_adicional_troq_circ")} disabled={form.adicional_laminado_troq_circ === "sin_adicional"}>
                  <option value="0">Sin laminado</option>
                  <option value="1">1 cara (+10%)</option>
                  <option value="2">2 caras (+20%)</option>
                </select>
              </label>
            </>
          ) : isPlanchaIman ? (
            <>
              <label><span>Producto</span><input value="Plancha de Imán Impreso" readOnly /></label>
              <label><span>Variante</span><select value={form.variante_plancha_iman} onChange={updateField("variante_plancha_iman")}>{PLANCHA_IMAN_VARIANTES.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}</select></label>
              <label><span>Impresión</span><input value="4/0" readOnly /></label>
              <label><span>Área imprimible</span><input value="30x46 cm" readOnly /></label>
            </>
          ) : isAgendasCuadernos ? (
            <>
              <label><span>Producto</span><select value={form.producto_agendas} onChange={updateField("producto_agendas")}>{AGENDAS_PRODUCTOS.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}</select></label>
              <label><span>Formato</span><select value={form.formato_agendas} onChange={updateField("formato_agendas")}>{AGENDAS_FORMATOS.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
              <label><span>Páginas</span><select value={form.paginas_agendas} onChange={updateField("paginas_agendas")}>{AGENDAS_PAGINAS.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
              <label><span>Observación</span><input value="Precio promocional desde 2 unidades" readOnly /></label>
            </>
          ) : (
            <></>
          )}
          <label><span>Cantidad</span><input type="number" min={1} step={1} placeholder={isMatrixProduct ? "100, 200, 300, 500, 1000" : "Ejemplo: 30"} value={form.cantidad_unidades} onChange={updateField("cantidad_unidades")} /><small className="range-hint">{isMatrixProduct ? `Cantidad de matriz: ${cantidadUnidades || "-"}` : isNoRangeProduct ? `Cantidad ingresada: ${cantidadUnidades || "-"}` : `Rango aplicado: ${derivedRange ?? "Sin rango disponible"}`}</small></label>
          <label><span>Urgencia</span><select value={form.urgencia} onChange={updateField("urgencia")}>{URGENCIAS.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
          {isBajadasFlow && !isAutoadhesivas ? <label><span>Adicional</span><select value={form.adicional_laminado} onChange={updateField("adicional_laminado")}>{adicionalesDisponibles.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}</select></label> : null}
          {isAutoadhesivas ? (
            <div className="checkbox-group">
              <span>Adicionales</span>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  data-testid="autoadh-laca-uv-checkbox"
                  checked={Boolean(form.adicional_laca_uv)}
                  onChange={(event) => setForm((prev) => ({ ...prev, adicional_laca_uv: event.target.checked }))}
                />
                <span>Laca UV</span>
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  data-testid="autoadh-tinta-blanca-checkbox"
                  checked={Boolean(form.adicional_tinta_blanca)}
                  onChange={(event) => setForm((prev) => ({ ...prev, adicional_tinta_blanca: event.target.checked }))}
                />
                <span>Tinta blanca</span>
              </label>
            </div>
          ) : null}
          {isBajadasFlow && !isAutoadhesivas && !isLivianoBajadaNoAutoadhesiva && ["laca", "laminado_brillo", "laminado_mate"].includes(form.adicional_laminado) ? (
            <label>
              <span>Aplicar adicional a</span>
              <select value={form.caras_adicional_laminado} onChange={updateField("caras_adicional_laminado")}>
                <option value="1">1 cara</option>
                <option value="2">2 caras</option>
              </select>
            </label>
          ) : null}
          {isBajadasFlow && !isAutoadhesivas && !isLivianoBajadaNoAutoadhesiva && (form.formato === "A3+" || form.formato === "XA3") ? (
            <label><span>Laminado por lado</span><select value={form.adicional_laminado_por_lado} onChange={updateField("adicional_laminado_por_lado")}>{ADICIONALES_POR_LADO.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}</select></label>
          ) : null}
          {isBajadasFlow && !isAutoadhesivas && !isLivianoBajadaNoAutoadhesiva && (form.formato === "A3+" || form.formato === "XA3") ? (
            <label>
              <span>Plastificado (A3)</span>
              <select value={String(Boolean(form.adicional_plastificado))} onChange={(event) => setForm((prev) => ({ ...prev, adicional_plastificado: event.target.value === "true" }))}>
                <option value="false">No</option>
                <option value="true">Sí</option>
              </select>
            </label>
          ) : null}
          {isBajadasFlow ? (
            <label>
              <span>Troquelado Digital</span>
              <select value={String(Boolean(form.adicional_troquelado))} onChange={(event) => setForm((prev) => ({ ...prev, adicional_troquelado: event.target.value === "true" }))}>
                <option value="false">No</option>
                <option value="true">Sí</option>
              </select>
            </label>
          ) : null}
          {isBajadasFlow && form.adicional_troquelado ? (
            <label>
              <span>Complejidad troquelado</span>
              <select value={form.complejidad_troquelado} onChange={updateField("complejidad_troquelado")}>
                {TROQUELADO_COMPLEJIDADES.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
        {isAutoadhesivas ? <div className="warning-box compact-note">Laca UV y Tinta blanca son adicionales independientes. Tinta blanca está sujeta a disponibilidad de valor base.</div> : null}
        {isTarjetas || isPostales || isFolletos || isStickers || isImanes || isStickersCirculares || isTarjetasTroqCirc ? <div className="info-box compact-note">Este producto usa precio total por paquete/cantidad según PDF vigente.</div> : <div className="info-box compact-note">Laca / laminado se suma antes de urgencia. Troquelado digital también se suma como adicional y no incluye costo de impresión.</div>}
        {error ? <div className="error-box">{error}</div> : null}
        {copyStatus ? <div className="info-box" data-testid="copy-status">{copyStatus}</div> : null}
        <div className="actions-row compact-actions">
          <button type="submit" className="calculate-btn compact-calculate-btn" disabled={loading}>{loading ? "Calculando..." : "Calcular"}</button>
          <button type="button" className="secondary-btn" data-testid="copy-result-button" onClick={handleCopy} disabled={!result}>Copiar</button>
          <button type="button" className="secondary-btn compact-clear-btn" data-testid="clear-button" onClick={handleClear}>Limpiar</button>
        </div>
      </form>

      <section className="card result-card result-sticky" data-testid="result-panel">
        <div className="card-head"><h3>2. Resultado</h3><span>{loading ? "Consultando API..." : "Actualizado"}</span></div>
        {!result ? (
          <div className="placeholder"><p>Completá los datos y presioná Calcular.</p></div>
        ) : (
          <>
            <div className="result-main">
              <div className="unit-panel"><h4>Precio unitario</h4><div className="unit-values"><p><span>Sin IVA</span><strong>{formatMoney(result.precio_unitario_sin_iva ?? result.precio_sin_iva)}</strong></p><p><span>Con urgencia</span><strong>{formatMoney(result.precio_unitario_con_urgencia ?? result.precio_con_recargo_urgencia)}</strong></p></div></div>
              <div className="total-panel"><p>Total final con urgencia</p><h3>{formatMoney(result.total_con_urgencia ?? result.precio_con_recargo_urgencia)}</h3><small>Total sin IVA: {formatMoney(result.total_sin_iva ?? result.precio_sin_iva)}</small></div>
            </div>
            {isSimpleMode ? (
              <div className="simple-summary-card" data-testid="quote-simple-summary">
                <strong>Resumen simple del cálculo</strong>
                <div className="detail-list compact-detail-list">
                  <div><strong>Material / papel</strong><span>{lastPayload?.material ?? lastPayload?.papel ?? form.material ?? "-"}</span></div>
                  <div><strong>Impresión</strong><span>{lastPayload?.caras ?? inferred.caras}</span></div>
                  <div><strong>Cantidad</strong><span>{result.cantidad_unidades ?? form.cantidad_unidades}</span></div>
                  <div><strong>{isMatrixProduct ? "Cantidad de matriz" : "Rango aplicado"}</strong><span>{isMatrixProduct ? (result.cantidad_unidades ?? form.cantidad_unidades) : (result.cantidad_rango_aplicado ?? derivedRange ?? "-")}</span></div>
                  <div><strong>Adicionales</strong><span>{result.adicional_troquelado ? "Incluye troquelado" : (result.adicional_laminado && result.adicional_laminado !== "sin_adicional" ? result.adicional_laminado : "Sin adicional")}</span></div>
                  <div><strong>Total final</strong><span>{formatMoney(result.total_con_urgencia ?? result.total_sin_iva)}</span></div>
                </div>
                <p>Activá modo avanzado para ver reglas, fuentes, payload y trazabilidad técnica.</p>
              </div>
            ) : (
              <div className="detail-list advanced-detail" data-testid="quote-advanced-details">
                <div><strong>Precio base unitario</strong><span>{formatMoney(result.precio_unitario_base_sin_iva ?? result.precio_unitario_sin_iva ?? result.precio_sin_iva)}</span></div>
                <div><strong>Adicional seleccionado</strong><span>{result.adicional_laminado ?? "sin_adicional"}</span></div>
                <div><strong>Caras adicional laminado/laca</strong><span>{result.caras_adicional_laminado ?? 1}</span></div>
                <div><strong>Laminado por lado</strong><span>{result.adicional_laminado_por_lado ?? "sin_adicional"}</span></div>
                <div><strong>Plastificado</strong><span>{result.adicional_plastificado ? "sí" : "no"}</span></div>
                <div><strong>Adicional unitario sin IVA</strong><span>{formatMoney(result.adicional_unitario_sin_iva ?? 0)}</span></div>
                <div><strong>Adicional hoja 4 unitario</strong><span>{formatMoney(result.adicional_hoja4_unitario_sin_iva ?? 0)}</span></div>
                <div><strong>Troquelado adicional</strong><span>{result.adicional_troquelado ? `sí (${result.complejidad_troquelado ?? "-"})` : "no"}</span></div>
                <div><strong>Troquelado unitario</strong><span>{formatMoney(result.adicional_troquelado_unitario_sin_iva ?? 0)}</span></div>
                <div><strong>Precio unitario con adicional</strong><span>{formatMoney(result.precio_unitario_con_adicional_sin_iva ?? result.precio_unitario_sin_iva ?? result.precio_sin_iva)}</span></div>
                <div><strong>Cantidad ingresada</strong><span>{result.cantidad_unidades ?? form.cantidad_unidades}</span></div>
                {isMatrixProduct ? (
                  <div><strong>Cantidad de matriz</strong><span>{result.cantidad_unidades ?? form.cantidad_unidades}</span></div>
                ) : (
                  <div><strong>Rango aplicado</strong><span>{result.cantidad_rango_aplicado ?? derivedRange ?? "-"}</span></div>
                )}
                <div><strong>Regla aplicada</strong><span>{result.regla_aplicada}</span></div>
                <div><strong>Fuente</strong><span>{result.fuente}</span></div>
                <div><strong>Regla adicional aplicada</strong><span>{result.regla_adicional_aplicada ?? "-"}</span></div>
                <div><strong>Fuente adicional</strong><span>{result.fuente_adicional ?? "-"}</span></div>
                <div><strong>Recargo aplicado</strong><span>{result.trazabilidad?.recargo_urgencia_aplicado ?? "-"}</span></div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><img src="/logoPromo.jpg" alt="Promo" /><div><h1>Promo</h1><p>Cotizador Bajadas</p></div></div>
        <NavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      </aside>

      <main className="main">
        <header className="topbar">
          <div><h2>{activeTab}</h2><p>Sistema de precios organizado por tareas operativas</p></div>
          <div className="topbar-right">
            <ViewModeToggle
              viewMode={viewMode}
              setViewMode={setViewMode}
              isSimpleMode={isSimpleMode}
              isAdvancedMode={isAdvancedMode}
            />
            <div className={apiConnected ? "api-status ok" : "api-status down"}>{apiConnected ? "API conectada" : "API no disponible"}</div>
            <div className="metrics-chip">{metrics ? `OK ${metrics.OK} · Alta ${metrics.DIFERENCIA_ALTA}` : "Métricas no disponibles"}</div>
          </div>
        </header>

        <section className="content-grid content-grid-tabs">
          {activeTab === "Cotizar" ? renderCotizador() : null}
          {activeTab === "Modificar precios" ? renderAdminPricesTab() : null}
          {activeTab === "Entender un precio" ? renderUnderstandPriceTab() : null}
          {activeTab === "Ver impacto de cambios" ? renderVariableImpactTab() : null}
          {activeTab === "Historial y backups" ? renderHistoryBackupsTab() : null}
          {activeTab === "Exportar soporte Excel" ? renderExportSupportExcelTab() : null}
          {activeTab === "Configuración avanzada" ? renderAdvancedConfigTab() : null}
        </section>
      </main>
    </div>
  );
}

