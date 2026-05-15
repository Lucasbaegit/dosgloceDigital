import { useEffect, useMemo, useState } from "react";
import {
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
  promoteBajadasConfigCandidate,
  rejectBajadasConfigCandidate,
  restoreBajadasConfig,
  restoreBajadasBackup,
  simulateRestoreBajadasBackup,
  simulateBajadasConfig,
  updateBajadasConfig,
  validateBajadasConfig,
} from "../api/bajadasV2Api";
import optionRows from "../data/bajadasOptions.json";

const NAV_ITEMS = ["Cotizador", "Árbol del precio", "Configuración", "Pedidos", "Plantillas", "Historial", "Precios", "Ajustes"];
const TAB_KEYS = new Set(["Cotizador", "Árbol del precio", "Configuración"]);
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
  const [activeTab, setActiveTab] = useState("Cotizador");
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
  }, []);

  useEffect(() => {
    setForm((prev) => {
      const next = { ...prev };
      if (next.categoria_ui === "Bajadas Autoadhesivas") {
        if (!AUTOADH_FORMATOS.includes(next.formato)) next.formato = "A3+";
        next.caras = "4/0";
        next.tipo_papel = next.columna_precio || "papel";
        next.material = next.columna_precio === "especial" ? "OPP blanco" : "Sticker";
        next.gramaje = next.columna_precio === "especial" ? "N/A" : "N/A";
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
        if (!FOLLETOS_FORMATOS.includes(next.formato)) next.formato = FOLLETOS_FORMATOS[0];
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
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setResult(null);
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
          adicional_laminado_por_lado: (inferred.formato === "A3+" || inferred.formato === "XA3") ? (form.adicional_laminado_por_lado || "sin_adicional") : "sin_adicional",
          adicional_plastificado: (inferred.formato === "A3+" || inferred.formato === "XA3") ? Boolean(form.adicional_plastificado) : false,
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
          <div className="card-head"><h3>Árbol del precio</h3></div>
          <div className="placeholder"><p>Completá los datos y presioná Calcular.</p></div>
        </section>
      );
    }
    return (
      <section className="card result-card">
        <div className="card-head"><h3>Árbol del precio</h3><span>Último cálculo</span></div>
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
          <button type="button" className="calculate-btn" onClick={saveScales}>Guardar cambios</button>
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
          {isBajadasFlow ? <label><span>Adicional</span><select value={form.adicional_laminado} onChange={updateField("adicional_laminado")}>{ADICIONALES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}</select></label> : null}
          {isBajadasFlow && !isAutoadhesivas && ["laca", "laminado_brillo", "laminado_mate"].includes(form.adicional_laminado) ? (
            <label>
              <span>Aplicar adicional a</span>
              <select value={form.caras_adicional_laminado} onChange={updateField("caras_adicional_laminado")}>
                <option value="1">1 cara</option>
                <option value="2">2 caras</option>
              </select>
            </label>
          ) : null}
          {isAutoadhesivas ? (
            <>
              <label>
                <span>Laca UV (autoadhesiva)</span>
                <select value={String(Boolean(form.adicional_laca_uv))} onChange={(event) => setForm((prev) => ({ ...prev, adicional_laca_uv: event.target.value === "true" }))}>
                  <option value="false">No</option>
                  <option value="true">Sí</option>
                </select>
              </label>
              <label>
                <span>Tinta blanca</span>
                <select value={String(Boolean(form.adicional_tinta_blanca))} onChange={(event) => setForm((prev) => ({ ...prev, adicional_tinta_blanca: event.target.value === "true" }))}>
                  <option value="false">No</option>
                  <option value="true">Sí</option>
                </select>
              </label>
            </>
          ) : null}
          {isBajadasFlow && (form.formato === "A3+" || form.formato === "XA3") ? (
            <label><span>Laminado por lado</span><select value={form.adicional_laminado_por_lado} onChange={updateField("adicional_laminado_por_lado")}>{ADICIONALES_POR_LADO.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}</select></label>
          ) : null}
          {isBajadasFlow && (form.formato === "A3+" || form.formato === "XA3") ? (
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
        {isAutoadhesivas ? <div className="warning-box compact-note">Laca UV está disponible para autoadhesivas. Tinta blanca queda bloqueada hasta contar con datos confiables.</div> : null}
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
            <div className="detail-list">
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
          </>
        )}
      </section>
    </div>
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><img src="/logoPromo.jpg" alt="Promo" /><div><h1>Promo</h1><p>Cotizador Bajadas</p></div></div>
        <nav>
          {NAV_ITEMS.map((item) => (
            <button
              key={item}
              type="button"
              data-testid={item === "Árbol del precio" ? "tab-price-tree" : undefined}
              className={activeTab === item ? "nav-item active" : "nav-item"}
              onClick={() => TAB_KEYS.has(item) && setActiveTab(item)}
            >
              {item}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div><h2>Cotizador Bajadas</h2><p>Motor productivo v2 conectado a API interna</p></div>
          <div className="topbar-right"><div className={apiConnected ? "api-status ok" : "api-status down"}>{apiConnected ? "API conectada" : "API no disponible"}</div><div className="metrics-chip">{metrics ? `OK ${metrics.OK} · Alta ${metrics.DIFERENCIA_ALTA}` : "Métricas no disponibles"}</div></div>
        </header>

        <section className="content-grid content-grid-tabs">
          {activeTab === "Cotizador" ? renderCotizador() : null}
          {activeTab === "Árbol del precio" ? renderTreeTab() : null}
          {activeTab === "Configuración" ? renderConfigTab() : null}
        </section>
      </main>
    </div>
  );
}
