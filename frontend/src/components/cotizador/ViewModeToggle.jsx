const VIEW_MODES = {
  simple: {
    label: "Modo simple",
    description: "Modo simple: muestra solo lo necesario para operar el sistema.",
  },
  advanced: {
    label: "Modo avanzado",
    description: "Modo avanzado: muestra detalles técnicos, trazabilidad, claves internas y fuentes de cálculo.",
  },
};

export default function ViewModeToggle({ viewMode, setViewMode, isSimpleMode, isAdvancedMode }) {
  return (
    <section className="view-mode-toggle" data-testid="view-mode-toggle" aria-label="Selector de modo de vista">
      <div>
        <strong>{VIEW_MODES[viewMode].label}</strong>
        <span>{VIEW_MODES[viewMode].description}</span>
      </div>
      <div className="view-mode-buttons" role="group" aria-label="Modo de visualización">
        <button
          type="button"
          data-testid="view-mode-simple"
          className={isSimpleMode ? "active" : ""}
          aria-pressed={isSimpleMode}
          onClick={() => setViewMode("simple")}
        >
          Modo simple
        </button>
        <button
          type="button"
          data-testid="view-mode-advanced"
          className={isAdvancedMode ? "active" : ""}
          aria-pressed={isAdvancedMode}
          onClick={() => setViewMode("advanced")}
        >
          Modo avanzado
        </button>
      </div>
    </section>
  );
}
