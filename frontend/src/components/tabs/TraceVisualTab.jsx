import {
  buildCurrentQuoteSummary,
  describeCurrentQuoteMaterial,
  formatMoney,
  quoteUsesFixedPdf,
} from "../../lib/cotizacionLogic";
import {
  formatTraceValue,
  initialTraceZoom,
  layoutTraceGraph,
  simplifyCurrentQuoteGraph,
  traceNodeSize,
  traceNodeVisualType,
} from "../../lib/traceGraphEngine";

export default function TraceVisualTab({
  traceGraph,
  traceShowTechnicalGraph,
  selectedTraceNodeId,
  traceCase,
  traceMode,
  getAdminVariableByKey,
  lastPayload,
  result,
  TRACE_GRAPH_CASES,
  TRACE_MODES,
  TRACE_TYPE_LABELS,
  TRACE_ZOOM_STEP,
  setTraceMode,
  setTraceCase,
  setTraceGraph,
  setSelectedTraceNodeId,
  setTraceZoom,
  setTraceShowTechnicalGraph,
  setTraceError,
  handleLoadCurrentQuoteGraph,
  traceLoading,
  loadTraceGraph,
  traceError,
  traceZoom,
  setTraceZoomLevel,
  resetTraceView,
  fitTraceGraphToView,
  traceFullscreen,
  setTraceFullscreen,
  traceGraphViewportRef,
  handleTraceWheel,
  handleTracePanStart,
  handleTracePanMove,
  stopTracePan,
  handleTraceModifyVariable,
}) {
  const baseGraph = traceGraph || { nodes: [], edges: [], legend: {} };
  const graph = traceShowTechnicalGraph ? baseGraph : simplifyCurrentQuoteGraph(baseGraph);
  const { positions, width, height } = layoutTraceGraph(graph);
  const selectedNode = graph.nodes.find((node) => node.id === selectedTraceNodeId) || graph.nodes[0] || null;
  const selectedCase = TRACE_GRAPH_CASES.find((item) => item.value === traceCase);
  const isCurrentMode = traceMode === "cotizacion_actual";
  const selectedVariableKey = selectedNode?.variable_key || (selectedNode?.editable_en_sistema ? selectedNode.id : null) || (getAdminVariableByKey(selectedNode?.id) ? selectedNode.id : null);
  const selectedVariable = selectedVariableKey ? getAdminVariableByKey(selectedVariableKey) : null;
  const selectedIsEditable = Boolean(selectedVariableKey && (selectedNode?.editable_en_sistema || selectedVariable?.editable));
  const selectedFixedPdf = selectedNode ? quoteUsesFixedPdf(lastPayload, result, selectedNode.relation || selectedNode) : false;
  const quoteSummary = isCurrentMode ? buildCurrentQuoteSummary(lastPayload, result) : null;

  return (
    <section className="card result-card trace-visual-card">
      <div className="card-head">
        <div>
          <h3 data-testid="trace-visual-title">Trazabilidad visual avanzada</h3>
          <p>Modo avanzado: relaciones entre variable madre, derivado, factor y precio final. Es lectura: no modifica precios.</p>
        </div>
        <span>{isCurrentMode ? "Cotización actual" : graph.producto || selectedCase?.label || "Grafo"}</span>
      </div>

      <div className="trace-mode-box">
        <span>Modo de trazabilidad</span>
        <div className="trace-mode-options" role="group" aria-label="Modo de trazabilidad">
          {TRACE_MODES.map((mode) => (
            <button
              key={mode.value}
              type="button"
              className={traceMode === mode.value ? "trace-mode-pill active" : "trace-mode-pill"}
              data-testid={`trace-mode-${mode.value}`}
              aria-pressed={traceMode === mode.value ? "true" : "false"}
              onClick={() => {
                setTraceMode(mode.value);
                setTraceGraph(null);
                setSelectedTraceNodeId(null);
                setTraceZoom(1);
                setTraceShowTechnicalGraph(false);
                setTraceError("");
              }}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <div className="trace-toolbar">
        {isCurrentMode ? (
          <>
            <div className="trace-current-summary" data-testid="trace-current-summary">
              {lastPayload && result ? (
                <>
                  <strong>{lastPayload.categoria || "Cotización actual"}</strong>
                  <span>{describeCurrentQuoteMaterial(lastPayload)} · {lastPayload.formato || "-"} · {lastPayload.caras || "-"} · {lastPayload.cantidad_unidades || "-"} u.</span>
                </>
              ) : (
                <span>Primero calculá una cotización para ver su trazabilidad visual.</span>
              )}
            </div>
            <button type="button" className="secondary-button" data-testid="trace-current-load-button" onClick={handleLoadCurrentQuoteGraph} disabled={!lastPayload || !result}>
              Cargar grafo de cotización actual
            </button>
          </>
        ) : (
          <>
            <label>
              <span>Casos de lógica general</span>
              <select
                data-testid="trace-case-select"
                value={traceCase}
                onChange={(event) => {
                  const nextCase = event.target.value;
                  setTraceCase(nextCase);
                  setTraceGraph(null);
                  setSelectedTraceNodeId(null);
                  setTraceZoom(1);
                  setTraceShowTechnicalGraph(false);
                }}
              >
                {TRACE_GRAPH_CASES.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
            <button type="button" className="secondary-button" data-testid="trace-load-button" onClick={() => loadTraceGraph(traceCase)} disabled={traceLoading}>
              {traceLoading ? "Cargando..." : "Cargar caso fijo"}
            </button>
          </>
        )}
      </div>

      {traceError ? <div className="error-banner">{traceError}</div> : null}

      {quoteSummary && !traceShowTechnicalGraph ? (
        <section className="trace-quote-summary-card" data-testid="trace-quote-summary-card">
          <div>
            <span>Resumen de esta cotización</span>
            <strong>{quoteSummary.sentence}</strong>
            <p>{quoteSummary.source}</p>
          </div>
          <aside>
            <small>Total final</small>
            <b>{quoteSummary.total}</b>
          </aside>
        </section>
      ) : null}

      <div className="trace-zoom-toolbar" data-testid="trace-zoom-toolbar">
        <div className="trace-zoom-help">
          {traceShowTechnicalGraph
            ? "Grafo técnico completo: muestra nodos de apoyo, ramas y variables auxiliares."
            : "Grafo simple: camino principal del precio actual, de la entrada al total final."}
        </div>
        <div className="trace-zoom-controls" role="group" aria-label="Controles de zoom del grafo">
          <button
            type="button"
            data-testid="trace-toggle-technical-graph"
            aria-pressed={traceShowTechnicalGraph ? "true" : "false"}
            onClick={() => {
              const next = !traceShowTechnicalGraph;
              setTraceShowTechnicalGraph(next);
              setSelectedTraceNodeId(null);
              setTraceZoom(initialTraceZoom(next));
            }}
            disabled={!baseGraph.nodes.length}
          >
            {traceShowTechnicalGraph ? "Ver grafo simple" : "Ver grafo técnico completo"}
          </button>
          <button type="button" data-testid="trace-zoom-out" onClick={() => setTraceZoomLevel(traceZoom - TRACE_ZOOM_STEP)} disabled={!graph.nodes.length}>-</button>
          <strong data-testid="trace-zoom-indicator">{Math.round(traceZoom * 100)}%</strong>
          <button type="button" data-testid="trace-zoom-in" onClick={() => setTraceZoomLevel(traceZoom + TRACE_ZOOM_STEP)} disabled={!graph.nodes.length}>+</button>
          <button type="button" data-testid="trace-zoom-reset" onClick={resetTraceView} disabled={!graph.nodes.length}>100%</button>
          <button type="button" data-testid="trace-fit-view" onClick={() => fitTraceGraphToView(width, height)} disabled={!graph.nodes.length}>Ajustar</button>
          <button type="button" data-testid="trace-fullscreen-toggle" onClick={() => setTraceFullscreen((current) => !current)} disabled={!graph.nodes.length}>
            {traceFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          </button>
        </div>
      </div>

      <div className="trace-legend" data-testid="trace-legend">
        {Object.entries(graph.legend || {}).map(([type, label]) => (
          <span className={`legend-chip ${type}`} key={type}><i />{TRACE_TYPE_LABELS[type] || type}: {label}</span>
        ))}
      </div>

      <div className={traceFullscreen ? "trace-layout fullscreen" : "trace-layout"}>
        <div
          ref={traceGraphViewportRef}
          className="trace-graph-card"
          data-testid="trace-graph-container"
          onWheel={handleTraceWheel}
          onMouseDown={handleTracePanStart}
          onMouseMove={handleTracePanMove}
          onMouseUp={stopTracePan}
          onMouseLeave={stopTracePan}
        >
          {graph.nodes.length ? (
            <svg
              className="trace-svg"
              data-layout="vertical"
              style={{ width: `${width * traceZoom}px`, height: `${height * traceZoom}px` }}
              viewBox={`0 0 ${width} ${height}`}
              role="img"
              aria-label="Grafo de trazabilidad de precios"
            >
              <defs>
                <marker id="trace-arrow" markerWidth="13" markerHeight="13" refX="11" refY="4" orient="auto" markerUnits="strokeWidth">
                  <path d="M0,0 L0,8 L11,4 z" fill="#8aa4d6" />
                </marker>
              </defs>
              {graph.simple && graph.stages?.length ? (
                <g className="trace-stage-layer" data-testid="trace-stage-labels">
                  {graph.stages.map((stage) => (
                    <g key={stage.key} className="trace-stage-label" transform={`translate(${stage.x} ${stage.y})`}>
                      <rect width="214" height="38" rx="19" />
                      <text x="18" y="25">{stage.label}</text>
                    </g>
                  ))}
                </g>
              ) : null}
              {graph.edges.map((edge) => {
                const from = positions[edge.source];
                const to = positions[edge.target];
                if (!from || !to) return null;
                const sourceNode = graph.nodes.find((node) => node.id === edge.source);
                const targetNode = graph.nodes.find((node) => node.id === edge.target);
                const sourceSize = traceNodeSize(sourceNode);
                const targetSize = traceNodeSize(targetNode);
                const startX = from.x + sourceSize.width / 2;
                const startY = from.y + sourceSize.height;
                const endX = to.x + targetSize.width / 2;
                const endY = to.y - 12;
                const curve = Math.max(70, Math.abs(endY - startY) / 2);
                return (
                  <g key={edge.id}>
                    <path className="trace-edge" d={`M ${startX} ${startY} C ${startX} ${startY + curve}, ${endX} ${endY - curve}, ${endX} ${endY}`} markerEnd="url(#trace-arrow)" />
                    <text className="trace-edge-label" x={(startX + endX) / 2 + 8} y={(startY + endY) / 2}>{edge.label}</text>
                  </g>
                );
              })}
              {graph.nodes.map((node) => {
                const pos = positions[node.id] || { x: 0, y: 0 };
                const visualType = traceNodeVisualType(node);
                const selected = selectedNode?.id === node.id;
                const size = traceNodeSize(node);
                const title = node.simple_label || node.label;
                const value = node.simple_value || formatTraceValue(node);
                const badge = node.simple_badge || TRACE_TYPE_LABELS[visualType] || visualType;
                const isFinal = node.id === "total_final";
                const badgeWidth = Math.min(210, Math.max(78, String(badge).length * 7 + 28));
                return (
                  <g key={node.id} data-testid={`trace-node-${node.id}`} className={`trace-node ${visualType} ${node.simple_weight || ""} ${selected ? "selected" : ""}`} transform={`translate(${pos.x} ${pos.y})`} onClick={() => setSelectedTraceNodeId(node.id)} tabIndex="0" role="button" aria-label={`Nodo ${node.label}`}>
                    <rect className="trace-node-rect" width={size.width} height={size.height} rx={isFinal ? "28" : "22"} />
                    <text className="trace-node-title" x="22" y={isFinal ? "44" : "40"}>{title}</text>
                    <text className="trace-node-value" x="22" y={isFinal ? "84" : "78"}>{value}</text>
                    <g className="trace-node-badge" transform={`translate(22 ${isFinal ? 108 : 98})`}>
                      <rect width={badgeWidth} height="24" rx="12" />
                      <text x="14" y="16">{badge}</text>
                    </g>
                  </g>
                );
              })}
            </svg>
          ) : (
            <div className="placeholder">
              <p>
                {traceLoading
                  ? "Cargando grafo..."
                  : isCurrentMode
                    ? "Presioná Cargar grafo de cotización actual para ver la trazabilidad del último cálculo."
                    : "Elegí un caso y presioná Cargar grafo."}
              </p>
            </div>
          )}
        </div>

        <aside className="trace-detail" data-testid="trace-node-detail">
          <h4>Detalle del nodo</h4>
          {selectedNode ? (
            <>
              <div className="trace-detail-hero">
                <span>{TRACE_TYPE_LABELS[traceNodeVisualType(selectedNode)] || selectedNode.type}</span>
                <strong>{selectedNode.label}</strong>
                <p><b>Qué es:</b> {selectedNode.description || "Nodo de la cadena causal del precio."}</p>
              </div>
              <div className="trace-detail-grid">
                <div><strong>Valor</strong><span>{formatTraceValue(selectedNode)}</span></div>
                <div><strong>Por qué aparece</strong><span>{selectedNode.context_badge || selectedNode.operation || "Forma parte del camino del precio actual."}</span></div>
                <div><strong>Afecta esta cotización</strong><span>{selectedNode.impacta_hoy ? (selectedFixedPdf ? "Base técnica / preview" : "Sí, en el cálculo actual") : "No directamente"}</span></div>
                <div><strong>Se puede modificar</strong><span>{selectedIsEditable ? "Sí, con preview y backup" : "No desde este nodo"}</span></div>
                <div><strong>Si se modifica</strong><span>{selectedIsEditable ? (selectedFixedPdf ? "Cambia trazabilidad o preview; el precio final sigue PDF/lista." : "Cambia el cálculo previsualizado antes de guardar.") : "No aplica."}</span></div>
                <div><strong>Fuente</strong><span>{selectedNode.source || selectedVariable?.source_file || "-"}</span></div>
              </div>
              <details className="trace-technical-detail">
                <summary>Ver detalle técnico</summary>
                <div className="trace-detail-grid">
                  <div><strong>Clave técnica</strong><span>{selectedVariableKey || selectedNode.id}</span></div>
                  <div><strong>Tipo variable</strong><span>{selectedVariable?.tipo || selectedNode.variable_type || selectedNode.type || "-"}</span></div>
                  <div><strong>Operación</strong><span>{selectedNode.operation || "-"}</span></div>
                  <div><strong>Observación</strong><span>{selectedNode.observation || selectedNode.editable_reason || "-"}</span></div>
                </div>
              </details>
              <div className={selectedIsEditable ? "trace-action-box editable" : "trace-action-box"}>
                {selectedIsEditable ? (
                  <>
                    <strong>Este nodo se puede operar</strong>
                    <p>{selectedFixedPdf ? "La variable cambia base técnica o preview; el precio final actual sigue validado por matriz PDF/lista." : "La variable participa en el cálculo actual y puede previsualizarse antes de guardar."}</p>
                    <button type="button" className="calculate-btn compact-calculate-btn" data-testid="trace-modify-variable-button" onClick={() => handleTraceModifyVariable(selectedVariableKey)}>
                      Modificar esta variable
                    </button>
                  </>
                ) : (
                  <>
                    <strong>No editable desde aquí</strong>
                    <p>{selectedNode.editable_reason || "Este nodo representa una tabla PDF fija, derivación, regla interna, dato documentado o resultado calculado."}</p>
                  </>
                )}
              </div>
            </>
          ) : (
            <p>Seleccioná un nodo del grafo para ver fuente, operación y observación.</p>
          )}
        </aside>
      </div>
    </section>
  );
}
