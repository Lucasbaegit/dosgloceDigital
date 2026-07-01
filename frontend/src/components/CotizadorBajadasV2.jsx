import { useEffect, useMemo, useState } from "react";
import EntenderPrecioPanel from "./cotizador/EntenderPrecioPanel";
import NavigationTabs from "./cotizador/NavigationTabs";
import ResultadoCotizacion from "./cotizador/ResultadoCotizacion";
import ViewModeToggle from "./cotizador/ViewModeToggle";
import AdminPricesTab from "./tabs/AdminPricesTab";
import FamilyPriceAdjustTab from "./tabs/FamilyPriceAdjustTab";
import MaestrosCostosTab from "./tabs/MaestrosCostosTab";
import TraceVisualTab from "./tabs/TraceVisualTab";
import VariableImpactTab from "./tabs/VariableImpactTab";
import ConfigTab from "./tabs/ConfigTab";
import HistoryBackupsTab from "./tabs/HistoryBackupsTab";
import ExportSupportTab from "./tabs/ExportSupportTab";
import PrincipalVariablesTab from "./tabs/PrincipalVariablesTab";
import useConfigManager from "../hooks/useConfigManager";
import useAdminPrices from "../hooks/useAdminPrices";
import useTraceGraph from "../hooks/useTraceGraph";
import useImpactMap from "../hooks/useImpactMap";
import useCotizacionForm from "../hooks/useCotizacionForm";
import useCotizacionSubmit from "../hooks/useCotizacionSubmit";
import {
  buildCurrentQuoteTraceGraph,
  clampTraceZoom,
  readableTraceText,
} from "../lib/traceGraphEngine";
import {
  collectCurrentQuoteAdditions,
  describeCurrentQuoteMaterial,
  describeQuoteOperationalAdditions,
  describeQuoteTerminacion,
  formatMoney,
  inferPriceSourceKind,
  inferQuoteContext,
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
    setExcelImportPreview,
    excelImportLoading,
    excelImportError,
    setExcelImportError,
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
    familyBulkPercent,
    setFamilyBulkPercent,
    getFamilyPriceRows,
    setFamilyAdjustment,
    previewFamilyAdjustment,
    applyFamilyAdjustment,
    applyFamilyAdjustmentToAll,
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
          <div className="placeholder"><p>Completá los datos y presionÃ¡ Calcular.</p></div>
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
          <details open><summary>Adicional Troquelado Digital</summary><ul><li>selección: {result.adicional_troquelado ? "sí" : "no"}</li><li>complejidad: {result.complejidad_troquelado ?? "-"}</li><li>precio_unitario_troquelado: {formatMoney(result.adicional_troquelado_unitario_sin_iva ?? 0)}</li><li>subtotal_troquelado: {formatMoney(result.total_adicional_troquelado_sin_iva ?? 0)}</li><li>rango_aplicado: {result.trazabilidad?.adicional_troquelado?.rango_aplicado ?? "-"}</li><li>regla_aplicada: {result.regla_troquelado_aplicada ?? "-"}</li><li>fuente: {result.fuente_troquelado ?? "-"}</li><li>nota: No incluye costo de impresiÃ³n; se suma como adicional.</li></ul></details>
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

  const renderTraceVisualTab = () => (
    <TraceVisualTab
      traceGraph={traceGraph}
      traceShowTechnicalGraph={traceShowTechnicalGraph}
      selectedTraceNodeId={selectedTraceNodeId}
      traceCase={traceCase}
      traceMode={traceMode}
      getAdminVariableByKey={getAdminVariableByKey}
      lastPayload={lastPayload}
      result={result}
      TRACE_GRAPH_CASES={TRACE_GRAPH_CASES}
      TRACE_MODES={TRACE_MODES}
      TRACE_TYPE_LABELS={TRACE_TYPE_LABELS}
      TRACE_ZOOM_STEP={TRACE_ZOOM_STEP}
      setTraceMode={setTraceMode}
      setTraceCase={setTraceCase}
      setTraceGraph={setTraceGraph}
      setSelectedTraceNodeId={setSelectedTraceNodeId}
      setTraceZoom={setTraceZoom}
      setTraceShowTechnicalGraph={setTraceShowTechnicalGraph}
      setTraceError={setTraceError}
      handleLoadCurrentQuoteGraph={handleLoadCurrentQuoteGraph}
      traceLoading={traceLoading}
      loadTraceGraph={loadTraceGraph}
      traceError={traceError}
      traceZoom={traceZoom}
      setTraceZoomLevel={setTraceZoomLevel}
      resetTraceView={resetTraceView}
      fitTraceGraphToView={fitTraceGraphToView}
      traceFullscreen={traceFullscreen}
      setTraceFullscreen={setTraceFullscreen}
      traceGraphViewportRef={traceGraphViewportRef}
      handleTraceWheel={handleTraceWheel}
      handleTracePanStart={handleTracePanStart}
      handleTracePanMove={handleTracePanMove}
      stopTracePan={stopTracePan}
      handleTraceModifyVariable={handleTraceModifyVariable}
    />
  );

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
        <p className="range-hint">El botón Restaurar queda deshabilitado hasta tener un preview vÃ¡lido.</p>
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
              <p className="range-hint">{item.descripcion || `${item.fuente || "sistema"} Â· ${historyId}`}</p>
              {isAdvancedMode ? (
                <div className="history-event-meta" data-testid="history-advanced-meta">
                  <span>Fuente: {item.fuente || "sistema"}</span>
                  <span>Backup: {(item.backup || []).length ? item.backup.join(", ") : "-"}</span>
                  <span>ID: {historyId}</span>
                  {isRollback ? <span>Rollback de: {item.rollback_de || "-"}</span> : null}
                </div>
              ) : (
                <div className="history-event-meta simple-history-meta">
                  <span>Estado: {isRollback ? "RestauraciÃ³n registrada" : "Restaurable con preview"}</span>
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
    <HistoryBackupsTab
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
    <ExportSupportTab
      isSimpleMode={isSimpleMode}
      principalMsg={principalMsg}
      downloadPricesExcel={downloadPricesExcel}
      downloadPricesPdf={downloadPricesPdf}
    />
  );

  const renderAdvancedConfigTab = () => (
    <ConfigTab
      isSimpleMode={isSimpleMode}
      isAdvancedMode={isAdvancedMode}
      setViewMode={setViewMode}
      renderPrincipalVariablesTab={renderPrincipalVariablesTab}
      cfg={cfg}
      cfgMsg={cfgMsg}
      cfgActiveVersion={cfgActiveVersion}
      cfgCandidates={cfgCandidates}
      createCandidate={createCandidate}
      approveCandidate={approveCandidate}
      promoteCandidate={promoteCandidate}
      rejectCandidate={rejectCandidate}
      cfgBackups={cfgBackups}
      showBackupDetail={showBackupDetail}
      previewRestoreBackup={previewRestoreBackup}
      simulateBackupQuote={simulateBackupQuote}
      restoreBackup={restoreBackup}
      cfgBackupDetail={cfgBackupDetail}
      cfgBackupPreview={cfgBackupPreview}
      cfgBackupSimulation={cfgBackupSimulation}
      cfgDiff={cfgDiff}
      updateCfgField={updateCfgField}
      saveCfgField={saveCfgField}
      setCfg={setCfg}
      saveScales={saveScales}
      restoreCfg={restoreCfg}
      runValidateConfig={runValidateConfig}
      runSimulation={runSimulation}
      cfgValidation={cfgValidation}
      cfgSimulation={cfgSimulation}
      cfgHistory={cfgHistory}
      formatMoney={formatMoney}
    />
  );

  const renderVariableImpactTab = () => (
    <VariableImpactTab
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
      lastPayload={lastPayload}
      result={result}
    />
  );
  const renderAdminPricesTab = () => (
    <AdminPricesTab
      adminPrices={adminPrices}
      adminVariable={adminVariable}
      adminNewValue={adminNewValue}
      adminPreview={adminPreview}
      adminLoading={adminLoading}
      setAdminWizardStep={setAdminWizardStep}
      setAdminVariable={setAdminVariable}
      setAdminNewValue={setAdminNewValue}
      setAdminPreview={setAdminPreview}
      setAdminMsg={setAdminMsg}
      setAdminError={setAdminError}
      result={result}
      lastPayload={lastPayload}
      impactData={impactData}
      adminWizardStep={adminWizardStep}
      adminShowAdvancedVariables={adminShowAdvancedVariables}
      setAdminShowAdvancedVariables={setAdminShowAdvancedVariables}
      isSimpleMode={isSimpleMode}
      isAdvancedMode={isAdvancedMode}
      handleOpenVariableInTrace={handleOpenVariableInTrace}
      handleAdminPreview={handleAdminPreview}
      handleAdminApply={handleAdminApply}
      renderAdminHistoryEntries={renderAdminHistoryEntries}
      renderRollbackPreviewPanel={renderRollbackPreviewPanel}
      adminError={adminError}
      adminMsg={adminMsg}
      ADMIN_PRICE_STEPS={ADMIN_PRICE_STEPS}
    />
  );
  const renderFamilyPriceAdjustTab = () => (
    <FamilyPriceAdjustTab
      adminLoading={adminLoading}
      adminMsg={adminMsg}
      adminError={adminError}
      getFamilyPriceRows={getFamilyPriceRows}
      setFamilyAdjustment={setFamilyAdjustment}
      familyBulkPercent={familyBulkPercent}
      setFamilyBulkPercent={setFamilyBulkPercent}
      previewFamilyAdjustment={previewFamilyAdjustment}
      applyFamilyAdjustment={applyFamilyAdjustment}
      applyFamilyAdjustmentToAll={applyFamilyAdjustmentToAll}
    />
  );
  const renderMaestrosCostosTab = () => <MaestrosCostosTab />;
  const renderPrincipalVariablesTab = () => (
    <PrincipalVariablesTab
      principalVariables={principalVariables}
      principalDraft={principalDraft}
      setPrincipalDraft={setPrincipalDraft}
      setImpactMode={setImpactMode}
      setImpactVariable={setImpactVariable}
      setActiveTab={setActiveTab}
      principalMsg={principalMsg}
      savePrincipalVariables={savePrincipalVariables}
      loadPrincipalVariables={loadPrincipalVariables}
      downloadPricesPdf={downloadPricesPdf}
      downloadPricesExcel={downloadPricesExcel}
      excelImportPreview={excelImportPreview}
      excelImportLoading={excelImportLoading}
      excelImportError={excelImportError}
      setExcelImportFile={setExcelImportFile}
      setExcelImportPreview={setExcelImportPreview}
      setExcelImportError={setExcelImportError}
      previewExcelImport={previewExcelImport}
      principalRanges={principalRanges}
      principalAudit={principalAudit}
    />
  );

  const renderCotizador = () => (
    <div className="cotizador-layout" data-testid="cotizador-layout">
      <form className="card form-card compact-card" onSubmit={handleSubmit}>
        <div className="card-head"><h3>1. Configura tu impresiÃ³n</h3><span>Enter = calcular</span></div>
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
              <label><span>Ãrea imprimible</span><input value="30x46 cm" readOnly /></label>
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
                <option value="true">SÃ­</option>
              </select>
            </label>
          ) : null}
          {isBajadasFlow ? (
            <label>
              <span>Troquelado Digital</span>
              <select value={String(Boolean(form.adicional_troquelado))} onChange={(event) => setForm((prev) => ({ ...prev, adicional_troquelado: event.target.value === "true" }))}>
                <option value="false">No</option>
                <option value="true">SÃ­</option>
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
        {isTarjetas || isPostales || isFolletos || isStickers || isImanes || isStickersCirculares || isTarjetasTroqCirc ? <div className="info-box compact-note">Este producto usa precio total por paquete/cantidad segÃºn PDF vigente.</div> : <div className="info-box compact-note">Laca / laminado se suma antes de urgencia. Troquelado digital también se suma como adicional y no incluye costo de impresiÃ³n.</div>}
        {error ? <div className="error-box">{error}</div> : null}
        {copyStatus ? <div className="info-box" data-testid="copy-status">{copyStatus}</div> : null}
        <div className="actions-row compact-actions">
          <button type="submit" className="calculate-btn compact-calculate-btn" disabled={loading}>{loading ? "Calculando..." : "Calcular"}</button>
          <button type="button" className="secondary-btn" data-testid="copy-result-button" onClick={handleCopy} disabled={!result}>Copiar</button>
          <button type="button" className="secondary-btn compact-clear-btn" data-testid="clear-button" onClick={handleClear}>Limpiar</button>
        </div>
      </form>

      <ResultadoCotizacion
        result={result}
        form={form}
        inferred={inferred}
        loading={loading}
        lastPayload={lastPayload}
        derivedRange={derivedRange}
        isSimpleMode={isSimpleMode}
        isMatrixProduct={isMatrixProduct}
        isBajadasFlow={isBajadasFlow}
        isAutoadhesivas={isAutoadhesivas}
      />
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
            <div className="metrics-chip">{metrics ? `OK ${metrics.OK} Â· Alta ${metrics.DIFERENCIA_ALTA}` : "Métricas no disponibles"}</div>
          </div>
        </header>

        <section className="content-grid content-grid-tabs">
          {activeTab === "Cotizar" ? renderCotizador() : null}
          {activeTab === "Modificar precios" ? renderAdminPricesTab() : null}
          {activeTab === "Ajustar Precios por Familia" ? renderFamilyPriceAdjustTab() : null}
          {activeTab === "Maestros de Costos" ? renderMaestrosCostosTab() : null}
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














