import { useEffect, useState } from "react";
import {
  applyAdminPrecio,
  applyAdminPrecioRollback,
  fetchAdminPreciosHistorial,
  fetchAdminPreciosVariables,
  previewAdminPrecio,
  previewAdminPrecioRollback,
} from "../api/bajadasV2Api";
import {
  getQuoteProductKey,
  relationAppliesToCurrentQuote,
} from "../lib/cotizacionLogic";

const FAMILY_PRICE_VARIABLES = [
  { family: "bajadas", label: "Bajadas", variable: "multiplicador_comercial_bajadas" },
  { family: "carpetas", label: "Carpetas", variable: "multiplicador_comercial_carpetas" },
  { family: "folletos", label: "Folletos", variable: "multiplicador_comercial_folletos" },
  { family: "sobres", label: "Sobres", variable: "multiplicador_comercial_sobres" },
  { family: "agendas", label: "Agendas / Cuadernos", variable: "multiplicador_comercial_agendas" },
  { family: "tarjetas_9x5", label: "Tarjetas 9x5", variable: "multiplicador_comercial_tarjetas_9x5" },
  { family: "tarjetas_postales", label: "Tarjetas Postales", variable: "multiplicador_comercial_tarjetas_postales" },
  { family: "stickers_circulares", label: "Stickers Circulares", variable: "multiplicador_comercial_stickers_circulares" },
  { family: "stickers_corte_recto", label: "Stickers Corte Recto", variable: "multiplicador_comercial_stickers_corte_recto" },
  { family: "imanes_corte_recto", label: "Imanes Corte Recto", variable: "multiplicador_comercial_imanes_corte_recto" },
  { family: "plancha_iman_impreso", label: "Plancha de Iman Impreso", variable: "multiplicador_comercial_plancha_iman" },
];

const formatFamilyPercentInput = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "";
  const percent = (numeric - 1) * 100;
  const fixed = Math.abs(percent) < 0.005 ? "0" : percent.toFixed(2).replace(/\.?0+$/, "");
  return percent > 0 ? `+${fixed}%` : `${fixed}%`;
};

const parseFamilyPercentInput = (rawValue) => {
  const normalized = String(rawValue ?? "")
    .trim()
    .replace("%", "")
    .replace(",", ".");
  if (!normalized) return null;
  const percent = Number(normalized);
  if (!Number.isFinite(percent)) return null;
  return Number((1 + (percent / 100)).toFixed(6));
};

