export default function PrincipalVariablesTab({
  principalVariables,
  principalDraft,
  setPrincipalDraft,
  setImpactMode,
  setImpactVariable,
  setActiveTab,
  principalMsg,
  savePrincipalVariables,
  loadPrincipalVariables,
  downloadPricesPdf,
  downloadPricesExcel,
  excelImportPreview,
  excelImportLoading,
  excelImportError,
  setExcelImportFile,
  setExcelImportPreview,
  setExcelImportError,
  previewExcelImport,
  principalRanges,
  principalAudit,
}) {
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



  return renderPrincipalVariablesTab();
}
