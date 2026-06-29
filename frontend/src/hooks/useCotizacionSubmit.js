import { useEffect, useState } from "react";
import {
  fetchBajadasHealth,
  fetchBajadasMetrics,
  fetchPrincipalVariables,
  fetchPrincipalVariablesAudit,
  fetchPrincipalVariablesRanges,
  exportPricesExcel,
  exportPricesPdf,
  previewExcelMaestro,
  updatePrincipalVariables,
} from "../api/bajadasV2Api";
import {
  buildAgendasPayload,
  buildBajadasPayload,
  buildCarpetasPayload,
  buildFolletosPayload,
  buildImanesPayload,
  buildSobresPayload,
  buildStickersPayload,
  buildTarjetasPayload,
  dispatchCotizacion,
} from "../lib/payloadBuilders";

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

export default function useCotizacionSubmit({
  setMetrics,
  getSubmitContext,
  resetTraceForSubmit,
  resetAdminAfterSubmit,
  constants,
}) {
  const {
    FOLLETOS_CANTIDADES,
    IMANES_CANTIDADES,
    PLANCHA_IMAN_CANTIDADES_SUGERIDAS,
    POSTALES_CANTIDADES,
    SOBRES_CANTIDADES,
    STICKERS_CANTIDADES,
    STICKERS_CIRCULARES_CANTIDADES,
    TARJETAS_CANTIDADES,
    TARJETAS_TROQ_CIRC_CANTIDADES,
  } = constants;

  const [result, setResult] = useState(null);
  const [lastPayload, setLastPayload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [apiConnected, setApiConnected] = useState(false);

  const [principalVariables, setPrincipalVariables] = useState(null);
  const [principalDraft, setPrincipalDraft] = useState({});
  const [principalAudit, setPrincipalAudit] = useState(null);
  const [principalRanges, setPrincipalRanges] = useState(null);
  const [principalMsg, setPrincipalMsg] = useState("");
  const [excelImportFile, setExcelImportFile] = useState(null);
  const [excelImportPreview, setExcelImportPreview] = useState(null);
  const [excelImportLoading, setExcelImportLoading] = useState(false);
  const [excelImportError, setExcelImportError] = useState("");

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
      setExcelImportError("SeleccionÃ¡ un archivo .xlsx para previsualizar.");
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
        .map((item) => `${item.key}: ${item.previous_value} ? ${item.new_value}`)
        .join(" Â· ");
      await loadPrincipalVariables();
      setPrincipalMsg(`Variables actualizadas: ${summary}`);
    } catch (err) {
      setPrincipalMsg(err.message || "No se pudieron guardar las variables principales.");
    }
  };

  useEffect(() => {
    fetchBajadasMetrics().then(setMetrics).catch(() => setMetrics(null));
    fetchBajadasHealth()
      .then((res) => setApiConnected(Boolean(res?.status === "ok" && Object.values(res?.checks ?? {}).every(Boolean))))
      .catch(() => setApiConnected(false));
    loadPrincipalVariables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopy = async () => {
    if (!result) {
      setCopyStatus("Primero calculÃ¡ una cotizaciÃ³n.");
      return;
    }
    const finalValue = Number(result.total_con_urgencia ?? result.total_sin_iva ?? 0);
    const text = String(Math.round(finalValue));
    try {
      const copied = await copyToClipboard(text);
      setCopyStatus(copied ? "Precio final copiado." : "No se pudo copiar automÃ¡ticamente.");
    } catch {
      setCopyStatus("No se pudo copiar automÃ¡ticamente.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const {
      form,
      inferred,
      derivedRange,
      cantidadUnidades,
      missingFields,
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
    } = getSubmitContext();

    setError("");
    setResult(null);
    resetTraceForSubmit?.();
    setCopyStatus("");

    if (missingFields.length > 0) {
      setError(`Faltan campos obligatorios: ${missingFields.join(", ")}`);
      return;
    }
    if (!Number.isInteger(cantidadUnidades) || cantidadUnidades < 1) {
      setError("Cantidad invÃ¡lida. IngresÃ¡ un entero mayor o igual a 1.");
      return;
    }
    if (!isMatrixProduct && !isNoRangeProduct && !derivedRange) {
      setError("La cantidad ingresada no entra en ningÃºn rango disponible para esta combinaciÃ³n.");
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
      setError("Plancha de ImÃ¡n Impreso permite cantidades de 1 a 500.");
      return;
    }
    if (isAgendasCuadernos && cantidadUnidades < 2) {
      setError("Agendas / Cuadernos requiere mÃ­nimo 2 unidades.");
      return;
    }
    if (isBajadasFlow && form.adicional_troquelado && !form.complejidad_troquelado) {
      setError("DebÃ©s elegir complejidad de troquelado.");
      return;
    }

    const productKey = isTarjetas
      ? "tarjetas_9x5"
      : isPostales
      ? "tarjetas_postales"
      : isFolletos
      ? "folletos"
      : isCarpetas
      ? "carpetas"
      : isSobres
      ? "sobres"
      : isStickers
      ? "stickers_corte_recto"
      : isImanes
      ? "imanes_corte_recto"
      : isStickersCirculares
      ? "stickers_circulares"
      : isTarjetasTroqCirc
      ? "tarjetas_troqueladas_circulares"
      : isPlanchaIman
      ? "plancha_iman_impreso"
      : isAgendasCuadernos
      ? "agendas_cuadernos"
      : "bajadas";

    const payload = (isTarjetas || isPostales || isTarjetasTroqCirc)
      ? buildTarjetasPayload(form, inferred, derivedRange, cantidadUnidades)
      : isFolletos
      ? buildFolletosPayload(form, inferred, derivedRange, cantidadUnidades)
      : isCarpetas
      ? buildCarpetasPayload(form, inferred, derivedRange, cantidadUnidades)
      : isSobres
      ? buildSobresPayload(form, inferred, derivedRange, cantidadUnidades)
      : (isStickers || isStickersCirculares)
      ? buildStickersPayload(form, inferred, derivedRange, cantidadUnidades)
      : (isImanes || isPlanchaIman)
      ? buildImanesPayload(form, inferred, derivedRange, cantidadUnidades)
      : isAgendasCuadernos
      ? buildAgendasPayload(form, inferred, derivedRange, cantidadUnidades)
      : buildBajadasPayload(form, inferred, derivedRange, cantidadUnidades);
    setLoading(true);
    try {
      const response = await dispatchCotizacion(productKey, payload);
      setResult(response);
      setLastPayload(payload);
      resetAdminAfterSubmit?.();
    } catch (err) {
      if (err.code === "cantidad_fuera_de_matriz") {
        setError("Cantidad fuera de matriz para este producto.");
      } else if (err.code === "cantidad_minima_no_alcanzada") {
        setError("Cantidad mÃ­nima no alcanzada para este producto.");
      } else if (err.code === "terminacion_no_soportada") {
        setError("TerminaciÃ³n no soportada.");
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
        setError("Tinta blanca bloqueada: falta valor base de 1 copia para cÃ¡lculo proporcional.");
      } else if (err.code === "adicional_no_soportado_para_liviano") {
        setError("Para papel liviano solo se permite Sin adicional o Laca UV.");
      } else if (err.code === "adicional_no_soportado_para_autoadhesivas") {
        setError("Autoadhesivas no admite laminado por lado ni plastificado.");
      } else if (err.code === "adicionales_hoja4_solo_a3plus_xa3") {
        setError("Laminado por lado y plastificado solo aplican a A3+ o XA3.");
      } else if (err.code === "complejidad_troquelado_requerida") {
        setError("DebÃ©s elegir complejidad de troquelado.");
      } else if (err.code === "complejidad_troquelado_no_soportada") {
        setError("Complejidad de troquelado no soportada.");
      } else if (err.code === "combinacion_no_encontrada") {
        setError("La combinaciÃ³n seleccionada no existe en la tabla de Bajadas v2. RevisÃ¡ formato, papel, gramaje y rango.");
      } else if (err.code === "urgencia_invalida") {
        setError("Urgencia invÃ¡lida. RevisÃ¡ el campo Urgencia.");
      } else if (err.status >= 500) {
        setError("La API respondiÃ³ con error interno.");
      } else if (err.status === 0 || err.message.includes("Failed to fetch")) {
        setError("API caÃ­da o inaccesible en http://127.0.0.1:8000.");
      } else {
        setError(err.message || "No se pudo calcular.");
      }
    } finally {
      setLoading(false);
    }
  };

  return {
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
  };
}
