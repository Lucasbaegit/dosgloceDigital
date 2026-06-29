import { useEffect, useMemo, useState } from "react";
import ConfiguracionAvanzadaPanel from "./cotizador/ConfiguracionAvanzadaPanel";
import EntenderPrecioPanel from "./cotizador/EntenderPrecioPanel";
import ExportarSoporteExcelPanel from "./cotizador/ExportarSoporteExcelPanel";
import HistorialBackupsPanel from "./cotizador/HistorialBackupsPanel";
import ImpactoCambiosPanel from "./cotizador/ImpactoCambiosPanel";
import ModificarPreciosWizard from "./cotizador/ModificarPreciosWizard";
import NavigationTabs from "./cotizador/NavigationTabs";
import ViewModeToggle from "./cotizador/ViewModeToggle";
import useConfigManager from "../hooks/useConfigManager";
import useAdminPrices from "../hooks/useAdminPrices";
import useTraceGraph from "../hooks/useTraceGraph";
import useImpactMap from "../hooks/useImpactMap";
import useCotizacionForm from "../hooks/useCotizacionForm";
import useCotizacionSubmit from "../hooks/useCotizacionSubmit";
import {
  buildCurrentQuoteTraceGraph,
  clampTraceZoom,
  formatTraceValue,
  initialTraceZoom,
  layoutTraceGraph,
  readableTraceText,
  simplifyCurrentQuoteGraph,
  traceNodeSize,
  traceNodeVisualType,
} from "../lib/traceGraphEngine";
import {
  buildCurrentQuoteSummary,
  collectCurrentQuoteAdditions,
  describeCurrentQuoteMaterial,
  describeQuoteOperationalAdditions,
  describeQuoteTerminacion,
  formatMoney,
  getQuoteProductKey,
  getQuoteProductLabel,
  inferPriceSourceKind,
  inferQuoteContext,
  quoteUsesFixedPdf,
  relationAppliesToCurrentQuote,
  relationContextBadge,
  sourceKindExplanation,
  sourceKindLabel,
} from "../lib/cotizacionLogic";

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
const AUTOADH_COLUMNAS = [
  { value: "papel", label: "Papel autoadhesivo" },
  { value: "especial", label: "OPP blanco / especial" },
];
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
const TRACE_NODE_WIDTH = 320;
const TRACE_NODE_HEIGHT = 132;
const TRACE_MIN_ZOOM = 0.5;
const TRACE_MAX_ZOOM = 2.5;
const TRACE_ZOOM_STEP = 0.15;
const TRACE_SIMPLE_INITIAL_ZOOM = 0.85;
const TRACE_TECHNICAL_INITIAL_ZOOM = 1;
const TRACE_STAGE_LABELS = [
  { key: "entrada", label: "Entrada", x: 76, y: 26 },
  { key: "parametros", label: "Parámetros", x: 436, y: 26 },
  { key: "fuente", label: "Fuente / regla", x: 796, y: 26 },
  { key: "calculo", label: "Cálculo", x: 1156, y: 26 },
  { key: "total", label: "Total", x: 1516, y: 26 },
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
  const [metrics, setMetrics] = useState(null);
  const isAdvancedMode = viewMode === "advanced";
  const isSimpleMode = viewMode === "simple";

  const {
    result,
    setResult,
    lastPayload,
    setLastPayload,
    loading,
    setLoading,
    error,
    setError,
    apiConnected,
    copyStatus,
    setCopyStatus,
    principalVariables,
    principalDraft,
    setPrincipalDraft,
    principalAudit,
    principalRanges,
    principalMsg,
    setPrincipalMsg,
    excelImportFile,
    setExcelImportFile,
    excelImportPreview,
    excelImportLoading,
    excelImportError,
    loadPrincipalVariables,
    downloadPricesPdf,
    downloadPricesExcel,
    previewExcelImport,
    savePrincipalVariables,
    handleCopy,
    handleSubmit,
  } = useCotizacionSubmit({
    setMetrics,
    getSubmitContext: () => ({
      form,
      inferred,
      derivedRange,
      cantidadUnidades,
      missingFields,
      isAutoadhesivas,
      isKraft,
      isTarjetas,
      isPostales,
      isFolletos,
      isCarpetas,
      isSobres,
      isStickers,
      isImanes,
      isStickersCirculares,
      isTarjetasTroqCirc,
      isPlanchaIman,
      isAgendasCuadernos,
      isNoRangeProduct,
      isBajadasFlow,
      isMatrixProduct,
    }),
    resetTraceForSubmit: () => {
      if (traceMode === "cotizacion_actual") {
        setTraceGraph(null);
        setSelectedTraceNodeId(null);
      }
    },
    resetAdminAfterSubmit: () => {
      setAdminWizardStep(1);
      setAdminVariable("");
      setAdminNewValue("");
      setAdminPreview(null);
      setAdminMsg("");
      setAdminError("");
      setAdminShowAdvancedVariables(false);
      setTraceShowTechnicalGraph(false);
    },
    constants: {
      CARPETAS_GRAMAJE,
      CARPETAS_PAPEL,
      FOLLETOS_CANTIDADES,
      FOLLETOS_PAPELES,
      IMANES_CANTIDADES,
      KRAFT_MATERIAL,
      KRAFT_TIPO_PAPEL,
      PLANCHA_IMAN_CANTIDADES_SUGERIDAS,
      POSTALES_CANTIDADES,
      SOBRES_CANTIDADES,
      STICKERS_CANTIDADES,
      STICKERS_CIRCULARES_CANTIDADES,
      TARJETAS_CANTIDADES,
      TARJETAS_TROQ_CIRC_CANTIDADES,
    },
  });

  const {
    form,
    setForm,
    inferred,
    isAutoadhesivas,
    isKraft,
    isTarjetas,
    isPostales,
    isFolletos,
    isCarpetas,
    isSobres,
    isStickers,
    isImanes,
    isStickersCirculares,
    isTarjetasTroqCirc,
    isPlanchaIman,
    isAgendasCuadernos,
    isNoRangeProduct,
    isBajadasFlow,
    isMatrixProduct,
    isLivianoBajadaNoAutoadhesiva,
    adicionalesDisponibles,
    formatoDataSource,
    validRows,
    formatoOptions,
    effectiveFormatoOptions,
    tipoPapelOptions,
    materialOptions,
    gramajeOptions,
    cantidadOptions,
    cantidadUnidades,
    derivedRange,
    missingFields,
    updateField,
    handleClear,
  } = useCotizacionForm({
    initialForm: INITIAL_FORM,
    setResult,
    setLastPayload,
    setError,
    setCopyStatus,
    setLoading,
    constants: {
      ADICIONALES,
      ADICIONALES_LIVIANO,
      AGENDAS_FORMATOS,
      AGENDAS_PAGINAS,
      AGENDAS_PRODUCTOS,
      AUTOADH_FORMATOS,
      AUTOADH_RANGOS,
      CARAS,
      CARPETAS_CARAS,
      CARPETAS_FORMATOS,
      CARPETAS_GRAMAJE,
      CARPETAS_PAPEL,
      CARPETAS_RANGOS,
      CARPETAS_TERMINACIONES,
      FOLLETOS_CANTIDADES,
      FOLLETOS_FORMATOS,
      FOLLETOS_MODO_COLOR,
      FOLLETOS_PAPELES,
      IMANES_CANTIDADES,
      IMANES_FORMATOS,
      IMANES_TERMINACIONES,
      KRAFT_FORMATOS,
      KRAFT_GRAMAJES,
      KRAFT_MATERIAL,
      KRAFT_RANGOS,
      KRAFT_TIPO_PAPEL,
      PLANCHA_IMAN_CANTIDADES_SUGERIDAS,
      PLANCHA_IMAN_VARIANTES,
      POSTALES_CANTIDADES,
      POSTALES_CARAS,
      POSTALES_FORMATOS,
      POSTALES_GRAMAJES,
      POSTALES_TERMINACIONES,
      SOBRES_CANTIDADES,
      SOBRES_TIPOS,
      STICKERS_CANTIDADES,
      STICKERS_CIRCULARES_CANTIDADES,
      STICKERS_CIRCULARES_FORMATOS,
      STICKERS_CIRCULARES_MATERIALES,
      STICKERS_CIRCULARES_TERMINACIONES,
      STICKERS_FORMATOS,
      STICKERS_TERMINACIONES,
      TARJETAS_CANTIDADES,
      TARJETAS_CARAS,
      TARJETAS_FORMATOS,
      TARJETAS_GRAMAJES,
      TARJETAS_TERMINACIONES,
      TARJETAS_TROQ_CIRC_CANTIDADES,
      TARJETAS_TROQ_CIRC_FORMATOS,
    },
  });

  const {
    cfg,
    setCfg,
    cfgHistory,
    cfgDiff,
    cfgCandidates,
    cfgMsg,
    cfgValidation,
    cfgSimulation,
    cfgActiveVersion,
    cfgBackups,
    cfgBackupDetail,
    cfgBackupPreview,
    cfgBackupSimulation,
    runValidateConfig,
    runSimulation,
    createCandidate,
    rejectCandidate,
    approveCandidate,
    promoteCandidate,
    showBackupDetail,
    restoreBackup,
    previewRestoreBackup,
    simulateBackupQuote,
    updateCfgField,
    saveCfgField,
    saveScales,
    restoreCfg,
  } = useConfigManager({ lastPayload });
  const {
    impactData,
    setImpactData,
    impactLoading,
    impactError,
    impactMode,
    setImpactMode,
    impactVariable,
    setImpactVariable,
    impactProduct,
    setImpactProduct,
  } = useImpactMap({
    activeTab,
    lastPayload,
    result,
  });

  const {
    adminPrices,
    setAdminPrices,
    adminHistory,
    adminVariable,
    setAdminVariable,
    adminNewValue,
    setAdminNewValue,
    adminPreview,
    setAdminPreview,
    adminLoading,
    adminMsg,
    setAdminMsg,
    adminError,
    setAdminError,
    adminWizardStep,
    setAdminWizardStep,
    adminShowAdvancedVariables,
    setAdminShowAdvancedVariables,
    adminRollbackPreview,
    setAdminRollbackPreview,
    adminRollbackTargetId,
    setAdminRollbackTargetId,
    handleAdminPreview,
    handleAdminApply,
    handleAdminRollbackPreview,
    handleAdminRollbackApply,
    getCurrentEditableRelations,
    getAdminVariableByKey,
  } = useAdminPrices({
    activeTab,
    lastPayload,
    result,
    impactData,
    setImpactData,
    loadPrincipalVariables,
  });
  const {
    traceMode,
    setTraceMode,
    traceCase,
    setTraceCase,
    traceGraph,
    setTraceGraph,
    traceLoading,
    traceError,
    setTraceError,
    selectedTraceNodeId,
    setSelectedTraceNodeId,
    traceZoom,
    setTraceZoom,
    traceFullscreen,
    setTraceFullscreen,
    traceShowTechnicalGraph,
    setTraceShowTechnicalGraph,
    traceGraphViewportRef,
    loadTraceGraph,
    handleLoadCurrentQuoteGraph,
    setTraceZoomLevel,
    resetTraceView,
    fitTraceGraphToView,
    handleTraceWheel,
    handleTracePanStart,
    handleTracePanMove,
    stopTracePan,
  } = useTraceGraph({
    activeTab,
    understandMode,
    lastPayload,
    result,
    impactData,
    setImpactData,
    adminPrices,
    setAdminPrices,
    getCurrentEditableRelations,
    traceZoomStep: TRACE_ZOOM_STEP,
  });

  const handleTraceModifyVariable = (variableKey) => {
    if (!variableKey) return;
    const variable = getAdminVariableByKey(variableKey);
    setAdminVariable(variableKey);
    if (variable) setAdminNewValue(String(variable.value));
    setAdminPreview(null);
    setAdminRollbackPreview(null);
    setAdminRollbackTargetId(null);
    setAdminMsg("");
    setAdminError("");
    setAdminWizardStep(2);
    setActiveTab("Modificar precios");
  };

  const handleOpenVariableInTrace = (variableKey) => {
    if (!variableKey || !lastPayload || !result) return;
    if (traceMode !== "cotizacion_actual" || !traceGraph) {
      const variableByKey = new Map((adminPrices?.variables || []).map((item) => [item.key, item]));
      const graph = buildCurrentQuoteTraceGraph(lastPayload, result, {
        editableRelations: getCurrentEditableRelations(),
        variableByKey,
      });
      setTraceGraph(graph);
    }
    setTraceMode("cotizacion_actual");
    setUnderstandMode("trazabilidad");
    setSelectedTraceNodeId(`variable_${variableKey}`);
    setTraceZoom(1);
    setActiveTab("Entender un precio");
  };

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
    const baseGraph = traceGraph || { nodes: [], edges: [], legend: {} };
    const graph = traceShowTechnicalGraph ? baseGraph : simplifyCurrentQuoteGraph(baseGraph);
    const { positions, width, height } = layoutTraceGraph(graph);
    const selectedNode = graph.nodes.find((node) => node.id === selectedTraceNodeId) || graph.nodes[0] || null;
    const selectedCase = TRACE_GRAPH_CASES.find((item) => item.value === traceCase);
    const isCurrentMode = traceMode === "cotizacion_actual";
    const selectedVariableKey = selectedNode?.variable_key || (selectedNode?.editable_en_sistema ? selectedNode.id : null) || (getAdminVariableByKey(selectedNode?.id) ? selectedNode.id : null);
    const selectedVariable = selectedVariableKey ? getAdminVariableByKey(selectedVariableKey) : null;
    const selectedIsEditable = Boolean(selectedVariableKey && (selectedNode?.editable_en_sistema || selectedVariable?.editable));
    const selectedFixedPdf = selectedNode ? quoteUsesFixedPdf(lastPayload, result, selectedNode.relation || selectedNode) : false;
    const quoteSummary = isCurrentMode ? buildCurrentQuoteSummary(lastPayload, result) : null;

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
                aria-pressed={traceMode === mode.value ? "true" : "false"}
                onClick={() => {
                  setTraceMode(mode.value);
                  setTraceGraph(null);
                  setSelectedTraceNodeId(null);
                  setTraceZoom(1);
                  setTraceShowTechnicalGraph(false);
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
                    setTraceZoom(1);
                    setTraceShowTechnicalGraph(false);
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

        {quoteSummary && !traceShowTechnicalGraph ? (
          <section className="trace-quote-summary-card" data-testid="trace-quote-summary-card">
            <div>
              <span>Resumen de esta cotización</span>
              <strong>{quoteSummary.sentence}</strong>
              <p>{quoteSummary.source}</p>
            </div>
            <aside>
              <small>Total final</small>
              <b>{quoteSummary.total}</b>
            </aside>
          </section>
        ) : null}

        <div className="trace-zoom-toolbar" data-testid="trace-zoom-toolbar">
          <div className="trace-zoom-help">
            {traceShowTechnicalGraph
              ? "Grafo técnico completo: muestra nodos de apoyo, ramas y variables auxiliares."
              : "Grafo simple: camino principal del precio actual, de la entrada al total final."}
          </div>
          <div className="trace-zoom-controls" role="group" aria-label="Controles de zoom del grafo">
            <button
              type="button"
              data-testid="trace-toggle-technical-graph"
              aria-pressed={traceShowTechnicalGraph ? "true" : "false"}
              onClick={() => {
                const next = !traceShowTechnicalGraph;
                setTraceShowTechnicalGraph(next);
                setSelectedTraceNodeId(null);
                setTraceZoom(initialTraceZoom(next));
              }}
              disabled={!baseGraph.nodes.length}
            >
              {traceShowTechnicalGraph ? "Ver grafo simple" : "Ver grafo técnico completo"}
            </button>
            <button type="button" data-testid="trace-zoom-out" onClick={() => setTraceZoomLevel(traceZoom - TRACE_ZOOM_STEP)} disabled={!graph.nodes.length}>-</button>
            <strong data-testid="trace-zoom-indicator">{Math.round(traceZoom * 100)}%</strong>
            <button type="button" data-testid="trace-zoom-in" onClick={() => setTraceZoomLevel(traceZoom + TRACE_ZOOM_STEP)} disabled={!graph.nodes.length}>+</button>
            <button type="button" data-testid="trace-zoom-reset" onClick={resetTraceView} disabled={!graph.nodes.length}>100%</button>
            <button type="button" data-testid="trace-fit-view" onClick={() => fitTraceGraphToView(width, height)} disabled={!graph.nodes.length}>Ajustar</button>
            <button type="button" data-testid="trace-fullscreen-toggle" onClick={() => setTraceFullscreen((current) => !current)} disabled={!graph.nodes.length}>
              {traceFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            </button>
          </div>
        </div>

        <div className="trace-legend" data-testid="trace-legend">
          {Object.entries(graph.legend || {}).map(([type, label]) => (
            <span className={`legend-chip ${type}`} key={type}><i />{TRACE_TYPE_LABELS[type] || type}: {label}</span>
          ))}
        </div>

        <div className={traceFullscreen ? "trace-layout fullscreen" : "trace-layout"}>
          <div
            ref={traceGraphViewportRef}
            className="trace-graph-card"
            data-testid="trace-graph-container"
            onWheel={handleTraceWheel}
            onMouseDown={handleTracePanStart}
            onMouseMove={handleTracePanMove}
            onMouseUp={stopTracePan}
            onMouseLeave={stopTracePan}
          >
            {graph.nodes.length ? (
              <svg
                className="trace-svg"
                data-layout="vertical"
                style={{ width: `${width * traceZoom}px`, height: `${height * traceZoom}px` }}
                viewBox={`0 0 ${width} ${height}`}
                role="img"
                aria-label="Grafo de trazabilidad de precios"
              >
                <defs>
                  <marker id="trace-arrow" markerWidth="13" markerHeight="13" refX="11" refY="4" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L0,8 L11,4 z" fill="#8aa4d6" />
                  </marker>
                </defs>
                {graph.simple && graph.stages?.length ? (
                  <g className="trace-stage-layer" data-testid="trace-stage-labels">
                    {graph.stages.map((stage) => (
                      <g key={stage.key} className="trace-stage-label" transform={`translate(${stage.x} ${stage.y})`}>
                        <rect width="214" height="38" rx="19" />
                        <text x="18" y="25">{stage.label}</text>
                      </g>
                    ))}
                  </g>
                ) : null}
                {graph.edges.map((edge) => {
                  const from = positions[edge.source];
                  const to = positions[edge.target];
                  if (!from || !to) return null;
                  const sourceNode = graph.nodes.find((node) => node.id === edge.source);
                  const targetNode = graph.nodes.find((node) => node.id === edge.target);
                  const sourceSize = traceNodeSize(sourceNode);
                  const targetSize = traceNodeSize(targetNode);
                  const startX = from.x + sourceSize.width / 2;
                  const startY = from.y + sourceSize.height;
                  const endX = to.x + targetSize.width / 2;
                  const endY = to.y - 12;
                  const curve = Math.max(70, Math.abs(endY - startY) / 2);
                  return (
                    <g key={edge.id}>
                      <path className="trace-edge" d={`M ${startX} ${startY} C ${startX} ${startY + curve}, ${endX} ${endY - curve}, ${endX} ${endY}`} markerEnd="url(#trace-arrow)" />
                      <text className="trace-edge-label" x={(startX + endX) / 2 + 8} y={(startY + endY) / 2}>{edge.label}</text>
                    </g>
                  );
                })}
                {graph.nodes.map((node) => {
                  const pos = positions[node.id] || { x: 0, y: 0 };
                  const visualType = traceNodeVisualType(node);
                  const selected = selectedNode?.id === node.id;
                  const size = traceNodeSize(node);
                  const title = node.simple_label || node.label;
                  const value = node.simple_value || formatTraceValue(node);
                  const badge = node.simple_badge || TRACE_TYPE_LABELS[visualType] || visualType;
                  const isFinal = node.id === "total_final";
                  const badgeWidth = Math.min(210, Math.max(78, String(badge).length * 7 + 28));
                  return (
                    <g key={node.id} data-testid={`trace-node-${node.id}`} className={`trace-node ${visualType} ${node.simple_weight || ""} ${selected ? "selected" : ""}`} transform={`translate(${pos.x} ${pos.y})`} onClick={() => setSelectedTraceNodeId(node.id)} tabIndex="0" role="button" aria-label={`Nodo ${node.label}`}>
                      <rect className="trace-node-rect" width={size.width} height={size.height} rx={isFinal ? "28" : "22"} />
                      <text className="trace-node-title" x="22" y={isFinal ? "44" : "40"}>{title}</text>
                      <text className="trace-node-value" x="22" y={isFinal ? "84" : "78"}>{value}</text>
                      <g className="trace-node-badge" transform={`translate(22 ${isFinal ? 108 : 98})`}>
                        <rect width={badgeWidth} height="24" rx="12" />
                        <text x="14" y="16">{badge}</text>
                      </g>
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
              <>
                <div className="trace-detail-hero">
                  <span>{TRACE_TYPE_LABELS[traceNodeVisualType(selectedNode)] || selectedNode.type}</span>
                  <strong>{selectedNode.label}</strong>
                  <p><b>Qué es:</b> {selectedNode.description || "Nodo de la cadena causal del precio."}</p>
                </div>
                <div className="trace-detail-grid">
                  <div><strong>Valor</strong><span>{formatTraceValue(selectedNode)}</span></div>
                  <div><strong>Por qué aparece</strong><span>{selectedNode.context_badge || selectedNode.operation || "Forma parte del camino del precio actual."}</span></div>
                  <div><strong>Afecta esta cotización</strong><span>{selectedNode.impacta_hoy ? (selectedFixedPdf ? "Base técnica / preview" : "Sí, en el cálculo actual") : "No directamente"}</span></div>
                  <div><strong>Se puede modificar</strong><span>{selectedIsEditable ? "Sí, con preview y backup" : "No desde este nodo"}</span></div>
                  <div><strong>Si se modifica</strong><span>{selectedIsEditable ? (selectedFixedPdf ? "Cambia trazabilidad o preview; el precio final sigue PDF/lista." : "Cambia el cálculo previsualizado antes de guardar.") : "No aplica."}</span></div>
                  <div><strong>Fuente</strong><span>{selectedNode.source || selectedVariable?.source_file || "-"}</span></div>
                </div>
                <details className="trace-technical-detail">
                  <summary>Ver detalle técnico</summary>
                  <div className="trace-detail-grid">
                    <div><strong>Clave técnica</strong><span>{selectedVariableKey || selectedNode.id}</span></div>
                    <div><strong>Tipo variable</strong><span>{selectedVariable?.tipo || selectedNode.variable_type || selectedNode.type || "-"}</span></div>
                    <div><strong>Operación</strong><span>{selectedNode.operation || "-"}</span></div>
                    <div><strong>Observación</strong><span>{selectedNode.observation || selectedNode.editable_reason || "-"}</span></div>
                  </div>
                </details>
                <div className={selectedIsEditable ? "trace-action-box editable" : "trace-action-box"}>
                  {selectedIsEditable ? (
                    <>
                      <strong>Este nodo se puede operar</strong>
                      <p>{selectedFixedPdf ? "La variable cambia base técnica o preview; el precio final actual sigue validado por matriz PDF/lista." : "La variable participa en el cálculo actual y puede previsualizarse antes de guardar."}</p>
                      <button type="button" className="calculate-btn compact-calculate-btn" data-testid="trace-modify-variable-button" onClick={() => handleTraceModifyVariable(selectedVariableKey)}>
                        Modificar esta variable
                      </button>
                    </>
                  ) : (
                    <>
                      <strong>No editable desde aquí</strong>
                      <p>{selectedNode.editable_reason || "Este nodo representa una tabla PDF fija, derivación, regla interna, dato documentado o resultado calculado."}</p>
                    </>
                  )}
                </div>
              </>
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
                <span>{formatHistoryValue(item.valor_anterior)} ? {formatHistoryValue(item.valor_nuevo)}</span>
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
      currentQuote={{
        payload: lastPayload,
        result,
        productKey: getQuoteProductKey(lastPayload),
        productLabel: lastPayload ? getQuoteProductLabel(lastPayload, impactData) : "",
      }}
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
      if (!selected) return "Elegí una variable para continuar.";
      if (String(adminNewValue).trim() === "") return "Ingresá un nuevo valor.";
      if (!Number.isFinite(numericValue)) return "El valor debe ser numérico.";
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
    const currentProductKey = result && lastPayload ? getQuoteProductKey(lastPayload) : null;
    const currentProductLabel = result && lastPayload ? getQuoteProductLabel(lastPayload, impactData) : "";
    const impactRelations = impactData?.relaciones || [];
    const relevantRelations = currentProductKey
      ? impactRelations
        .filter((relation) => (
          relation.producto_key === currentProductKey &&
          relation.impacta_hoy &&
          relation.editable &&
          relationAppliesToCurrentQuote(relation, lastPayload, result)
        ))
      : [];
    const relevantVariableKeys = new Set(
      currentProductKey
        ? relevantRelations.map((relation) => relation.variable)
        : []
    );
    const productVariableKeys = new Set(
      currentProductKey
        ? impactRelations
          .filter((relation) => relation.producto_key === currentProductKey && relation.editable)
          .map((relation) => relation.variable)
        : []
    );
    const relationByVariable = new Map();
    if (currentProductKey) {
      relevantRelations.forEach((relation) => relationByVariable.set(relation.variable, relation));
    }
    const hasCurrentQuoteContext = Boolean(currentProductKey && result && lastPayload);
    const contextualVariables = hasCurrentQuoteContext
      ? variables.filter((item) => relevantVariableKeys.has(item.key))
      : variables;
    const sameProductOtherCaseVariables = hasCurrentQuoteContext
      ? variables.filter((item) => productVariableKeys.has(item.key) && !relevantVariableKeys.has(item.key))
      : [];
    const otherSystemVariables = hasCurrentQuoteContext
      ? variables.filter((item) => !productVariableKeys.has(item.key) && !relevantVariableKeys.has(item.key))
      : [];
    const renderCurrentPriceChain = () => {
      if (!hasCurrentQuoteContext) {
        return (
          <section className="price-chain-card neutral" data-testid="current-price-chain">
            <div className="price-chain-head">
              <div>
                <span>Cadena del precio actual</span>
                <h4>Calculá un precio para ver la cadena de origen.</h4>
              </div>
            </div>
          </section>
        );
      }
      const sourceKind = inferPriceSourceKind(result);
      const total = result.total_con_urgencia ?? result.total_sin_iva ?? result.precio_con_recargo_urgencia ?? result.precio_sin_iva;
      const unit = result.precio_unitario_con_urgencia ?? result.precio_unitario_sin_iva ?? result.precio_sin_iva;
      const rangeOrQuantity = result.cantidad_rango_aplicado ?? result.rango_aplicado ?? lastPayload?.cantidad_rango ?? result.cantidad_unidades ?? lastPayload?.cantidad_unidades ?? "No disponible";
      const additions = collectCurrentQuoteAdditions(lastPayload, result);
      const chips = [
        ["Formato", lastPayload?.formato || lastPayload?.formato_agendas],
        ["Cantidad", result.cantidad_unidades ?? lastPayload?.cantidad_unidades],
        ["Impresión", lastPayload?.caras || lastPayload?.caras_tarjetas_troq_circ],
        ["Material", describeCurrentQuoteMaterial(lastPayload)],
        ["Terminación", describeQuoteTerminacion(lastPayload)],
        ["Adicional operativo", describeQuoteOperationalAdditions(lastPayload, result)],
      ].filter(([, value]) => value !== undefined && value !== null && value !== "" && value !== "No aplica");
      const compositionSteps = [
        { label: "Entrada del caso", value: currentProductLabel, type: "entrada" },
        { label: "Formato / cantidad", value: `${lastPayload?.formato || lastPayload?.formato_agendas || "-"} · ${rangeOrQuantity}`, type: "scope" },
        { label: "Material e impresión", value: `${describeCurrentQuoteMaterial(lastPayload)} · ${lastPayload?.caras || lastPayload?.caras_tarjetas_troq_circ || "-"}`, type: "base" },
        { label: "Terminación / adicional", value: `${describeQuoteTerminacion(lastPayload)} · ${describeQuoteOperationalAdditions(lastPayload, result)}`, type: "addition" },
        { label: "Fuente / calibración", value: sourceKindLabel(sourceKind), type: "source" },
        { label: "Total final", value: formatMoney(total), type: "final" },
      ];

      return (
        <section className="price-chain-card" data-testid="current-price-chain">
          <div className="price-chain-head">
            <div>
              <span>Cadena del precio actual</span>
              <h4>{currentProductLabel}</h4>
              <p>{sourceKindExplanation(sourceKind)}</p>
            </div>
            <em>{sourceKindLabel(sourceKind)}</em>
          </div>
          <div className="price-chain-grid">
            <div><span>Precio final actual</span><strong>{formatMoney(total)}</strong></div>
            <div><span>Precio unitario</span><strong>{formatMoney(unit)}</strong></div>
            <div><span>Fuente principal</span><strong>{result.fuente || result.trazabilidad?.fuente_precio_final || "No disponible"}</strong></div>
            <div><span>Regla aplicada</span><strong>{result.regla_aplicada || result.trazabilidad?.modo_calculo || "No disponible"}</strong></div>
            <div><span>Rango / cantidad</span><strong>{rangeOrQuantity}</strong></div>
            <div><span>Urgencia</span><strong>{lastPayload?.urgencia || "normal"}</strong></div>
          </div>
          <div className="price-chain-chips" aria-label="Parámetros usados">
            {chips.map(([label, value]) => <span key={label}><strong>{label}:</strong> {value}</span>)}
            {additions.map((item) => <span key={`${item.label}-${item.source}`}><strong>{item.label}:</strong> {formatMoney(Number(item.value) || 0)}</span>)}
          </div>
          <div className="price-composition-flow" data-testid="current-price-composition">
            <strong>Cómo se compone</strong>
            <div className="price-composition-steps">
              {compositionSteps.map((step, index) => (
                <div className={`price-composition-step ${step.type}`} key={`${step.label}-${index}`}>
                  <span>{index + 1}</span>
                  <div>
                    <em>{step.label}</em>
                    <strong>{step.value}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="price-chain-vars">
            <strong>Variables relacionadas</strong>
            {contextualVariables.length ? (
              <div>
                {contextualVariables.slice(0, 8).map((item) => <span key={item.key}>{item.label}</span>)}
              </div>
            ) : (
              <p>No hay variables editables específicas detectadas para esta cotización.</p>
            )}
          </div>
        </section>
      );
    };

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

    const renderVariableButton = (item, { affectsCurrentQuote }) => {
      const relation = relationByVariable.get(item.key);
      const showTechnicalCopy = !hasCurrentQuoteContext || adminShowAdvancedVariables;
      return (
        <button
          type="button"
          key={item.key}
          className={adminVariable === item.key ? "admin-variable-item active" : "admin-variable-item"}
          onClick={() => selectAdminVariable(item)}
          data-testid={`admin-variable-${item.key}`}
        >
          <div className="admin-variable-title-row">
            <strong>{item.label}</strong>
            {hasCurrentQuoteContext ? (
              <em className={affectsCurrentQuote ? "context-badge affects" : "context-badge neutral"}>
                {affectsCurrentQuote ? "Afecta esta cotización" : "No afecta esta cotización"}
              </em>
            ) : null}
          </div>
          {showTechnicalCopy ? <span>{item.key}</span> : null}
          {showTechnicalCopy ? <small>{item.description}</small> : null}
          {relation ? <small className="admin-context-note">{relation.detalle}</small> : null}
          <div className="admin-variable-meta">
            <em>{item.value} {item.unit || ""}</em>
            {relation ? <em className="admin-scope-badge">{relationContextBadge(relation)}</em> : null}
            {showTechnicalCopy && isSimpleMode ? <em>{(item.productos_afectados || []).length} productos</em> : null}
            {showTechnicalCopy ? <em>{item.impacta_hoy ? "Impacta hoy" : "Preparada"}</em> : null}
            {showTechnicalCopy ? <em>{item.editable ? "Editable" : "Solo lectura"}</em> : null}
          </div>
          {hasCurrentQuoteContext && relation ? (
            <span
              role="button"
              tabIndex={0}
              className="admin-variable-trace-link"
              data-testid={`admin-variable-trace-${item.key}`}
              onClick={(event) => {
                event.stopPropagation();
                handleOpenVariableInTrace(item.key);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  handleOpenVariableInTrace(item.key);
                }
              }}
            >
              Ver origen en trazabilidad
            </span>
          ) : null}
        </button>
      );
    };

    const renderVariableList = () => (
      <div className="admin-wizard-panel" data-testid="admin-variable-list">
        <div className="admin-wizard-panel-head">
          <span>Paso 1</span>
          <h4>Elegí qué variable querés modificar</h4>
          <p>
            {hasCurrentQuoteContext
              ? `Contexto actual: ${currentProductLabel}. Primero te mostramos las variables conectadas a esa cotización.`
              : "No hay una cotización activa. Se muestran todas las variables editables del sistema."}
          </p>
        </div>

        {hasCurrentQuoteContext ? (
          <div className="admin-context-banner" data-testid="admin-current-quote-context">
            <strong>{currentProductLabel}</strong>
            <span>{describeCurrentQuoteMaterial(lastPayload)} · {lastPayload?.formato || "-"} · {lastPayload?.caras || "-"} · {lastPayload?.cantidad_unidades || "-"} u.</span>
          </div>
        ) : null}

        {hasCurrentQuoteContext ? (
          <div className="admin-relevance-toolbar" data-testid="admin-relevance-toolbar">
            <div>
              <strong>{adminShowAdvancedVariables ? "Modo avanzado de variables" : "Modo simple de variables"}</strong>
              <span>
                {adminShowAdvancedVariables
                  ? "Mostrando variables del producto y del sistema que no afectan esta cotización actual."
                  : "Solo se muestran variables conectadas a esta cotización."}
              </span>
            </div>
            <button
              type="button"
              className="secondary-btn"
              data-testid="admin-toggle-advanced-variables"
              aria-pressed={adminShowAdvancedVariables ? "true" : "false"}
              onClick={() => setAdminShowAdvancedVariables((current) => !current)}
            >
              {adminShowAdvancedVariables ? "Ocultar variables avanzadas" : "Mostrar variables avanzadas"}
            </button>
          </div>
        ) : null}

        <div className="admin-variable-section" data-testid="admin-relevant-variable-group">
          <div className="admin-variable-section-head">
            <h5>{hasCurrentQuoteContext ? "Variables que afectan esta cotización" : "Variables editables del sistema"}</h5>
            <p>
              {hasCurrentQuoteContext
                ? "Se muestran variables específicas del caso cotizado y variables base/globales que participan en el cálculo o trazabilidad."
                : "Listado global completo porque todavía no hay una cotización calculada."}
            </p>
          </div>
          {contextualVariables.length ? (
            <div className="admin-variable-list wizard-list">
              {contextualVariables.map((item) => renderVariableButton(item, { affectsCurrentQuote: hasCurrentQuoteContext }))}
            </div>
          ) : (
            <div className="info-box" data-testid="admin-no-contextual-variables">
              No hay variables editables específicas detectadas para esta cotización. Podés revisar otras variables del sistema en modo avanzado.
            </div>
          )}
        </div>

        {hasCurrentQuoteContext && adminShowAdvancedVariables ? (
          <details className="admin-variable-section secondary" data-testid="admin-other-variable-group">
            <summary>
              <span>
                <strong>Otras variables editables de este producto</strong>
                <small>Mismo producto, pero otro formato, rango, terminación o condición comercial.</small>
              </span>
              <em>{sameProductOtherCaseVariables.length} variables</em>
            </summary>
            <div className="admin-variable-list wizard-list">
              {sameProductOtherCaseVariables.length
                ? sameProductOtherCaseVariables.map((item) => renderVariableButton(item, { affectsCurrentQuote: false }))
                : <div className="placeholder"><p>No hay otras variables de este producto fuera del caso actual.</p></div>}
            </div>
          </details>
        ) : null}

        {hasCurrentQuoteContext && adminShowAdvancedVariables ? (
          <details className="admin-variable-section secondary" data-testid="admin-system-variable-group">
            <summary>
              <span>
                <strong>Otras variables editables del sistema</strong>
                <small>Variables de otros productos. No afectan esta cotización actual.</small>
              </span>
              <em>{otherSystemVariables.length} variables</em>
            </summary>
            <div className="admin-variable-list wizard-list">
              {otherSystemVariables.length
                ? otherSystemVariables.map((item) => renderVariableButton(item, { affectsCurrentQuote: false }))
                : <div className="placeholder"><p>No hay otras variables del sistema para esta selección.</p></div>}
            </div>
          </details>
        ) : null}
      </div>
    );

    const renderImpactStep = () => (
      <div className="admin-wizard-panel" data-testid="admin-impact-step">
        <div className="admin-wizard-panel-head">
          <span>Paso 2</span>
          <h4>Revisá el impacto actual</h4>
          <p>{isSimpleMode ? "Antes de cambiar un número, revisá qué productos se podrían afectar." : "Antes de cambiar un número, mirá dónde interviene esta variable y qué partes están protegidas por tabla fija PDF."}</p>
        </div>
        <div className="admin-editor-head">
          <div>
            <span>Variable seleccionada</span>
            <strong>{selected?.label || adminVariable}</strong>
            {isAdvancedMode ? <small>Clave técnica: {selected?.key || adminVariable}</small> : null}
          </div>
          {isAdvancedMode ? <em>{selected?.impacta_hoy ? "Impacta hoy" : "Preparada"}</em> : null}
        </div>
        {hasCurrentQuoteContext && selected ? (
          <div className="admin-origin-actions">
            <button type="button" className="secondary-btn" data-testid="admin-open-trace-origin" onClick={() => handleOpenVariableInTrace(selected.key)}>
              Ver origen en trazabilidad
            </button>
            <span>Abre la cotización actual y selecciona el nodo de esta variable si participa en la cadena.</span>
          </div>
        ) : null}
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
            : "Los precios finales fijos PDF y factores calibrados no se editan directamente desde acá. Si una tabla está protegida, el preview lo informa antes de guardar."}
        </div>
        {renderStepActions({ back: 1, next: 3 })}
      </div>
    );

    const renderValueStep = () => (
      <div className="admin-wizard-panel" data-testid="admin-new-value-step">
        <div className="admin-wizard-panel-head">
          <span>Paso 3</span>
          <h4>Ingresá el nuevo valor</h4>
          <p>El sistema valida que sea numérico, permitido, distinto al valor actual y dentro de rango.</p>
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
        {valueValidation ? <div className="error-box" data-testid="admin-value-validation">{valueValidation}</div> : <div className="info-box">Valor válido para previsualizar.</div>}
        {renderStepActions({ back: 2, next: 4, nextDisabled: Boolean(valueValidation) })}
      </div>
    );

    const renderPreviewStep = () => (
      <div className="admin-wizard-panel" data-testid="admin-preview-step">
        <div className="admin-wizard-panel-head">
          <span>Paso 4</span>
          <h4>Previsualizá el impacto</h4>
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
        {adminPreview ? renderPreviewPanel() : <div className="placeholder"><p>Generá un preview para habilitar la confirmación.</p></div>}
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
                  <span>Después: {example.despues == null ? "-" : formatMoney(example.despues)}</span>
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
          <h4>Confirmá y guardá</h4>
          <p>Este cambio modifica una variable operativa. Revisá el impacto antes de guardar.</p>
        </div>
        <div className="warning-box" data-testid="admin-confirmation-copy">
          Vas a cambiar {selected?.label || adminVariable} de {selected?.value ?? adminPreview?.valor_actual ?? "-"} a {adminNewValue}. Se creará backup e historial. ¿Confirmás?
        </div>
        {adminPreview ? renderPreviewPanel() : <div className="placeholder"><p>Primero generá un preview válido para este valor.</p></div>}
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
        renderCurrentPriceChain={renderCurrentPriceChain}
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
                        <span>{item.valor_actual} ? {item.valor_excel}</span>
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
              <label>
                <span>Tipo de autoadhesivo</span>
                <select data-testid="autoadh-tipo-select" value={form.columna_precio} onChange={updateField("columna_precio")}>
                  {AUTOADH_COLUMNAS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
                <small className="range-hint">Campo propio de Autoadhesivas; no edita la variable obra_90g de Stickers Circulares.</small>
              </label>
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
                  <div><strong>Terminación / adicionales</strong><span>{[describeQuoteTerminacion(lastPayload), describeQuoteOperationalAdditions(lastPayload, result)].filter((item, index, arr) => item && item !== "No aplica" && arr.indexOf(item) === index).join(" · ") || "Sin adicional"}</span></div>
                  <div><strong>Total final</strong><span>{formatMoney(result.total_con_urgencia ?? result.total_sin_iva)}</span></div>
                </div>
                <p>Activá modo avanzado para ver reglas, fuentes, payload y trazabilidad técnica.</p>
              </div>
            ) : (
              <div className="detail-list advanced-detail" data-testid="quote-advanced-details">
                <div><strong>Precio base unitario</strong><span>{formatMoney(result.precio_unitario_base_sin_iva ?? result.precio_unitario_sin_iva ?? result.precio_sin_iva)}</span></div>
                <div><strong>Terminación del producto</strong><span>{describeQuoteTerminacion(lastPayload)}</span></div>
                <div><strong>Adicional operativo</strong><span>{describeQuoteOperationalAdditions(lastPayload, result)}</span></div>
                {isBajadasFlow && !isAutoadhesivas ? <div><strong>Caras adicional laminado/laca</strong><span>{result.caras_adicional_laminado ?? 1}</span></div> : null}
                {isBajadasFlow && !isAutoadhesivas ? <div><strong>Laminado por lado</strong><span>{result.adicional_laminado_por_lado && result.adicional_laminado_por_lado !== "sin_adicional" ? result.adicional_laminado_por_lado : "No aplica"}</span></div> : null}
                {isBajadasFlow && !isAutoadhesivas ? <div><strong>Plastificado</strong><span>{result.adicional_plastificado ? "sí" : "No aplica"}</span></div> : null}
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










