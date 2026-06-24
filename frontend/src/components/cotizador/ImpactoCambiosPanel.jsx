function formatMoney(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(number);
}

function describeQuoteMaterial(payload) {
  const parts = [payload?.material || payload?.papel, payload?.gramaje].filter(Boolean);
  return parts.join(" ") || payload?.tipo_papel || "-";
}

function quoteUsesFixedPdf(payload, result, relation) {
  const explicitMode = [
    result?.modo_precio,
    result?.modo_calculo,
    result?.trazabilidad?.modo_precio,
    result?.trazabilidad?.modo_calculo,
    relation?.modo_precio,
  ].filter(Boolean).join(" ").toLowerCase();
  if (explicitMode.includes("formula_editable") || explicitMode.includes("formula_calibrada")) {
    return false;
  }
  const haystack = [
    result?.modo_precio,
    result?.modo_calculo,
    result?.fuente,
    result?.regla_aplicada,
    result?.trazabilidad?.modo_precio,
    result?.trazabilidad?.modo_calculo,
    result?.trazabilidad?.fuente_precio_final,
    relation?.modo_precio,
    relation?.tipo,
    payload?.categoria,
  ].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes("pdf") || haystack.includes("matriz");
}

function buildQuoteSummary(currentQuote) {
  const payload = currentQuote?.payload;
  const result = currentQuote?.result;
  if (!payload || !result) return null;
  const quantity = result.cantidad_unidades ?? payload.cantidad_unidades ?? "-";
  const total = result.total_con_urgencia ?? result.total_sin_iva ?? result.precio_con_recargo_urgencia ?? result.precio_sin_iva;
  const addition =
    payload.adicional_laminado && payload.adicional_laminado !== "sin_adicional"
      ? payload.adicional_laminado
      : payload.adicional_laca_uv
        ? "laca_uv"
        : payload.adicional_tinta_blanca
          ? "tinta_blanca"
          : "sin_adicional";
  return {
    productKey: currentQuote.productKey,
    productLabel: currentQuote.productLabel || payload.categoria || "Cotización actual",
    headline: [
      currentQuote.productLabel || payload.categoria,
      payload.formato,
      describeQuoteMaterial(payload),
      payload.caras,
      quantity ? `${quantity} unidad${Number(quantity) === 1 ? "" : "es"}` : null,
    ].filter(Boolean).join(" · "),
    fields: [
      ["Producto", currentQuote.productLabel || payload.categoria || "-"],
      ["Formato", payload.formato || "-"],
      ["Material", describeQuoteMaterial(payload)],
      ["Impresión", payload.caras || "-"],
      ["Cantidad", quantity],
      ["Adicional", addition],
      ["Urgencia", payload.urgencia || "normal"],
      ["Total final", formatMoney(total)],
    ],
  };
}

function normalizeScopeValue(value) {
  return String(value ?? "").trim().toLowerCase();
}

function scopeIncludes(scopeValues, currentValues) {
  if (!Array.isArray(scopeValues) || !scopeValues.length) return true;
  const normalizedScope = scopeValues.map(normalizeScopeValue);
  const normalizedCurrent = (Array.isArray(currentValues) ? currentValues : [currentValues])
    .filter((value) => value !== undefined && value !== null && value !== "")
    .map(normalizeScopeValue);
  return normalizedCurrent.some((value) => normalizedScope.includes(value));
}

function relationScopeKeys(relation) {
  return Object.keys(relation?.aplica_a || {}).filter((key) => {
    const value = relation.aplica_a[key];
    return Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null;
  });
}

function relationMatchKind(relation) {
  const keys = relationScopeKeys(relation);
  if (!keys.length) return "base_dependency_match";
  const haystack = [
    relation?.variable,
    relation?.variable_label,
    relation?.componente,
    relation?.detalle,
    ...(relation?.ruta_calculo || []),
  ].filter(Boolean).join(" ").toLowerCase();
  if (keys.some((key) => ["formatos", "cantidades", "rangos", "terminaciones", "adicionales", "caras", "gramajes", "materiales", "modo_color", "tipo_papel"].includes(key))) {
    return "scope_exact_match";
  }
  if (haystack.includes("multiplicador") || haystack.includes("base") || haystack.includes("papel") || haystack.includes("material") || haystack.includes("click") || haystack.includes("cambio")) {
    return "base_dependency_match";
  }
  return "product_dependency_match";
}

