import { useEffect, useState } from "react";
import {
  approveBajadasConfigCandidate,
  createBajadasConfigCandidate,
  fetchBajadasActiveVersion,
  fetchBajadasBackupDetail,
  fetchBajadasBackups,
  fetchBajadasConfig,
  fetchBajadasConfigCandidates,
  fetchBajadasConfigDiff,
  fetchBajadasConfigHistory,
  previewRestoreBajadasBackup,
  promoteBajadasConfigCandidate,
  rejectBajadasConfigCandidate,
  restoreBajadasBackup,
  restoreBajadasConfig,
  simulateBajadasConfig,
  simulateRestoreBajadasBackup,
  updateBajadasConfig,
  validateBajadasConfig,
} from "../api/bajadasV2Api";

export default function useConfigManager({ lastPayload }) {
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

  useEffect(() => {
    loadConfigData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
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
    loadConfigData,
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
  };
}
