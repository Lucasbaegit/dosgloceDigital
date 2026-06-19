export default function HistorialBackupsPanel({
  renderAdminHistoryEntries,
  renderRollbackPreviewPanel,
  cfgBackups,
  adminError,
  adminMsg,
  adminLoading,
  adminPrices,
}) {
  return (
    <section className="card result-card ux-section" data-testid="history-backups-screen">
      <div className="card-head">
        <div>
          <h3>Historial y backups</h3>
          <p>Consultá cambios aplicados, backups creados y restauraciones seguras. Podés restaurar un valor anterior mediante preview y confirmación.</p>
        </div>
        <span>Auditoría</span>
      </div>
      <div className="warning-box">
        Restaurar no copia archivos a mano: crea un nuevo backup, registra el rollback y mantiene trazabilidad.
      </div>
      {adminError ? <div className="error-box">{adminError}</div> : null}
      {adminMsg ? <div className="info-box">{adminMsg}</div> : null}
      {adminLoading && !adminPrices ? <div className="placeholder"><p>Cargando historial...</p></div> : null}
      <div className="ux-history-grid">
        <section className="principal-group" data-testid="history-backups-admin-history">
          <h4>Cambios operativos recientes</h4>
          {renderAdminHistoryEntries({ limit: 12 })}
          {renderRollbackPreviewPanel()}
        </section>
        <section className="principal-group" data-testid="history-backups-config">
          <h4>Backups técnicos disponibles</h4>
          <p className="range-hint">Backups de configuración productiva. Restaurar sigue siendo una acción avanzada y requiere previsualización.</p>
          <div className="history-list">
            {(cfgBackups || []).slice(0, 10).map((backup) => (
              <div key={backup.archivo}>
                <strong>{backup.archivo}</strong> · {backup.fecha || "-"} · {backup.tamano_bytes ?? "-"} bytes
              </div>
            ))}
            {!(cfgBackups || []).length ? <p className="range-hint">Sin backups listados.</p> : null}
          </div>
        </section>
      </div>
    </section>
  );
}