function getCurrentQuoteRange(payload, result) {
  return result?.cantidad_rango_aplicado || result?.rango_aplicado || payload?.cantidad_rango || payload?.cantidad_unidades;
}

function getCurrentQuoteTerminacion(payload) {
  return (
    payload?.terminacion_stickers_circulares ||
    payload?.terminacion_stickers ||
    payload?.terminacion_imanes ||
    payload?.terminacion_tarjetas ||
    payload?.terminacion_carpetas ||
    payload?.terminacion ||
    payload?.adicional_laminado ||
    "sin_laca_uv"
  );
}

function getCurrentQuoteAdditionsForScope(payload) {
  const additions = new Set();
  const adicional = payload?.adicional_laminado;
  if (adicional && adicional !== "sin_adicional") additions.add(adicional);
  if (payload?.adicional_laca_uv || adicional === "laca") {
    additions.add("laca");
    additions.add("adicional_laca_uv");
  }
  if (payload?.adicional_tinta_blanca || adicional === "tinta_blanca") {
    additions.add("tinta_blanca");
    additions.add("adicional_tinta_blanca");
  }
  if (payload?.adicional_troquelado) additions.add("troquelado_digital");
  if (payload?.solapa_impresa) additions.add("solapa_impresa");
  if (payload?.adicional_plastificado) additions.add("plastificado");
  if (payload?.adicional_laminado_por_lado && payload.adicional_laminado_por_lado !== "sin_adicional") {
    additions.add(payload.adicional_laminado_por_lado);
  }
  return Array.from(additions);
}

function relationAppliesToCurrentQuote(relation, payload, result = null) {
  const applies = relation?.aplica_a || {};
  if (!payload || !applies || !Object.keys(applies).length) return true;
  if (!scopeIncludes(applies.formatos, [payload.formato, payload.formato_agendas])) {
    return false;
  }
  if (!scopeIncludes(applies.cantidades, payload.cantidad_unidades)) {
    return false;
  }
  if (!scopeIncludes(applies.rangos, getCurrentQuoteRange(payload, result))) {
    return false;
  }
  if (!scopeIncludes(applies.terminaciones, getCurrentQuoteTerminacion(payload))) {
    return false;
  }
  if (!scopeIncludes(applies.adicionales, getCurrentQuoteAdditionsForScope(payload))) {
    return false;
  }
  if (!scopeIncludes(applies.caras, [payload.caras, payload.caras_tarjetas_troq_circ])) {
    return false;
  }
  if (!scopeIncludes(applies.modo_color, [payload.modo_color, payload.modo_color_folleto])) {
    return false;
  }
  if (!scopeIncludes(applies.tipo_papel, payload.tipo_papel)) {
    return false;
  }
  if (!scopeIncludes(applies.gramajes, payload.gramaje)) {
    return false;
  }
  if (!scopeIncludes(applies.materiales, payload.material)) {
    return false;
  }
  if (!scopeIncludes(applies.tipos_sobre, payload.tipo_sobre)) {
    return false;
  }
  if (!scopeIncludes(applies.variantes, payload.variante)) {
    return false;
  }
  if (!scopeIncludes(applies.productos, payload.producto)) {
    return false;
  }
  if (!scopeIncludes(applies.paginas, payload.paginas)) {
    return false;
  }
  if (Array.isArray(applies.solapa_impresa) && applies.solapa_impresa.length) {
    const current = Boolean(payload.solapa_impresa);
    if (!applies.solapa_impresa.some((value) => Boolean(value) === current)) return false;
  }
  return true;
}

