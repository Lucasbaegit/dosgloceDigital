import ModificarPreciosWizard from "../cotizador/ModificarPreciosWizard";
import {
  collectCurrentQuoteAdditions,
  describeCurrentQuoteMaterial,
  describeQuoteOperationalAdditions,
  describeQuoteTerminacion,
  formatMoney,
  getQuoteProductKey,
  getQuoteProductLabel,
  inferPriceSourceKind,
  relationAppliesToCurrentQuote,
  relationContextBadge,
  sourceKindExplanation,
  sourceKindLabel,
} from "../../lib/cotizacionLogic";

export default function AdminPricesTab({
  adminPrices,
  adminVariable,
  adminNewValue,
  adminPreview,
  adminLoading,
  setAdminWizardStep,
  setAdminVariable,
  setAdminNewValue,
  setAdminPreview,
  setAdminMsg,
  setAdminError,
  result,
  lastPayload,
  impactData,
  adminWizardStep,
  adminShowAdvancedVariables,
  setAdminShowAdvancedVariables,
  isSimpleMode,
  isAdvancedMode,
  handleOpenVariableInTrace,
  handleAdminPreview,
  handleAdminApply,
  renderAdminHistoryEntries,
  renderRollbackPreviewPanel,
  adminError,
  adminMsg,
  ADMIN_PRICE_STEPS,
}) {
  const variables = adminPrices?.variables || [];
  const selected = variables.find((item) => item.key === adminVariable);
  const numericValue = Number(adminNewValue);
  const currentValue = Number(selected?.value);
  const previewMatches = adminPreview && adminPreview.variable === adminVariable && Number(adminPreview.nuevo_valor) === numericValue;
  const productosAfectados = selected?.productos_afectados || [];
  const minValue = selected?.min ?? 0;
  const maxValue = selected?.max;
  const valueValidation = (() => {
    if (!selected) return "Elegí una variable para continuar.";
    if (String(adminNewValue).trim() === "") return "Ingresá un nuevo valor.";
    if (!Number.isFinite(numericValue)) return "El valor debe ser numérico.";
    if (Number.isFinite(Number(minValue)) && numericValue < Number(minValue)) return `El valor no puede ser menor que ${minValue}.`;
    if (maxValue != null && Number.isFinite(Number(maxValue)) && numericValue > Number(maxValue)) return `El valor no puede ser mayor que ${maxValue}.`;
    if (Number.isFinite(currentValue) && numericValue === currentValue) return "El nuevo valor debe ser distinto del valor actual.";
    return "";
  })();
  const canPreviewAdmin = !valueValidation && !adminLoading;
  const canConfirmAdmin = Boolean(previewMatches) && !adminLoading;
  const deltaValue = Number.isFinite(numericValue) && Number.isFinite(currentValue) ? numericValue - currentValue : null;
  const deltaPercent = deltaValue != null && currentValue !== 0 ? (deltaValue / currentValue) * 100 : null;
  const goToAdminStep = (step) => setAdminWizardStep(Math.max(1, Math.min(6, step)));
  const selectAdminVariable = (item) => {
    setAdminVariable(item.key);
    setAdminNewValue(String(item.value));
    setAdminPreview(null);
    setAdminMsg("");
    setAdminError("");
    setAdminWizardStep(2);
  };
  const previewImpacts = adminPreview?.impactos || [];
  const previewExamples = adminPreview?.precios_ejemplo || [];
  const currentProductKey = result && lastPayload ? getQuoteProductKey(lastPayload) : null;
  const currentProductLabel = result && lastPayload ? getQuoteProductLabel(lastPayload, impactData) : "";
  const impactRelations = impactData?.relaciones || [];
  const relevantRelations = currentProductKey
    ? impactRelations
      .filter((relation) => (
        relation.producto_key === currentProductKey &&
        relation.impacta_hoy &&
        relation.editable &&
        relationAppliesToCurrentQuote(relation, lastPayload, result)
      ))
    : [];
  const relevantVariableKeys = new Set(
    currentProductKey
      ? relevantRelations.map((relation) => relation.variable)
      : []
  );
  const productVariableKeys = new Set(
    currentProductKey
      ? impactRelations
        .filter((relation) => relation.producto_key === currentProductKey && relation.editable)
        .map((relation) => relation.variable)
      : []
  );
  const relationByVariable = new Map();
  if (currentProductKey) {
    relevantRelations.forEach((relation) => relationByVariable.set(relation.variable, relation));
  }
  const hasCurrentQuoteContext = Boolean(currentProductKey && result && lastPayload);
  const contextualVariables = hasCurrentQuoteContext
    ? variables.filter((item) => relevantVariableKeys.has(item.key))
    : variables;
  const sameProductOtherCaseVariables = hasCurrentQuoteContext
    ? variables.filter((item) => productVariableKeys.has(item.key) && !relevantVariableKeys.has(item.key))
    : [];
  const otherSystemVariables = hasCurrentQuoteContext
    ? variables.filter((item) => !productVariableKeys.has(item.key) && !relevantVariableKeys.has(item.key))
    : [];
  const renderCurrentPriceChain = () => {
    if (!hasCurrentQuoteContext) {
      return (
        <section className="price-chain-card neutral" data-testid="current-price-chain">
          <div className="price-chain-head">
            <div>
              <span>Cadena del precio actual</span>
              <h4>Calculá un precio para ver la cadena de origen.</h4>
            </div>
          </div>
        </section>
      );
    }
    const sourceKind = inferPriceSourceKind(result);
    const total = result.total_con_urgencia ?? result.total_sin_iva ?? result.precio_con_recargo_urgencia ?? result.precio_sin_iva;
    const unit = result.precio_unitario_con_urgencia ?? result.precio_unitario_sin_iva ?? result.precio_sin_iva;
    const rangeOrQuantity = result.cantidad_rango_aplicado ?? result.rango_aplicado ?? lastPayload?.cantidad_rango ?? result.cantidad_unidades ?? lastPayload?.cantidad_unidades ?? "No disponible";
    const additions = collectCurrentQuoteAdditions(lastPayload, result);
    const chips = [
      ["Formato", lastPayload?.formato || lastPayload?.formato_agendas],
      ["Cantidad", result.cantidad_unidades ?? lastPayload?.cantidad_unidades],
      ["Impresión", lastPayload?.caras || lastPayload?.caras_tarjetas_troq_circ],
      ["Material", describeCurrentQuoteMaterial(lastPayload)],
      ["Terminación", describeQuoteTerminacion(lastPayload)],
      ["Adicional operativo", describeQuoteOperationalAdditions(lastPayload, result)],
    ].filter(([, value]) => value !== undefined && value !== null && value !== "" && value !== "No aplica");
    const compositionSteps = [
      { label: "Entrada del caso", value: currentProductLabel, type: "entrada" },
      { label: "Formato / cantidad", value: `${lastPayload?.formato || lastPayload?.formato_agendas || "-"} · ${rangeOrQuantity}`, type: "scope" },
      { label: "Material e impresión", value: `${describeCurrentQuoteMaterial(lastPayload)} · ${lastPayload?.caras || lastPayload?.caras_tarjetas_troq_circ || "-"}`, type: "base" },
      { label: "Terminación / adicional", value: `${describeQuoteTerminacion(lastPayload)} · ${describeQuoteOperationalAdditions(lastPayload, result)}`, type: "addition" },
      { label: "Fuente / calibración", value: sourceKindLabel(sourceKind), type: "source" },
      { label: "Total final", value: formatMoney(total), type: "final" },
    ];

    return (
      <section className="price-chain-card" data-testid="current-price-chain">
        <div className="price-chain-head">
          <div>
            <span>Cadena del precio actual</span>
            <h4>{currentProductLabel}</h4>
            <p>{sourceKindExplanation(sourceKind)}</p>
          </div>
          <em>{sourceKindLabel(sourceKind)}</em>
        </div>
        <div className="price-chain-grid">
          <div><span>Precio final actual</span><strong>{formatMoney(total)}</strong></div>
          <div><span>Precio unitario</span><strong>{formatMoney(unit)}</strong></div>
          <div><span>Fuente principal</span><strong>{result.fuente || result.trazabilidad?.fuente_precio_final || "No disponible"}</strong></div>
          <div><span>Regla aplicada</span><strong>{result.regla_aplicada || result.trazabilidad?.modo_calculo || "No disponible"}</strong></div>
          <div><span>Rango / cantidad</span><strong>{rangeOrQuantity}</strong></div>
          <div><span>Urgencia</span><strong>{lastPayload?.urgencia || "normal"}</strong></div>
        </div>
        <div className="price-chain-chips" aria-label="Parámetros usados">
          {chips.map(([label, value]) => <span key={label}><strong>{label}:</strong> {value}</span>)}
          {additions.map((item) => <span key={`${item.label}-${item.source}`}><strong>{item.label}:</strong> {formatMoney(Number(item.value) || 0)}</span>)}
        </div>
        <div className="price-composition-flow" data-testid="current-price-composition">
          <strong>Cómo se compone</strong>
          <div className="price-composition-steps">
            {compositionSteps.map((step, index) => (
              <div className={`price-composition-step ${step.type}`} key={`${step.label}-${index}`}>
                <span>{index + 1}</span>
                <div>
                  <em>{step.label}</em>
                  <strong>{step.value}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="price-chain-vars">
          <strong>Variables relacionadas</strong>
          {contextualVariables.length ? (
            <div>
              {contextualVariables.slice(0, 8).map((item) => <span key={item.key}>{item.label}</span>)}
            </div>
          ) : (
            <p>No hay variables editables específicas detectadas para esta cotización.</p>
          )}
        </div>
      </section>
    );
  };

  const renderAdminStepper = () => (
    <div className="admin-wizard-stepper" data-testid="admin-wizard-stepper">
      {ADMIN_PRICE_STEPS.map((step) => {
        const isActive = adminWizardStep === step.id;
        const isDone = adminWizardStep > step.id;
        return (
          <button
            type="button"
            key={step.id}
            className={isActive ? "admin-step active" : isDone ? "admin-step done" : "admin-step"}
            onClick={() => goToAdminStep(step.id)}
            data-testid={`admin-step-${step.id}`}
          >
            <span>{step.id}</span>
            <strong>{step.label}</strong>
          </button>
        );
      })}
    </div>
  );

  const renderStepActions = ({ back, next, nextDisabled = false, nextLabel = "Continuar" } = {}) => (
    <div className="admin-wizard-actions">
      {back ? <button type="button" className="secondary-btn" onClick={() => goToAdminStep(back)}>Volver</button> : null}
      {next ? <button type="button" className="calculate-btn compact-calculate-btn" disabled={nextDisabled} onClick={() => goToAdminStep(next)}>{nextLabel}</button> : null}
    </div>
  );

  const renderVariableButton = (item, { affectsCurrentQuote }) => {
    const relation = relationByVariable.get(item.key);
    const showTechnicalCopy = !hasCurrentQuoteContext || adminShowAdvancedVariables;
    return (
      <button
        type="button"
        key={item.key}
        className={adminVariable === item.key ? "admin-variable-item active" : "admin-variable-item"}
        onClick={() => selectAdminVariable(item)}
        data-testid={`admin-variable-${item.key}`}
      >
        <div className="admin-variable-title-row">
          <strong>{item.label}</strong>
          {hasCurrentQuoteContext ? (
            <em className={affectsCurrentQuote ? "context-badge affects" : "context-badge neutral"}>
              {affectsCurrentQuote ? "Afecta esta cotización" : "No afecta esta cotización"}
            </em>
          ) : null}
        </div>
        {showTechnicalCopy ? <span>{item.key}</span> : null}
        {showTechnicalCopy ? <small>{item.description}</small> : null}
        {relation ? <small className="admin-context-note">{relation.detalle}</small> : null}
        <div className="admin-variable-meta">
          <em>{item.value} {item.unit || ""}</em>
          {relation ? <em className="admin-scope-badge">{relationContextBadge(relation)}</em> : null}
          {showTechnicalCopy && isSimpleMode ? <em>{(item.productos_afectados || []).length} productos</em> : null}
          {showTechnicalCopy ? <em>{item.impacta_hoy ? "Impacta hoy" : "Preparada"}</em> : null}
          {showTechnicalCopy ? <em>{item.editable ? "Editable" : "Solo lectura"}</em> : null}
        </div>
        {hasCurrentQuoteContext && relation ? (
          <span
            role="button"
            tabIndex={0}
            className="admin-variable-trace-link"
            data-testid={`admin-variable-trace-${item.key}`}
            onClick={(event) => {
              event.stopPropagation();
              handleOpenVariableInTrace(item.key);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.stopPropagation();
                handleOpenVariableInTrace(item.key);
              }
            }}
          >
            Ver origen en trazabilidad
          </span>
        ) : null}
      </button>
    );
  };

  const renderVariableList = () => (
    <div className="admin-wizard-panel" data-testid="admin-variable-list">
      <div className="admin-wizard-panel-head">
        <span>Paso 1</span>
        <h4>Elegí qué variable querés modificar</h4>
        <p>
          {hasCurrentQuoteContext
            ? `Contexto actual: ${currentProductLabel}. Primero te mostramos las variables conectadas a esa cotización.`
            : "No hay una cotización activa. Se muestran todas las variables editables del sistema."}
        </p>
      </div>

      {hasCurrentQuoteContext ? (
        <div className="admin-context-banner" data-testid="admin-current-quote-context">
          <strong>{currentProductLabel}</strong>
          <span>{describeCurrentQuoteMaterial(lastPayload)} · {lastPayload?.formato || "-"} · {lastPayload?.caras || "-"} · {lastPayload?.cantidad_unidades || "-"} u.</span>
        </div>
      ) : null}

      {hasCurrentQuoteContext ? (
        <div className="admin-relevance-toolbar" data-testid="admin-relevance-toolbar">
          <div>
            <strong>{adminShowAdvancedVariables ? "Modo avanzado de variables" : "Modo simple de variables"}</strong>
            <span>
              {adminShowAdvancedVariables
                ? "Mostrando variables del producto y del sistema que no afectan esta cotización actual."
                : "Solo se muestran variables conectadas a esta cotización."}
            </span>
          </div>
          <button
            type="button"
            className="secondary-btn"
            data-testid="admin-toggle-advanced-variables"
            aria-pressed={adminShowAdvancedVariables ? "true" : "false"}
            onClick={() => setAdminShowAdvancedVariables((current) => !current)}
          >
            {adminShowAdvancedVariables ? "Ocultar variables avanzadas" : "Mostrar variables avanzadas"}
          </button>
        </div>
      ) : null}

      <div className="admin-variable-section" data-testid="admin-relevant-variable-group">
        <div className="admin-variable-section-head">
          <h5>{hasCurrentQuoteContext ? "Variables que afectan esta cotización" : "Variables editables del sistema"}</h5>
          <p>
            {hasCurrentQuoteContext
              ? "Se muestran variables específicas del caso cotizado y variables base/globales que participan en el cálculo o trazabilidad."
              : "Listado global completo porque todavía no hay una cotización calculada."}
          </p>
        </div>
        {contextualVariables.length ? (
          <div className="admin-variable-list wizard-list">
            {contextualVariables.map((item) => renderVariableButton(item, { affectsCurrentQuote: hasCurrentQuoteContext }))}
          </div>
        ) : (
          <div className="info-box" data-testid="admin-no-contextual-variables">
            No hay variables editables específicas detectadas para esta cotización. Podés revisar otras variables del sistema en modo avanzado.
          </div>
        )}
      </div>

      {hasCurrentQuoteContext && adminShowAdvancedVariables ? (
        <details className="admin-variable-section secondary" data-testid="admin-other-variable-group">
          <summary>
            <span>
              <strong>Otras variables editables de este producto</strong>
              <small>Mismo producto, pero otro formato, rango, terminación o condición comercial.</small>
            </span>
            <em>{sameProductOtherCaseVariables.length} variables</em>
          </summary>
          <div className="admin-variable-list wizard-list">
            {sameProductOtherCaseVariables.length
              ? sameProductOtherCaseVariables.map((item) => renderVariableButton(item, { affectsCurrentQuote: false }))
              : <div className="placeholder"><p>No hay otras variables de este producto fuera del caso actual.</p></div>}
          </div>
        </details>
      ) : null}

      {hasCurrentQuoteContext && adminShowAdvancedVariables ? (
        <details className="admin-variable-section secondary" data-testid="admin-system-variable-group">
          <summary>
            <span>
              <strong>Otras variables editables del sistema</strong>
              <small>Variables de otros productos. No afectan esta cotización actual.</small>
            </span>
            <em>{otherSystemVariables.length} variables</em>
          </summary>
          <div className="admin-variable-list wizard-list">
            {otherSystemVariables.length
              ? otherSystemVariables.map((item) => renderVariableButton(item, { affectsCurrentQuote: false }))
              : <div className="placeholder"><p>No hay otras variables del sistema para esta selección.</p></div>}
          </div>
        </details>
      ) : null}
    </div>
  );

  const renderImpactStep = () => (
    <div className="admin-wizard-panel" data-testid="admin-impact-step">
      <div className="admin-wizard-panel-head">
        <span>Paso 2</span>
        <h4>Revisá el impacto actual</h4>
        <p>{isSimpleMode ? "Antes de cambiar un número, revisá qué productos se podrían afectar." : "Antes de cambiar un número, mirá dónde interviene esta variable y qué partes están protegidas por tabla fija PDF."}</p>
      </div>
      <div className="admin-editor-head">
        <div>
          <span>Variable seleccionada</span>
          <strong>{selected?.label || adminVariable}</strong>
          {isAdvancedMode ? <small>Clave técnica: {selected?.key || adminVariable}</small> : null}
        </div>
        {isAdvancedMode ? <em>{selected?.impacta_hoy ? "Impacta hoy" : "Preparada"}</em> : null}
      </div>
      {hasCurrentQuoteContext && selected ? (
        <div className="admin-origin-actions">
          <button type="button" className="secondary-btn" data-testid="admin-open-trace-origin" onClick={() => handleOpenVariableInTrace(selected.key)}>
            Ver origen en trazabilidad
          </button>
          <span>Abre la cotización actual y selecciona el nodo de esta variable si participa en la cadena.</span>
        </div>
      ) : null}
      <div className="admin-current-grid">
        <div><span>Valor actual</span><strong>{selected?.value ?? "-"}</strong></div>
        <div><span>Unidad</span><strong>{selected?.unit || "-"}</strong></div>
        {isSimpleMode ? <div><span>Productos afectados</span><strong>{productosAfectados.length}</strong></div> : null}
        {isAdvancedMode ? <div><span>Estado editable</span><strong>{selected?.editable ? "Editable en sistema" : "No editable"}</strong></div> : null}
        {isAdvancedMode ? <div><span>Estado operativo</span><strong>{selected?.estado || selected?.estado_operativo || "-"}</strong></div> : null}
      </div>
      <h4>Productos afectados</h4>
      {productosAfectados.length ? (
        <div className="admin-impact-chips" data-testid="admin-products-affected">
          {productosAfectados.map((product) => <span key={product}>{product}</span>)}
        </div>
      ) : <p className="range-hint">No hay productos afectados informados para esta variable.</p>}
      <div className="warning-box">
        {isSimpleMode
          ? "Los precios finales protegidos no se editan directamente. El preview avisa antes de guardar."
          : "Los precios finales fijos PDF y factores calibrados no se editan directamente desde acá. Si una tabla está protegida, el preview lo informa antes de guardar."}
      </div>
      {renderStepActions({ back: 1, next: 3 })}
    </div>
  );

  const renderValueStep = () => (
    <div className="admin-wizard-panel" data-testid="admin-new-value-step">
      <div className="admin-wizard-panel-head">
        <span>Paso 3</span>
        <h4>Ingresá el nuevo valor</h4>
        <p>El sistema valida que sea numérico, permitido, distinto al valor actual y dentro de rango.</p>
      </div>
      <div className="admin-current-grid">
        <div><span>Valor actual</span><strong>{selected?.value ?? "-"}</strong></div>
        <div><span>Nuevo valor</span><strong>{adminNewValue || "-"}</strong></div>
        <div><span>Diferencia estimada</span><strong>{deltaValue == null ? "-" : deltaValue.toFixed(4)}</strong></div>
        <div><span>Diferencia %</span><strong>{deltaPercent == null ? "-" : `${deltaPercent.toFixed(2)}%`}</strong></div>
      </div>
      <label className="admin-new-value">
        <span>Nuevo valor para {selected?.label || adminVariable}</span>
        <input
          type="number"
          data-testid="admin-new-value-input"
          value={adminNewValue}
          placeholder={selected ? String(selected.value) : ""}
          min={selected?.min}
          max={selected?.max}
          step={selected?.step || "0.01"}
          onChange={(event) => {
            setAdminNewValue(event.target.value);
            setAdminPreview(null);
            setAdminMsg("");
            setAdminError("");
          }}
        />
      </label>
      {valueValidation ? <div className="error-box" data-testid="admin-value-validation">{valueValidation}</div> : <div className="info-box">Valor válido para previsualizar.</div>}
      {renderStepActions({ back: 2, next: 4, nextDisabled: Boolean(valueValidation) })}
    </div>
  );

  const renderPreviewStep = () => (
    <div className="admin-wizard-panel" data-testid="admin-preview-step">
      <div className="admin-wizard-panel-head">
        <span>Paso 4</span>
        <h4>Previsualizá el impacto</h4>
        <p>El preview no guarda cambios. Sirve para revisar diferencias, advertencias y productos afectados.</p>
      </div>
      <div className="principal-actions">
        <button
          type="button"
          className="secondary-btn"
          data-testid="admin-preview-button"
          onClick={handleAdminPreview}
          disabled={!canPreviewAdmin}
        >
          Previsualizar impacto
        </button>
        <button type="button" className="secondary-btn" onClick={() => goToAdminStep(3)}>Volver a editar valor</button>
      </div>
      {valueValidation ? <div className="error-box">{valueValidation}</div> : null}
      {adminPreview ? renderPreviewPanel() : <div className="placeholder"><p>Generá un preview para habilitar la confirmación.</p></div>}
    </div>
  );

  const renderPreviewPanel = () => (
    <div className="admin-preview-panel" data-testid="admin-preview-panel">
      <h4>Preview de impacto</h4>
      <div className="admin-current-grid">
        <div><span>Actual</span><strong>{adminPreview.valor_actual}</strong></div>
        <div><span>Nuevo</span><strong>{adminPreview.nuevo_valor}</strong></div>
        <div><span>Diferencia</span><strong>{adminPreview.diferencia}</strong></div>
        <div><span>Diferencia %</span><strong>{adminPreview.diferencia_porcentual == null ? "-" : `${adminPreview.diferencia_porcentual.toFixed(2)}%`}</strong></div>
      </div>
      {adminPreview.advertencias?.length ? <div className="warning-box">{adminPreview.advertencias.join(" ? ")}</div> : null}
      <h4>Productos afectados</h4>
      <div className="impact-results">
        {previewImpacts.map((impact) => (
          <article className={`impact-relation-card ${impact.estado === "bloqueado" ? "bloqueado" : impact.impacta_hoy ? "variable_madre" : "preparada"}`} key={`${impact.variable}-${impact.producto_key}-${impact.componente}`}>
            <div className="impact-relation-head">
              <div>
                <strong>{impact.producto}</strong>
                <span>{isAdvancedMode ? impact.componente : "Producto afectado"}</span>
              </div>
              <em>{impact.impacta_hoy ? "Impacta hoy" : "Documentado"}</em>
            </div>
            <p>{impact.detalle}</p>
            {isAdvancedMode ? <small>Fuente: {impact.fuente}</small> : null}
          </article>
        ))}
      </div>
      {previewExamples.length ? (
        <>
          <h4>Precios de ejemplo</h4>
          <div className="admin-example-grid">
            {previewExamples.map((example) => (
              <article key={example.nombre}>
                <strong>{example.nombre}</strong>
                <span>Antes: {example.antes == null ? "-" : formatMoney(example.antes)}</span>
                <span>Después: {example.despues == null ? "-" : formatMoney(example.despues)}</span>
                <small>{example.detalle}</small>
              </article>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );

  const renderConfirmStep = () => (
    <div className="admin-wizard-panel" data-testid="admin-confirm-step">
      <div className="admin-wizard-panel-head">
        <span>Paso 5</span>
        <h4>Confirmá y guardá</h4>
        <p>Este cambio modifica una variable operativa. Revisá el impacto antes de guardar.</p>
      </div>
      <div className="warning-box" data-testid="admin-confirmation-copy">
        Vas a cambiar {selected?.label || adminVariable} de {selected?.value ?? adminPreview?.valor_actual ?? "-"} a {adminNewValue}. Se creará backup e historial. ¿Confirmás?
      </div>
      {adminPreview ? renderPreviewPanel() : <div className="placeholder"><p>Primero generá un preview válido para este valor.</p></div>}
      <div className="principal-actions">
        <button type="button" className="secondary-btn" onClick={() => goToAdminStep(4)}>Volver al preview</button>
        <button
          type="button"
          className="calculate-btn compact-calculate-btn"
          data-testid="admin-apply-button"
          onClick={handleAdminApply}
          disabled={!canConfirmAdmin}
        >
          Guardar cambio
        </button>
      </div>
    </div>
  );

  const renderHistoryStep = () => (
    <section className="admin-wizard-panel admin-history" data-testid="admin-history">
      <div className="admin-wizard-panel-head">
        <span>Paso 6</span>
        <h4>Historial reciente y backups</h4>
        <p>Registro de cambios aplicados desde el sistema. Podés previsualizar y restaurar una variable editable con backup automático.</p>
      </div>
      {renderAdminHistoryEntries({ limit: 10 })}
      {renderRollbackPreviewPanel()}
      {renderStepActions({ back: 5 })}
    </section>
  );

  return (
    <ModificarPreciosWizard
      adminError={adminError}
      adminMsg={adminMsg}
      adminLoading={adminLoading}
      adminPrices={adminPrices}
      renderAdminStepper={renderAdminStepper}
      renderCurrentPriceChain={renderCurrentPriceChain}
      adminWizardStep={adminWizardStep}
      renderVariableList={renderVariableList}
      renderImpactStep={renderImpactStep}
      renderValueStep={renderValueStep}
      renderPreviewStep={renderPreviewStep}
      renderConfirmStep={renderConfirmStep}
      renderHistoryStep={renderHistoryStep}
    />
  );
}
