export default function ExportarSoporteExcelPanel({
  isSimpleMode,
  principalMsg,
  downloadPricesExcel,
  downloadPricesPdf,
}) {
  return (
    <section className="card result-card ux-section" data-testid="export-support-excel-screen">
      <div className="card-head">
        <div>
          <h3>Exportar soporte Excel</h3>
          <p>
            {isSimpleMode
              ? "Generá archivos de consulta para revisar precios, compartirlos o respaldar información."
              : "El Excel maestro es un soporte de visualización y auditoría. No es el lugar principal para modificar precios."}
          </p>
        </div>
        <span>{isSimpleMode ? "Modo simple" : "Soporte / auditoría"}</span>
      </div>
      <div className="warning-box">
        Los cambios reales se hacen desde Modificar precios. Este export sirve para revisar, compartir, auditar y respaldar información.
      </div>
      {isSimpleMode ? (
        <div className="mode-note-card" data-testid="export-simple-summary">
          <strong>Qué contiene</strong>
          <p>Variables principales, rangos, tablas finales, productos bloqueados y trazabilidad resumida para auditoría.</p>
          <span>Los detalles técnicos de hojas, fuentes internas y trazabilidad completa están disponibles en modo avanzado.</span>
        </div>
      ) : (
        <div className="mode-note-card advanced-note" data-testid="export-advanced-summary">
          <strong>Vista técnica</strong>
          <p>Incluye hojas de variables madre, matrices PDF, bloqueados, fuentes, endpoints y trazabilidad operativa para mantenimiento.</p>
        </div>
      )}
      {principalMsg ? <div className="info-box" data-testid="export-support-message">{principalMsg}</div> : null}
      <div className="ux-export-grid">
        <article className="range-control-card">
          <strong>Excel maestro</strong>
          <span>Variables, rangos, tablas finales, bloqueados y trazabilidad.</span>
          <button type="button" className="calculate-btn compact-calculate-btn" data-testid="export-support-excel-button" onClick={downloadPricesExcel}>
            Generar Excel maestro
          </button>
        </article>
        <article className="range-control-card">
          <strong>PDF de tablas finales</strong>
          <span>Salida comercial de consulta. No implica edición de matrices.</span>
          <button type="button" className="secondary-btn" data-testid="export-support-pdf-button" onClick={downloadPricesPdf}>
            Exportar tablas PDF
          </button>
        </article>
      </div>
    </section>
  );
}