function analyzeContext({ selectedRelations, quoteSummary, currentQuote, impactMode }) {
  if (!quoteSummary) {
    return {
      status: "sin_cotizacion",
      badge: "Mapa general",
      title: "No hay una cotización activa",
      message: "No hay una cotización activa. Se muestra el mapa general de impacto. Para ver impacto exacto, primero calculá una cotización.",
      currentRelations: [],
    };
  }

  const currentRelations = selectedRelations.filter((item) => (
    item.producto_key === quoteSummary.productKey &&
    relationAppliesToCurrentQuote(item, currentQuote.payload, currentQuote.result)
  ));
  if (!currentRelations.length) {
    return {
      status: selectedRelations.length ? "solo_otros_productos" : "sin_evidencia",
      badge: selectedRelations.length ? "Solo otros productos" : "Sin evidencia",
      title: selectedRelations.length ? "No afecta esta cotización actual" : "Sin evidencia para esta cotización",
      message: selectedRelations.length
        ? "Esta variable impacta otros productos, pero no la cotización actual."
        : "No hay una relación documentada entre la selección actual y esta cotización.",
      currentRelations,
    };
  }

  const connected = currentRelations.find((item) => item.impacta_hoy && item.estado !== "bloqueado");
  if (connected) {
    const fixedPdf = quoteUsesFixedPdf(currentQuote.payload, currentQuote.result, connected);
    const matchKind = relationMatchKind(connected);
    return {
      status: "afecta_cotizacion_actual",
      badge: fixedPdf && matchKind === "base_dependency_match" ? "Base usada" : "Afecta esta cotización",
      title: "Afecta esta cotización actual",
      message: fixedPdf
        ? "Esta variable participa en la base técnica o trazabilidad del caso actual; el precio final permanece calibrado contra PDF/lista."
        : "Esta variable participa en el cálculo actual de esta cotización.",
      currentRelations,
    };
  }

  const documented = currentRelations.find((item) => !item.impacta_hoy || item.estado === "preparado_no_conectado" || item.estado === "documentado_no_conectado");
  if (documented || quoteUsesFixedPdf(currentQuote.payload, currentQuote.result, connected || currentRelations[0])) {
    return {
      status: "documentada_no_conectada_actual",
      badge: "Documentada, no conectada",
      title: "No afecta esta cotización actual",
      message: impactMode === "variable"
        ? "Esta variable está documentada para este producto, pero esta cotización actual usa matriz PDF. Cambiarla no modifica este precio final hoy."
        : "Este producto tiene relaciones documentadas o preparadas, pero el precio actual puede seguir viniendo de una matriz PDF fija.",
      currentRelations,
    };
  }

  return {
    status: "afecta_producto_en_otros_casos",
    badge: "Producto relacionado, no este caso",
    title: "Afecta el producto, pero no este caso específico",
    message: "La relación existe para el producto, pero no hay evidencia de que afecte esta combinación exacta.",
    currentRelations,
  };
}

