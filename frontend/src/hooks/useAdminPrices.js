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

  useEffect(() => {
    if (!["Modificar precios", "Historial y backups"].includes(activeTab) || adminPrices || adminLoading) return;
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
  };
}
