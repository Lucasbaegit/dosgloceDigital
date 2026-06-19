export default function ImpactoCambiosPanel({
  isSimpleMode,
  isAdvancedMode,
  impactData,
  impactError,
  impactLoading,
  impactMode,
  setImpactMode,
  impactVariable,
  setImpactVariable,
  impactProduct,
  setImpactProduct,
}) {
  const variables = impactData?.variables || [];
  const products = impactData?.productos || [];
  const relations = impactData?.relaciones || [];
  const selectedRelations =
    impactMode === "variable"
      ? relations.filter((item) => item.variable === impactVariable)
      : relations.filter((item) => item.producto_key === impactProduct);
  const selectedMeta =
    impactMode === "variable"
      ? variables.find((item) => item.key === impactVariable)
      : products.find((item) => item.key === impactProduct);
  const summary = impactData?.resumen || {};
  const firstRelation = selectedRelations[0];

  const statusLabel = (relation) => {
    if (relation.estado === "bloqueado") return "Bloqueado";
    if (relation.impacta_hoy) return "Impacta hoy";
    return "Documentado no conectado";
  };

  const statusClass = (relation) => {
    if (relation.estado === "bloqueado") return "bloqueado";
    if (relation.tipo === "tabla_pdf" || relation.tipo === "matriz_pdf") return "tabla_pdf";
    if (relation.tipo === "factor") return "factor";
    if (relation.impacta_hoy) return "variable_madre";
    return "preparada";
  };

  return (
    <section className="card result-card impact-card">
      <div className="card-head">
        <div>
          <h3 data-testid="variable-impact-title">Ver impacto de cambios</h3>
          <p>{isSimpleMode ? "Usá esta sección para saber qué productos se afectan y evitar cambios riesgosos." : "Usá esta sección para saber qué productos se afectan antes de modificar una variable o costo. Es una vista de prevención: no guarda cambios."}</p>
        </div>
        <span>{isSimpleMode ? "Impacto claro" : "Mapa preventivo"}</span>
      </div>

      {impactError ? <div className="error-box" data-testid="impact-error">{impactError}</div> : null}
      {impactLoading && !impactData ? <div className="placeholder"><p>Cargando mapa de impacto...</p></div> : null}

      {impactData ? (
        <>
          <div className="impact-summary-grid" data-testid="impact-summary">
            <article><strong>{summary.variables_editables ?? 0}</strong><span>Variables editables</span></article>
            <article><strong>{summary.relaciones_conectadas ?? 0}</strong><span>Relaciones conectadas</span></article>
            {isAdvancedMode ? <article><strong>{summary.relaciones_documentadas_no_conectadas ?? 0}</strong><span>Documentadas no conectadas</span></article> : null}
            {isAdvancedMode ? <article><strong>{summary.productos_bloqueados ?? 0}</strong><span>Productos bloqueados</span></article> : null}
          </div>

          <div className="impact-explainer">
            <p>{isSimpleMode ? "Revisá productos afectados y nivel de impacto antes de cambiar un precio. Activá modo avanzado para ver claves técnicas, componentes y relaciones internas." : <><strong>Impacta hoy</strong> significa que cambiar esa variable modifica precios actuales. <strong>Documentado no conectado</strong> existe como logica historica o futura, pero hoy no recalcula. <strong>Tabla PDF fija</strong> viene de precio publicado. <strong>Bloqueado</strong> no tiene datos confiables.</>}</p>
          </div>

          <div className="impact-toolbar">
            <div className="trace-mode-options" role="group" aria-label="Modo impacto">
              <button
                type="button"
                data-testid="impact-mode-variable"
                className={impactMode === "variable" ? "trace-mode-pill active" : "trace-mode-pill"}
                onClick={() => setImpactMode("variable")}
              >
                Variable → Productos
              </button>
              <button
                type="button"
                data-testid="impact-mode-producto"
                className={impactMode === "producto" ? "trace-mode-pill active" : "trace-mode-pill"}
                onClick={() => setImpactMode("producto")}
              >
                Producto → Variables
              </button>
            </div>
            {impactMode === "variable" ? (
              <label>
                <span>Variable</span>
                <select data-testid="impact-variable-select" value={impactVariable} onChange={(event) => setImpactVariable(event.target.value)}>
                  {variables.map((item) => <option key={item.key} value={item.key}>{item.label} · {item.key}</option>)}
                </select>
              </label>
            ) : (
              <label>
                <span>Producto</span>
                <select data-testid="impact-product-select" value={impactProduct} onChange={(event) => setImpactProduct(event.target.value)}>
                  {products.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
                </select>
              </label>
            )}
          </div>

          <div className="impact-focus-card">
            <span>{impactMode === "variable" ? "Variable seleccionada" : "Producto seleccionado"}</span>
            <strong>{selectedMeta?.label || selectedMeta?.key || "Sin seleccion"}</strong>
            <small>{impactMode === "variable" ? selectedMeta?.descripcion : (isAdvancedMode ? `${selectedMeta?.modo_precio || "-"} · ${selectedMeta?.endpoint || "-"}` : "Productos afectados por la selección.")}</small>
          </div>

          {isAdvancedMode && firstRelation ? (
            <div className="impact-chain" data-testid="impact-visual-chain">
              {(firstRelation.ruta_calculo || []).map((step, index) => (
                <span key={`${step}-${index}`}>{step}</span>
              ))}
            </div>
          ) : null}

          <div className="impact-results" data-testid="impact-results">
            {selectedRelations.length ? selectedRelations.map((relation) => (
              <article className={`impact-relation-card ${statusClass(relation)}`} key={`${relation.variable}-${relation.producto_key}-${relation.componente}`}>
                <div className="impact-relation-head">
                  <div>
                    <strong>{impactMode === "variable" ? relation.producto : relation.variable_label}</strong>
                    <span>{isAdvancedMode ? relation.componente : relation.nivel_impacto}</span>
                  </div>
                  <em>{statusLabel(relation)}</em>
                </div>
                {isAdvancedMode ? (
                  <div className="impact-meta-grid" data-testid="impact-advanced-meta">
                    <div><span>Editable</span><strong>{relation.editable ? "si" : "no"}</strong></div>
                    <div><span>Nivel</span><strong>{relation.nivel_impacto}</strong></div>
                    <div><span>Estado</span><strong>{relation.estado}</strong></div>
                    <div><span>Modo precio</span><strong>{relation.modo_precio}</strong></div>
                  </div>
                ) : null}
                <p>{relation.detalle}</p>
                {isAdvancedMode ? <small>Fuente: {relation.fuente}</small> : null}
              </article>
            )) : <div className="placeholder"><p>No hay relaciones para esta seleccion.</p></div>}
          </div>
        </>
      ) : null}
    </section>
  );
}