function relationKey(relation) {
  return `${relation.variable}-${relation.producto_key}-${relation.componente}`;
}

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
  currentQuote,
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
  const quoteSummary = buildQuoteSummary(currentQuote);
  const context = analyzeContext({ selectedRelations, quoteSummary, currentQuote, impactMode });
  const currentRelationKeys = new Set(context.currentRelations.map(relationKey));
  const sameProductOtherCases = selectedRelations.filter((item) => item.producto_key === quoteSummary?.productKey && !currentRelationKeys.has(relationKey(item)));
  const otherProductRelations = selectedRelations.filter((item) => item.producto_key !== quoteSummary?.productKey && item.impacta_hoy && item.estado !== "bloqueado");
  const documentedRelations = selectedRelations.filter((item) => item.producto_key !== quoteSummary?.productKey && (!item.impacta_hoy || item.estado === "bloqueado"));
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

  const renderRelationCard = (relation, suffix = "") => (
    <article className={`impact-relation-card ${statusClass(relation)}`} key={`${relationKey(relation)}${suffix}`}>
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
  );

  return (
    <section className="card result-card impact-card">
      <div className="card-head">
        <div>
          <h3 data-testid="variable-impact-title">Ver impacto de cambios</h3>
          <p>{isSimpleMode ? "Usá esta sección para saber qué productos se afectan y evitar cambios riesgosos." : "Usá esta sección para saber qué productos se afectan antes de modificar una variable o costo. Es una vista de prevención: no guarda cambios."}</p>
        </div>
        <span>{quoteSummary ? "Impacto contextual" : isSimpleMode ? "Impacto claro" : "Mapa preventivo"}</span>
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
            <p>{quoteSummary ? "Primero se evalúa la cotización actual. Después se separan impactos del mismo producto, otros productos y relaciones documentadas." : isSimpleMode ? "No hay una cotización activa. Se muestra el mapa general de impacto." : <><strong>Impacta hoy</strong> significa que cambiar esa variable modifica precios actuales. <strong>Documentado no conectado</strong> existe como lógica histórica o futura, pero hoy no recalcula. <strong>Tabla PDF fija</strong> viene de precio publicado. <strong>Bloqueado</strong> no tiene datos confiables.</>}</p>
          </div>

          {quoteSummary ? (
            <div className="impact-current-quote" data-testid="impact-current-quote">
              <div>
                <span>Cotización actual analizada</span>
                <strong>{quoteSummary.headline}</strong>
              </div>
              <div className="impact-current-grid">
                {quoteSummary.fields.map(([label, value]) => (
                  <div key={label}><span>{label}</span><strong>{value}</strong></div>
                ))}
              </div>
            </div>
          ) : (
            <div className="impact-current-quote neutral" data-testid="impact-no-current-quote">
              <strong>No hay una cotización activa</strong>
              <p>Se muestra el mapa general de impacto. Para ver impacto exacto, primero calculá una cotización.</p>
            </div>
          )}

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
            <strong>{selectedMeta?.label || selectedMeta?.key || "Sin selección"}</strong>
            <small>{impactMode === "variable" ? selectedMeta?.descripcion : (isAdvancedMode ? `${selectedMeta?.modo_precio || "-"} · ${selectedMeta?.endpoint || "-"}` : "Productos afectados por la selección.")}</small>
          </div>

          <div className={`impact-context-card ${context.status}`} data-testid="impact-current-assessment">
            <div className="impact-context-head">
              <span>Impacto sobre esta cotización</span>
              <em>{context.badge}</em>
            </div>
            <strong>{context.title}</strong>
            <p>{context.message}</p>
            {isAdvancedMode && quoteSummary ? (
              <div className="impact-meta-grid">
                <div><span>Producto actual</span><strong>{quoteSummary.productKey || "-"}</strong></div>
                <div><span>Estado contextual</span><strong>{context.status}</strong></div>
                <div><span>Relaciones del producto</span><strong>{context.currentRelations.length}</strong></div>
                <div><span>Modo</span><strong>{impactMode}</strong></div>
              </div>
            ) : null}
          </div>

          {isAdvancedMode && firstRelation ? (
            <div className="impact-chain" data-testid="impact-visual-chain">
              {(firstRelation.ruta_calculo || []).map((step, index) => (
                <span key={`${step}-${index}`}>{step}</span>
              ))}
            </div>
          ) : null}

          <div className="impact-results" data-testid="impact-results">
            {quoteSummary ? (
              <>
                <section className="impact-group" data-testid="impact-current-product-group">
                  <h4>Esta cotización actual</h4>
                  {context.currentRelations.length ? context.currentRelations.map((relation) => renderRelationCard(relation, "-actual")) : <div className="placeholder"><p>La selección no tiene relación directa con esta cotización.</p></div>}
                </section>
                <section className="impact-group" data-testid="impact-same-product-group">
                  <h4>Este producto en otros casos</h4>
                  {sameProductOtherCases.length ? sameProductOtherCases.map((relation) => renderRelationCard(relation, "-same")) : <div className="placeholder"><p>No hay otros casos del mismo producto para esta selección.</p></div>}
                </section>
                <section className="impact-group" data-testid="impact-other-products-group">
                  <h4>Otros productos afectados</h4>
                  {otherProductRelations.length ? otherProductRelations.map((relation) => renderRelationCard(relation, "-other")) : <div className="placeholder"><p>No hay otros productos conectados para esta selección.</p></div>}
                </section>
                <section className="impact-group" data-testid="impact-documented-group">
                  <h4>Documentado / preparado / bloqueado</h4>
                  {documentedRelations.length ? documentedRelations.map((relation) => renderRelationCard(relation, "-doc")) : <div className="placeholder"><p>No hay relaciones documentadas adicionales.</p></div>}
                </section>
              </>
            ) : selectedRelations.length ? selectedRelations.map((relation) => renderRelationCard(relation)) : <div className="placeholder"><p>No hay relaciones para esta selección.</p></div>}
          </div>
        </>
      ) : null}
    </section>
  );
}
