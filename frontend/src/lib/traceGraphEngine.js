import {
  collectCurrentQuoteAdditions,
  describeCurrentQuoteMaterial,
  formatMoney,
  inferPriceSourceKind,
  quoteUsesFixedPdf,
  relationContextBadge,
} from "./cotizacionLogic";

const TRACE_DEFAULT_LEGEND = {
  variable_madre: "Variable madre editable",
  derivado: "Calculado desde otra variable o regla",
  tabla_pdf: "Precio fijo PDF",
  preparada: "Detectada/preparada, no conectada al c??lculo actual",
  bloqueado: "Sin datos confiables",
  factor: "Factor o multiplicador de f??rmula",
};

const TRACE_TYPE_LABELS = {
  entrada: "Entrada",
  variable_madre: "Variable madre",
  derivado: "Derivado",
  tabla_pdf: "Tabla PDF",
  preparada: "Preparada",
  bloqueado: "Bloqueado",
  factor: "Factor / multiplicador",
};
const TRACE_NODE_WIDTH = 320;
const TRACE_NODE_HEIGHT = 132;
const TRACE_MIN_ZOOM = 0.5;
const TRACE_MAX_ZOOM = 2.5;
const TRACE_SIMPLE_INITIAL_ZOOM = 0.85;
const TRACE_TECHNICAL_INITIAL_ZOOM = 1;
const TRACE_STAGE_LABELS = [
  { key: "entrada", label: "Entrada", x: 76, y: 26 },
  { key: "parametros", label: "Par??metros", x: 436, y: 26 },
  { key: "fuente", label: "Fuente / regla", x: 796, y: 26 },
  { key: "calculo", label: "C??lculo", x: 1156, y: 26 },
  { key: "total", label: "Total", x: 1516, y: 26 },
];

export function formatTraceValue(node) {
  if (!node || node.value === null || node.value === undefined || node.value === "") return "-";
  const value = typeof node.value === "number" ? Number(node.value.toFixed(4)).toLocaleString("es-AR") : String(node.value);
  return node.unit ? `${value} ${node.unit}` : value;
}



export function clampTraceZoom(value) {
  return Math.min(TRACE_MAX_ZOOM, Math.max(TRACE_MIN_ZOOM, Number(value) || 1));
}



export function initialTraceZoom(showTechnicalGraph) {
  return showTechnicalGraph ? TRACE_TECHNICAL_INITIAL_ZOOM : TRACE_SIMPLE_INITIAL_ZOOM;
}



export function traceNodeVisualType(node) {
  if (!node) return "derivado";
  if (node.type === "variable_madre" && node.editable_en_sistema && node.impacta_hoy) return "variable_madre";
  if (node.type === "factor" || String(node.id || "").includes("factor") || String(node.id || "").includes("multiplicador")) return "factor";
  return node.type || "derivado";
}



export function inferTraceBranch(node) {
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



export function layoutTraceGraph(graph) {
  const nodes = graph?.nodes || [];
  const edges = graph?.edges || [];
  const explicitLayout = nodes.some((node) => node.column !== undefined || node.branch || node.row !== undefined);
  const positions = {};
  const xStep = 360;
  const yStep = 168;
  const marginX = 56;
  const marginY = 60;

  if (explicitLayout) {
    const branchOrder = ["entrada", "material", "impresion", "cantidad", "adicionales", "urgencia", "resultado"];
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
      const rowOffset = Number(item.row ?? item.autoRow ?? 0) * (TRACE_NODE_HEIGHT + 24);
      positions[item.node.id] = {
        x: marginX + lane * xStep,
        y: marginY + item.column * yStep + rowOffset,
      };
    });
    const maxX = Math.max(0, ...Object.values(positions).map((pos) => pos.x));
    const maxY = Math.max(0, ...Object.values(positions).map((pos) => pos.y));
    return {
      positions,
      width: Math.max(1360, maxX + TRACE_NODE_WIDTH + 120),
      height: Math.max(980, maxY + TRACE_NODE_HEIGHT + 120),
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
      positions[node.id] = { x: marginX + index * xStep, y: marginY + depth * yStep };
    });
  });
  const maxDepth = Math.max(0, ...Object.keys(groups).map(Number));
  const maxRows = Math.max(1, ...Object.values(groups).map((group) => group.length));
  return {
    positions,
    width: Math.max(1180, marginX + maxRows * xStep + TRACE_NODE_WIDTH),
    height: Math.max(860, marginY + (maxDepth + 1) * yStep + TRACE_NODE_HEIGHT),
  };
}



export function traceNode(id, label, type, value, unit, description, source, operation, observation, meta = {}) {
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



export function traceEdge(id, source, target, label) {
  return { id, source, target, label };
}



export function readableTraceText(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b(\d+g)\s+Ilustracion\b/g, "Ilustración $1")
    .replace(/\b(\d+g)\s+Ilustración\b/g, "Ilustración $1")
    .replace(/\bIlustracion\b/g, "Ilustración")
    .replace(/\bimpresion\b/g, "impresión")
    .replace(/\blaminado brillo\b/g, "laminado brillo")
    .trim();
}



