export default function ConfiguracionAvanzadaPanel({
  isSimpleMode,
  isAdvancedMode,
  setViewMode,
  renderPrincipalVariablesTab,
  renderConfigTab,
}) {
  return (
    <div className="ux-section" data-testid="advanced-config-screen">
      <section className="card result-card ux-intro-card">
        <div className="card-head">
          <div>
            <h3>Configuración avanzada</h3>
            <p>{isSimpleMode ? "Esta sección contiene configuración técnica y herramientas de mantenimiento." : "Sección técnica para costos base, variables principales, importador preview y configuración interna. No es el flujo diario para modificar precios."}</p>
          </div>
          <span>{isSimpleMode ? "Protegido" : "Modo avanzado"}</span>
        </div>
        <div className="warning-box">
          {isSimpleMode
            ? "Para evitar cambios accidentales, el detalle técnico se muestra solo en modo avanzado."
            : "Si querés cambiar un precio operativo, usá Modificar precios. Esta sección conserva las vistas técnicas existentes para auditoría y mantenimiento."}
        </div>
        {isSimpleMode ? (
          <div className="mode-note-card" data-testid="advanced-config-simple-guard">
            <strong>Configuración técnica oculta en modo simple</strong>
            <p>Activá modo avanzado para ver variables principales, importador preview, backups de configuración y edición interna.</p>
            <button type="button" className="secondary-btn" data-testid="advanced-config-enable-advanced" onClick={() => setViewMode("advanced")}>
              Activar modo avanzado
            </button>
          </div>
        ) : null}
      </section>
      {isAdvancedMode ? renderPrincipalVariablesTab() : null}
      {isAdvancedMode ? renderConfigTab() : null}
    </div>
  );
}
