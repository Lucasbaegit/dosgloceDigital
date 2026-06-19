export default function EntenderPrecioPanel({
  isSimpleMode,
  isAdvancedMode,
  understandMode,
  setUnderstandMode,
  renderTreeTab,
  renderTraceVisualTab,
}) {
  return (
    <div className="ux-section" data-testid="understand-price-screen">
      <section className="card result-card ux-intro-card">
        <div className="card-head">
          <div>
            <h3>Entender un precio</h3>
            <p>{isSimpleMode ? "Primero ves un resumen simple. Activá modo avanzado para ver grafo, árbol y fuentes de cálculo." : "Usá esta sección para ver de dónde salió un precio: material, impresión, cantidad, adicionales, urgencia y total final."}</p>
          </div>
          <span>{isSimpleMode ? "Modo simple" : "Modo avanzado"}</span>
        </div>
        <div className="ux-mode-note">
          <strong>Modo simple:</strong> resumen comercial del cálculo. <strong>Modo avanzado:</strong> grafo, árbol técnico, variables y origen PDF/fórmula.
        </div>
        {isAdvancedMode ? (
          <div className="trace-mode-options ux-subnav" role="group" aria-label="Vista para entender precio">
            <button
              type="button"
              data-testid="understand-detail-button"
              className={understandMode === "detalle" ? "trace-mode-pill active" : "trace-mode-pill"}
              onClick={() => setUnderstandMode("detalle")}
            >
              Resumen / Detalle del cálculo
            </button>
            <button
              type="button"
              data-testid="understand-trace-button"
              className={understandMode === "trazabilidad" ? "trace-mode-pill active" : "trace-mode-pill"}
              onClick={() => setUnderstandMode("trazabilidad")}
            >
              Trazabilidad visual avanzada
            </button>
          </div>
        ) : null}
      </section>
      {isAdvancedMode && understandMode === "trazabilidad" ? renderTraceVisualTab() : renderTreeTab()}
    </div>
  );
}