export function shortTraceLabel(node) {
  const id = String(node?.id || "");
  if (id === "entrada_usuario") return "Entrada";
  if (id === "material_cotizado") return "Material";
  if (id === "formato") return "Formato";
  if (id === "caras") return "Impresión";
  if (id === "cantidad") return "Cantidad";
  if (id === "rango") return readableTraceText(node.label).replace(/^Rango aplicado\s*/i, "Rango ");
  if (id === "precio_base_unitario") return "Precio base";
  if (id === "base_total") return "Base x cantidad";
  if (id === "sin_adicional") return "Sin adicional";
  if (id === "subtotal_con_adicionales") return "Subtotal";
  if (id === "urgencia") return "Urgencia";
  if (id === "total_final") return "Total final";
  if (id.startsWith("adicional_")) return "Adicional";
  if (id.startsWith("variable_")) {
    const rango = node.relation?.aplica_a?.rangos?.[0];
    if (rango) return `Rango ${readableTraceText(rango)}`;
    const badge = node.context_badge || node.operation || "";
    if (/rango|cantidad/i.test(badge)) return readableTraceText(badge).replace(/^Cantidad\s*/i, "Rango ");
    if (/terminaci/i.test(badge)) return "Terminación";
    if (/formato/i.test(badge)) return "Formato";
    if (/impresi|cara/i.test(badge)) return "Impresión";
    if (/papel|material|gramaje/i.test(badge)) return "Material";
    return "Variable editable";
  }
  return readableTraceText(node?.label || "Nodo");
}



export function shortTraceValue(node) {
  const id = String(node?.id || "");
  if (id === "entrada_usuario") return readableTraceText(node.value || "Cotización actual");
  if (id === "material_cotizado") return readableTraceText(node.value || node.label);
  if (id === "formato" || id === "caras" || id === "cantidad" || id === "rango") return formatTraceValue(node);
  if (id === "sin_adicional") return "No suma";
  if (id === "urgencia" && String(node.value || "").toLowerCase() === "normal") return "Normal";
  if (id.startsWith("variable_") && node?.editable_en_sistema) return "Editable";
  if (id.startsWith("variable_")) return node.context_badge || formatTraceValue(node);
  return formatTraceValue(node);
}



export function traceNodeBadge(node, visualType) {
  if (node?.editable_en_sistema && node?.impacta_hoy) return "Editable";
  if (node?.id === "total_final") return "Final";
  if (node?.type === "tabla_pdf") return "PDF/lista";
  if (visualType === "factor") return "Regla";
  if (node?.id === "sin_adicional" || node?.id === "urgencia") return "Neutro";
  return TRACE_TYPE_LABELS[visualType] || visualType;
}



export function traceNodeSize(node) {
  if (node?.id === "total_final") return { width: TRACE_NODE_WIDTH + 54, height: TRACE_NODE_HEIGHT + 24 };
  if (node?.id === "sin_adicional" || node?.id === "urgencia") return { width: TRACE_NODE_WIDTH - 36, height: TRACE_NODE_HEIGHT - 24 };
  return { width: TRACE_NODE_WIDTH, height: TRACE_NODE_HEIGHT };
}



