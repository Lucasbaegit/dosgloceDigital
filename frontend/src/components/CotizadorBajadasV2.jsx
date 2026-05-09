import { useEffect, useMemo, useState } from "react";
import {
  approveBajadasConfigCandidate,
  cotizarBajadaV2,
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
const CATEGORIAS = ["Bajadas Fullcolor/ByN", "Bajadas Autoadhesivas"];
const AUTOADH_COLUMNAS = ["papel", "especial"];
const AUTOADH_RANGOS = ["1", "2 a 25", "26 a 50", "51 a 100", "101 a 300", "301 a 500", "501 a 1000"];
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
      formato: "A3+",
      caras: "4/0",
    };
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

  const validRows = useMemo(
    () =>
      optionRows.filter(
        (r) => r.categoria === inferred.categoria && r.modo_color === inferred.modo_color && r.caras === inferred.caras
      ),
    [inferred]
  );
  const formatoOptions = useMemo(() => uniqueSorted(validRows.map((r) => r.formato)), [validRows]);
  const tipoPapelOptions = useMemo(
    () => uniqueSorted(validRows.filter((r) => r.formato === form.formato).map((r) => r.tipo_papel)),
    [validRows, form.formato]
  );
  const materialOptions = useMemo(
    () => uniqueSorted(validRows.filter((r) => r.formato === form.formato && r.tipo_papel === form.tipo_papel).map((r) => r.material)),
    [validRows, form.formato, form.tipo_papel]
  );
  const gramajeOptions = useMemo(
    () =>
      uniqueSorted(
        validRows
          .filter((r) => r.formato === form.formato && r.tipo_papel === form.tipo_papel && r.material === form.material)
          .map((r) => r.gramaje)
      ),
    [validRows, form.formato, form.tipo_papel, form.material]
  );
  const cantidadOptions = useMemo(() => {
    if (isAutoadhesivas) return AUTOADH_RANGOS;
    return uniqueSorted(
      validRows
        .filter(
          (r) =>
            r.formato === form.formato &&
            r.tipo_papel === form.tipo_papel &&
            r.material === form.material &&
            r.gramaje === form.gramaje
        )
        .map((r) => r.cantidad_rango)
    );
  }, [isAutoadhesivas, validRows, form.formato, form.tipo_papel, form.material, form.gramaje]);
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
        next.formato = "A3+";
        next.caras = "4/0";
        next.tipo_papel = next.columna_precio || "papel";
        next.material = next.columna_precio === "especial" ? "OPP blanco" : "Sticker";
        next.gramaje = next.columna_precio === "especial" ? "N/A" : "N/A";
        return next;
      }
      if (!formatoOptions.includes(next.formato)) next.formato = formatoOptions[0] || "";
      return next;
    });
  }, [formatoOptions]);

  useEffect(() => {
    setForm((prev) => {
      const next = { ...prev };
      if (next.categoria_ui === "Bajadas Autoadhesivas") {
        return next;
      }
      if (!tipoPapelOptions.includes(next.tipo_papel)) next.tipo_papel = tipoPapelOptions[0] || "";
      if (!materialOptions.includes(next.material)) next.material = materialOptions[0] || "";
      if (!gramajeOptions.includes(next.gramaje)) next.gramaje = gramajeOptions[0] || "";
      return next;
    });
  }, [tipoPapelOptions, materialOptions, gramajeOptions]);

  const missingFields = useMemo(() => {
    const required = isAutoadhesivas
      ? ["urgencia", "columna_precio"]
      : ["formato", "tipo_papel", "material", "gramaje", "caras", "urgencia"];
    return required.filter((field) => !String(form[field] ?? "").trim());
  }, [form, isAutoadhesivas]);

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
    setForm((prev) => ({ ...prev, cantidad_unidades: "1", urgencia: "normal", adicional_laminado: "sin_adicional" }));
    setResult(null);
    setLastPayload(null);
    setError("");
    setCopyStatus("");
    setLoading(false);
  };

  const handleCopy = async () => {
    if (!result) return;
    const text = [
      "Cotización Bajadas v2",
      `Formato: ${form.formato}`,
      `Impresión: ${form.caras}`,
      `Papel: ${form.tipo_papel} / ${form.material} / ${form.gramaje}`,
      `Cantidad: ${result.cantidad_unidades ?? form.cantidad_unidades}`,
      `Rango aplicado: ${result.cantidad_rango_aplicado ?? derivedRange ?? "-"}`,
      `Adicional: ${result.adicional_laminado ?? form.adicional_laminado ?? "sin_adicional"}`,
      `Adicional unitario: ${formatMoney(result.adicional_unitario_sin_iva ?? 0)}`,
      `Precio unitario con adicional: ${formatMoney(result.precio_unitario_con_adicional_sin_iva ?? result.precio_unitario_sin_iva ?? result.precio_sin_iva)}`,
      `Total sin IVA: ${formatMoney(result.total_sin_iva ?? result.precio_sin_iva)}`,
      `Total con urgencia: ${formatMoney(result.total_con_urgencia ?? result.precio_con_recargo_urgencia)}`,
    ].join("\n");
    try {
      const copied = await copyToClipboard(text);
      setCopyStatus(copied ? "Resultado copiado." : "No se pudo copiar automáticamente.");
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
    if (!derivedRange) {
      setError("La cantidad ingresada no entra en ningún rango disponible para esta combinación.");
      return;
    }

    const payload = {
      categoria: inferred.categoria,
      modo_color: inferred.modo_color,
      formato: inferred.formato,
      tipo_papel: isAutoadhesivas ? form.columna_precio : form.tipo_papel,
      material: isAutoadhesivas ? (form.columna_precio === "especial" ? "OPP blanco" : "Sticker") : form.material,
      gramaje: isAutoadhesivas ? "N/A" : form.gramaje,
      cantidad_unidades: cantidadUnidades,
      cantidad_rango: derivedRange,
      caras: inferred.caras,
      urgencia: form.urgencia,
      adicional_laminado: form.adicional_laminado || "sin_adicional",
      tipo_producto: isAutoadhesivas ? "autoadhesiva" : undefined,
      columna_precio: isAutoadhesivas ? form.columna_precio : undefined,
    };

    setLoading(true);
    try {
      const response = await cotizarBajadaV2(payload);
      setResult(response);
      setLastPayload(payload);
    } catch (err) {
      if (err.code === "combinacion_no_encontrada") {
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
          <details open><summary>Entrada del usuario</summary><ul><li>Formato: {lastPayload.formato}</li><li>Impresión: {lastPayload.caras}</li><li>Tipo papel: {lastPayload.tipo_papel}</li><li>Tipo autoadhesivo: {lastPayload.columna_precio ?? "-"}</li><li>Material: {lastPayload.material}</li><li>Gramaje: {lastPayload.gramaje}</li><li>Cantidad: {lastPayload.cantidad_unidades}</li><li>Urgencia: {lastPayload.urgencia}</li></ul></details>
          <details open><summary>Rango aplicado</summary><ul><li>{result.cantidad_rango_aplicado}</li></ul></details>
          <details open><summary>Precio unitario</summary><ul><li>Sin IVA: {formatMoney(result.precio_unitario_sin_iva)}</li><li>Con urgencia: {formatMoney(result.precio_unitario_con_urgencia)}</li></ul></details>
          <details open><summary>Adicional laminado/laca</summary><ul><li>selección: {result.adicional_laminado ?? "sin_adicional"}</li><li>adicional_unitario_sin_iva: {formatMoney(result.adicional_unitario_sin_iva ?? 0)}</li><li>regla_adicional_aplicada: {result.regla_adicional_aplicada ?? "-"}</li><li>fuente_adicional: {result.fuente_adicional ?? "-"}</li><li>rango_aplicado: {result.trazabilidad?.adicional_laminado?.rango_aplicado ?? "-"}</li><li>nota: Laca / laminado se suma antes de urgencia.</li><li>no_combinable: true</li></ul></details>
          <details open><summary>Total</summary><ul><li>Sin IVA: {formatMoney(result.total_sin_iva)}</li><li>Con urgencia: {formatMoney(result.total_con_urgencia)}</li></ul></details>
          <details open data-testid="price-tree-rule-section"><summary>Regla</summary><ul><li>regla_aplicada: {result.regla_aplicada}</li><li>fuente: {result.fuente}</li><li>factor_aplicado: {result.trazabilidad?.factor_aplicado ?? "-"}</li><li>regla_especial: {result.trazabilidad?.regla_especial ?? "-"}</li><li>correccion_logica: {result.trazabilidad?.correccion_logica ?? "-"}</li></ul></details>
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
    <>
      <form className="card form-card" onSubmit={handleSubmit}>
        <div className="card-head"><h3>1. Configura tu impresión</h3><span>Enter = calcular</span></div>
        <div className="form-grid">
          <label><span>Categoría</span><select value={form.categoria_ui} onChange={updateField("categoria_ui")}>{CATEGORIAS.map((v) => <option key={v}>{v}</option>)}</select></label>
          {!isAutoadhesivas ? (
            <>
              <label><span>Impresión</span><div className="caras-row">{CARAS.map((cara) => <button key={cara} type="button" className={form.caras === cara ? "pill active" : "pill"} onClick={() => setForm((prev) => ({ ...prev, caras: cara }))}>{cara}</button>)}</div></label>
              <label><span>Categoría (automática)</span><input value={inferred.categoria} readOnly /></label>
              <label><span>Medida / formato</span><select value={form.formato} onChange={updateField("formato")}>{formatoOptions.map((v) => <option key={v}>{v}</option>)}</select></label>
              <label><span>Tipo de papel</span><select value={form.tipo_papel} onChange={updateField("tipo_papel")}>{tipoPapelOptions.map((v) => <option key={v}>{v}</option>)}</select></label>
              <label><span>Material</span><select value={form.material} onChange={updateField("material")}>{materialOptions.map((v) => <option key={v}>{v}</option>)}</select></label>
              <label><span>Gramaje</span><select value={form.gramaje} onChange={updateField("gramaje")}>{gramajeOptions.map((v) => <option key={v}>{v}</option>)}</select></label>
            </>
          ) : (
            <>
              <label><span>Formato</span><input value="A3+" readOnly /></label>
              <label><span>Tipo</span><select value={form.columna_precio} onChange={updateField("columna_precio")}>{AUTOADH_COLUMNAS.map((v) => <option key={v}>{v}</option>)}</select></label>
              <label><span>Modo color</span><input value="fullcolor" readOnly /></label>
              <label><span>Impresión</span><input value="4/0" readOnly /></label>
            </>
          )}
          <label><span>Cantidad</span><input type="number" min={1} step={1} placeholder="Ejemplo: 30" value={form.cantidad_unidades} onChange={updateField("cantidad_unidades")} /><small className="range-hint">Rango aplicado: {derivedRange ?? "Sin rango disponible"}</small></label>
          <label><span>Urgencia</span><select value={form.urgencia} onChange={updateField("urgencia")}>{URGENCIAS.map((v) => <option key={v}>{v}</option>)}</select></label>
          <label><span>Adicional</span><select value={form.adicional_laminado} onChange={updateField("adicional_laminado")}>{ADICIONALES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}</select></label>
        </div>
        {isAutoadhesivas ? <div className="warning-box">Tinta blanca y laca UV no están incluidas en esta etapa.</div> : null}
        <div className="info-box">Laca / laminado se suma antes de urgencia.</div>
        {error ? <div className="error-box">{error}</div> : null}
        {copyStatus ? <div className="info-box" data-testid="copy-status">{copyStatus}</div> : null}
        <div className="actions-row"><button type="submit" className="calculate-btn" disabled={loading}>{loading ? "Calculando..." : "Calcular"}</button><button type="button" className="secondary-btn" data-testid="clear-button" onClick={handleClear}>Limpiar</button></div>
      </form>

      <section className="card result-card">
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
              <div><strong>Adicional unitario sin IVA</strong><span>{formatMoney(result.adicional_unitario_sin_iva ?? 0)}</span></div>
              <div><strong>Precio unitario con adicional</strong><span>{formatMoney(result.precio_unitario_con_adicional_sin_iva ?? result.precio_unitario_sin_iva ?? result.precio_sin_iva)}</span></div>
              <div><strong>Cantidad ingresada</strong><span>{result.cantidad_unidades ?? form.cantidad_unidades}</span></div>
              <div><strong>Rango aplicado</strong><span>{result.cantidad_rango_aplicado ?? derivedRange ?? "-"}</span></div>
              <div><strong>Regla aplicada</strong><span>{result.regla_aplicada}</span></div>
              <div><strong>Fuente</strong><span>{result.fuente}</span></div>
              <div><strong>Regla adicional aplicada</strong><span>{result.regla_adicional_aplicada ?? "-"}</span></div>
              <div><strong>Fuente adicional</strong><span>{result.fuente_adicional ?? "-"}</span></div>
              <div><strong>Recargo aplicado</strong><span>{result.trazabilidad?.recargo_urgencia_aplicado ?? "-"}</span></div>
            </div>
            <div className="copy-row"><button type="button" className="secondary-btn" data-testid="copy-result-button" onClick={handleCopy}>Copiar resultado</button></div>
          </>
        )}
      </section>
    </>
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