export default function useAdminPrices({
  activeTab,
  lastPayload,
  result,
  impactData,
  setImpactData,
  loadPrincipalVariables,
}) {
  const [adminPrices, setAdminPrices] = useState(null);
  const [adminHistory, setAdminHistory] = useState([]);
  const [adminVariable, setAdminVariable] = useState("click_color");
  const [adminNewValue, setAdminNewValue] = useState("");
  const [adminPreview, setAdminPreview] = useState(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminMsg, setAdminMsg] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminWizardStep, setAdminWizardStep] = useState(1);
  const [adminShowAdvancedVariables, setAdminShowAdvancedVariables] = useState(false);
  const [adminRollbackPreview, setAdminRollbackPreview] = useState(null);
  const [adminRollbackTargetId, setAdminRollbackTargetId] = useState(null);
  const [familyAdjustments, setFamilyAdjustments] = useState({});
  const [familyBulkPercent, setFamilyBulkPercent] = useState("+10%");
  const [familyPreviews, setFamilyPreviews] = useState({});

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

  const getCurrentEditableRelations = (sourceImpactData = impactData) => {
    if (!lastPayload || !result || !sourceImpactData?.relaciones?.length) return [];
    const productKey = getQuoteProductKey(lastPayload);
    return (sourceImpactData.relaciones || [])
      .filter((relation) => (
        relation.producto_key === productKey &&
        relation.editable &&
        relationAppliesToCurrentQuote(relation, lastPayload, result)
      ))
      .reduce((acc, relation) => {
        if (!acc.some((item) => item.variable === relation.variable)) acc.push(relation);
        return acc;
      }, []);
  };

  const getAdminVariableByKey = (key) => (adminPrices?.variables || []).find((item) => item.key === key) || null;

  const getFamilyPriceRows = () => (
    FAMILY_PRICE_VARIABLES.map((item) => {
      const variable = getAdminVariableByKey(item.variable);
      const currentValue = Number(variable?.value);
      const draft = familyAdjustments[item.variable] ?? "";
      const nextValue = parseFamilyPercentInput(draft);
      return {
        ...item,
        variableData: variable,
        currentValue,
        currentPercentLabel: Number.isFinite(currentValue) ? formatFamilyPercentInput(currentValue) : "-",
        draft,
        nextValue,
        preview: familyPreviews[item.variable] || null,
        missing: !variable,
      };
    })
  );

  const setFamilyAdjustment = (variable, value) => {
    setFamilyAdjustments((current) => ({ ...current, [variable]: value }));
    setFamilyPreviews((current) => ({ ...current, [variable]: null }));
    setAdminMsg("");
    setAdminError("");
  };

  const previewFamilyAdjustment = async (variable) => {
    const nextValue = parseFamilyPercentInput(familyAdjustments[variable]);
    if (nextValue == null) {
      setAdminError("Ingresá un porcentaje válido. Ejemplo: +10% o -5%.");
      return null;
    }
    try {
      setAdminLoading(true);
      setAdminError("");
      setAdminMsg("");
      const preview = await previewAdminPrecio({ variable, nuevo_valor: nextValue });
      setFamilyPreviews((current) => ({ ...current, [variable]: preview }));
      setAdminMsg("Preview válido. Revisá el impacto antes de aplicar.");
      return preview;
    } catch (err) {
      setFamilyPreviews((current) => ({ ...current, [variable]: null }));
      setAdminError(err.message || "No se pudo previsualizar el cambio.");
      return null;
    } finally {
      setAdminLoading(false);
    }
  };

  const applyFamilyAdjustment = async (variable) => {
    const nextValue = parseFamilyPercentInput(familyAdjustments[variable]);
    if (nextValue == null) {
      setAdminError("Ingresá un porcentaje válido. Ejemplo: +10% o -5%.");
      return;
    }
    const selected = getAdminVariableByKey(variable);
    const preview = familyPreviews[variable] || await previewFamilyAdjustment(variable);
    if (!preview) return;
    const confirmed = window.confirm(
      `Vas a cambiar ${selected?.label || variable} de ${selected?.value ?? preview.valor_actual} a ${nextValue}. Se creará backup e historial. ¿Confirmás?`
    );
    if (!confirmed) return;
    try {
      setAdminLoading(true);
      setAdminError("");
      const applied = await applyAdminPrecio({ variable, nuevo_valor: nextValue, confirmado: true });
      setAdminMsg(`Cambio guardado para ${selected?.label || variable}. Backup: ${(applied.backup || []).join(", ") || "-"}`);
      setFamilyPreviews((current) => ({ ...current, [variable]: null }));
      setAdminPreview(null);
      setAdminRollbackPreview(null);
      setAdminRollbackTargetId(null);
      await loadAdminPrices();
      await loadPrincipalVariables();
      setImpactData(null);
    } catch (err) {
      setAdminError(err.message || "No se pudo guardar el cambio.");
    } finally {
      setAdminLoading(false);
    }
  };

  const applyFamilyAdjustmentToAll = async () => {
    const nextValue = parseFamilyPercentInput(familyBulkPercent);
    if (nextValue == null) {
      setAdminError("Ingresá un porcentaje general válido. Ejemplo: +10% o -5%.");
      return;
    }
    const rows = getFamilyPriceRows().filter((row) => row.variableData);
    if (!rows.length) {
      setAdminError("No hay multiplicadores de familia disponibles para aplicar.");
      return;
    }
    const confirmed = window.confirm(
      `Vas a aplicar ${familyBulkPercent} a ${rows.length} familias. Se crearán backups e historial por cada variable. ¿Confirmás?`
    );
    if (!confirmed) return;
    try {
      setAdminLoading(true);
      setAdminError("");
      setAdminMsg("");
      const previews = {};
      for (const row of rows) {
        previews[row.variable] = await previewAdminPrecio({ variable: row.variable, nuevo_valor: nextValue });
      }
      const applied = [];
      for (const row of rows) {
        applied.push(await applyAdminPrecio({ variable: row.variable, nuevo_valor: nextValue, confirmado: true }));
      }
      setFamilyAdjustments((current) => {
        const next = { ...current };
        rows.forEach((row) => { next[row.variable] = familyBulkPercent; });
        return next;
      });
      setFamilyPreviews(previews);
      setAdminMsg(`Cambio masivo aplicado a ${applied.length} familias.`);
      setAdminPreview(null);
      setAdminRollbackPreview(null);
      setAdminRollbackTargetId(null);
      await loadAdminPrices();
      await loadPrincipalVariables();
      setImpactData(null);
    } catch (err) {
      setAdminError(err.message || "No se pudo aplicar el cambio masivo.");
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    if (!["Modificar precios", "Historial y backups", "Ajustar Precios por Familia"].includes(activeTab) || adminPrices || adminLoading) return;
    loadAdminPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  return {
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
    loadAdminPrices,
    handleAdminPreview,
    handleAdminApply,
    handleAdminRollbackPreview,
    handleAdminRollbackApply,
    getCurrentEditableRelations,
    getAdminVariableByKey,
    familyAdjustments,
    setFamilyAdjustment,
    familyBulkPercent,
    setFamilyBulkPercent,
    familyPreviews,
    getFamilyPriceRows,
    previewFamilyAdjustment,
    applyFamilyAdjustment,
    applyFamilyAdjustmentToAll,
  };
}