export function simplifyCurrentQuoteGraph(graph) {
  if (!graph?.nodes?.length) return graph || { nodes: [], edges: [], legend: {} };
  if (!graph.nodes.some((node) => node.id === "entrada_usuario")) return graph;

  const mainPathIds = new Set([
    "entrada_usuario",
    "material_cotizado",
    "formato",
    "caras",
    "cantidad",
    "rango",
    "precio_base_unitario",
    "base_total",
    "sin_adicional",
    "subtotal_con_adicionales",
    "urgencia",
    "total_final",
  ]);

  const stageById = {
    entrada_usuario: ["entrada", 0, 0],
    cantidad: ["entrada", 0, 1],
    material_cotizado: ["parametros", 1, 0],
    formato: ["parametros", 1, 1],
    caras: ["parametros", 1, 2],
    sin_adicional: ["parametros", 1, 3],
    rango: ["fuente", 2, 0],
    precio_base_unitario: ["fuente", 2, 1],
    base_total: ["calculo", 3, 0],
    subtotal_con_adicionales: ["calculo", 3, 1],
    urgencia: ["calculo", 3, 2],
    total_final: ["total", 4, 0],
  };

  let simpleVariableRow = 0;
  const visibleNodes = graph.nodes.filter((node) => (
    mainPathIds.has(node.id) ||
    String(node.id || "").startsWith("adicional_") ||
    (String(node.id || "").startsWith("variable_") && node.affects_current_quote !== false)
  )).map((node) => {
    const isVariable = String(node.id || "").startsWith("variable_");
    const isAddition = String(node.id || "").startsWith("adicional_");
    const [stage, lane, row] = stageById[node.id] || (isVariable
      ? ["fuente", 2, 2]
      : isAddition
        ? ["parametros", 1, 3]
        : [inferTraceBranch(node), 2, 0]);
    const simpleColumn = isVariable ? 2 + simpleVariableRow : row;
    if (isVariable) simpleVariableRow += 1;
    return {
      ...node,
      branch: stage,
      lane,
      column: simpleColumn,
      row: 0,
      simple_stage: stage,
      simple_label: shortTraceLabel(node),
      simple_value: shortTraceValue(node),
      simple_badge: traceNodeBadge(node, traceNodeVisualType(node)),
      simple_weight: node.id === "total_final" ? "final" : (node.id === "sin_adicional" || node.id === "urgencia" ? "secondary" : "primary"),
    };
  });
  const visibleIds = new Set(visibleNodes.map((node) => node.id));
  return {
    ...graph,
    nodes: visibleNodes,
    edges: (graph.edges || []).filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target)),
    simple: true,
    stages: TRACE_STAGE_LABELS,
    legend: {
      entrada: graph.legend?.entrada || TRACE_DEFAULT_LEGEND.entrada,
      derivado: graph.legend?.derivado || TRACE_DEFAULT_LEGEND.derivado,
      factor: graph.legend?.factor || TRACE_DEFAULT_LEGEND.factor,
      tabla_pdf: graph.legend?.tabla_pdf || TRACE_DEFAULT_LEGEND.tabla_pdf,
      variable_madre: graph.legend?.variable_madre || TRACE_DEFAULT_LEGEND.variable_madre,
    },
  };
}



export function buildCurrentQuoteTraceGraph(payload, result, context = {}) {
  if (!payload || !result) return null;
  const editableRelations = context.editableRelations || [];
  const variableByKey = context.variableByKey || new Map();
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

    traceNode("click_base", `Click ${modeColor}`, "variable_madre", modeColor, null, "Rama de click/impresión usada para explicar el origen del costo de impresión.", "variables comerciales / motor de cotización", "define base de impresión", "Cuando el producto usa PDF fijo, el nodo queda como referencia lógica y el precio final sigue viniendo del resultado real.", { branch: "impresion", column: 0, lane: 1, row: 0, editable_en_sistema: false, impacta_hoy: true, editable_reason: "Nodo conceptual: si existe variable editable exacta, aparece como nodo propio en Base técnica editable." }),
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

  editableRelations.slice(0, 8).forEach((relation, index) => {
    const variable = variableByKey.get(relation.variable);
    const badge = relationContextBadge(relation);
    const branch = (() => {
      const text = `${badge} ${relation.componente || ""} ${relation.detalle || ""}`.toLowerCase();
      if (text.includes("terminaci") || text.includes("laca") || text.includes("laminado") || text.includes("adicional")) return "adicionales";
      if (text.includes("cantidad") || text.includes("rango")) return "cantidad";
      if (text.includes("impresi") || text.includes("click") || text.includes("cara") || text.includes("formato")) return "impresion";
      if (text.includes("papel") || text.includes("material") || text.includes("gramaje")) return "material";
      return "material";
    })();
    const target = branch === "adicionales"
      ? (additions.length ? "subtotal_con_adicionales" : "sin_adicional")
      : branch === "cantidad"
        ? "rango"
        : branch === "impresion"
          ? "precio_base_unitario"
          : "material_cotizado";
    const id = `variable_${relation.variable}`;
    nodes.push(traceNode(
      id,
      relation.variable_label || variable?.label || relation.variable,
      "variable_madre",
      variable?.value ?? relation.valor_actual ?? null,
      variable?.unit || "",
      relation.detalle || variable?.description || "Variable editable conectada al caso actual.",
      relation.fuente || variable?.source_file || "mapa de impacto",
      badge,
      quoteUsesFixedPdf(payload, result, relation)
        ? "Afecta base técnica/trazabilidad; el precio final actual permanece validado por PDF/lista."
        : "Participa en el cálculo del precio final actual.",
      {
        branch,
        column: 2 + index,
        lane: branch === "material" ? 0 : branch === "impresion" ? 1 : branch === "cantidad" ? 2 : 3,
        row: index % 2,
        editable_en_sistema: Boolean(relation.editable),
        impacta_hoy: Boolean(relation.impacta_hoy),
        variable_key: relation.variable,
        variable_label: relation.variable_label || variable?.label,
        variable_type: variable?.tipo || relation.tipo || "variable_madre",
        source: relation.fuente || variable?.source_file || "mapa de impacto",
        affects_current_quote: Boolean(relation.impacta_hoy),
        context_badge: badge,
        relation,
      }
    ));
    edges.push(traceEdge(`e_variable_${relation.variable}`, id, target, badge));
  });

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


