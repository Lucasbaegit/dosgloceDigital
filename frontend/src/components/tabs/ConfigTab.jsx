import ConfiguracionAvanzadaPanel from "../cotizador/ConfiguracionAvanzadaPanel";

export default function ConfigTab({
  isSimpleMode,
  isAdvancedMode,
  setViewMode,
  renderPrincipalVariablesTab,
  cfg,
  cfgMsg,
  cfgActiveVersion,
  cfgCandidates,
  createCandidate,
  approveCandidate,
  promoteCandidate,
  rejectCandidate,
  cfgBackups,
  showBackupDetail,
  previewRestoreBackup,
  simulateBackupQuote,
  restoreBackup,
  cfgBackupDetail,
  cfgBackupPreview,
  cfgBackupSimulation,
  cfgDiff,
  updateCfgField,
  saveCfgField,
  setCfg,
  saveScales,
  restoreCfg,
  runValidateConfig,
  runSimulation,
  cfgValidation,
  cfgSimulation,
  cfgHistory,
  formatMoney,
}) {
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



  return (
    <ConfiguracionAvanzadaPanel
      isSimpleMode={isSimpleMode}
      isAdvancedMode={isAdvancedMode}
      setViewMode={setViewMode}
      renderPrincipalVariablesTab={renderPrincipalVariablesTab}
      renderConfigTab={renderConfigTab}
    />
  );
}
