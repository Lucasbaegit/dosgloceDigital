import { useEffect, useRef, useState } from "react";
import {
  buildCurrentQuoteTraceGraph,
  clampTraceZoom,
  initialTraceZoom,
} from "../lib/traceGraphEngine";
import {
  fetchAdminPreciosVariables,
  fetchTraceGraph,
  fetchVariablesImpacto,
} from "../api/bajadasV2Api";

export default function useTraceGraph({
  activeTab,
  understandMode,
  lastPayload,
  result,
  impactData,
  setImpactData,
  adminPrices,
  setAdminPrices,
  getCurrentEditableRelations,
  traceZoomStep,
}) {
  const [traceMode, setTraceMode] = useState("cotizacion_actual");
  const [traceCase, setTraceCase] = useState("click_bajadas");
  const [traceGraph, setTraceGraph] = useState(null);
  const [traceLoading, setTraceLoading] = useState(false);
  const [traceError, setTraceError] = useState("");
  const [selectedTraceNodeId, setSelectedTraceNodeId] = useState(null);
  const [traceZoom, setTraceZoom] = useState(1);
  const [traceFullscreen, setTraceFullscreen] = useState(false);
  const [traceShowTechnicalGraph, setTraceShowTechnicalGraph] = useState(false);
  const traceGraphViewportRef = useRef(null);
  const traceDragRef = useRef(null);

  const loadTraceGraph = async (selectedCase = traceCase) => {
    try {
      setTraceLoading(true);
      setTraceError("");
      const graph = await fetchTraceGraph({ caso: selectedCase });
      setTraceGraph(graph);
      setSelectedTraceNodeId(graph?.nodes?.[0]?.id || null);
      setTraceZoom(initialTraceZoom(true));
      setTraceShowTechnicalGraph(false);
    } catch (err) {
      setTraceGraph(null);
      setSelectedTraceNodeId(null);
      setTraceError(err.message || "No se pudo cargar la trazabilidad visual.");
    } finally {
      setTraceLoading(false);
    }
  };

  const handleLoadCurrentQuoteGraph = async () => {
    setTraceError("");

    if (!result || !lastPayload) {
      setTraceGraph(null);
      setSelectedTraceNodeId(null);
      setTraceError("Primero calculÃ¡ una cotizaciÃ³n para ver su trazabilidad visual.");
      return;
    }

    try {
      setTraceLoading(true);
      let localImpactData = impactData;
      let localAdminPrices = adminPrices;
      try {
        if (!localImpactData) {
          localImpactData = await fetchVariablesImpacto();
          setImpactData(localImpactData);
        }
        if (!localAdminPrices) {
          localAdminPrices = await fetchAdminPreciosVariables();
          setAdminPrices(localAdminPrices);
        }
      } catch {
        // El grafo base de la cotizaciÃ³n no debe depender de metadata editable.
        localImpactData = localImpactData || { relaciones: [] };
        localAdminPrices = localAdminPrices || { variables: [] };
      }
      const variableByKey = new Map((localAdminPrices?.variables || []).map((item) => [item.key, item]));
      const graph = buildCurrentQuoteTraceGraph(lastPayload, result, {
        editableRelations: getCurrentEditableRelations(localImpactData),
        variableByKey,
      });

      if (!graph || !Array.isArray(graph.nodes) || graph.nodes.length === 0) {
        setTraceGraph(null);
        setSelectedTraceNodeId(null);
        setTraceError("No se pudo construir el grafo de la cotizaciÃ³n actual.");
        return;
      }

      setTraceGraph(graph);
      setSelectedTraceNodeId(graph.nodes[0]?.id ?? null);
      setTraceZoom(initialTraceZoom(false));
      setTraceShowTechnicalGraph(false);
    } catch (err) {
      setTraceGraph(null);
      setSelectedTraceNodeId(null);
      setTraceError(err.message || "No se pudo construir el grafo de la cotizaciÃ³n actual.");
    } finally {
      setTraceLoading(false);
    }
  };

  const setTraceZoomLevel = (nextZoom) => {
    setTraceZoom(clampTraceZoom(nextZoom));
  };

  const resetTraceView = () => {
    setTraceZoom(initialTraceZoom(traceShowTechnicalGraph || traceMode !== "cotizacion_actual"));
    requestAnimationFrame(() => {
      const viewport = traceGraphViewportRef.current;
      if (!viewport) return;
      viewport.scrollLeft = 0;
      viewport.scrollTop = 0;
    });
  };

  const fitTraceGraphToView = (graphWidth, graphHeight) => {
    const viewport = traceGraphViewportRef.current;
    if (!viewport || !graphWidth || !graphHeight) return;
    const nextZoom = clampTraceZoom(Math.min(
      (viewport.clientWidth - 48) / graphWidth,
      (viewport.clientHeight - 48) / graphHeight
    ));
    setTraceZoom(nextZoom);
    requestAnimationFrame(() => {
      viewport.scrollLeft = Math.max(0, (graphWidth * nextZoom - viewport.clientWidth) / 2);
      viewport.scrollTop = Math.max(0, (graphHeight * nextZoom - viewport.clientHeight) / 2);
    });
  };

  const handleTraceWheel = (event) => {
    if (!traceGraph?.nodes?.length) return;
    event.preventDefault();
    const direction = event.deltaY > 0 ? -1 : 1;
    setTraceZoom((current) => clampTraceZoom(current + direction * traceZoomStep));
  };

  const handleTracePanStart = (event) => {
    if (event.button !== 0) return;
    if (event.target?.closest?.(".trace-node")) return;
    const viewport = traceGraphViewportRef.current;
    if (!viewport) return;
    traceDragRef.current = {
      x: event.clientX,
      y: event.clientY,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
    };
    viewport.classList.add("is-panning");
  };

  const handleTracePanMove = (event) => {
    const drag = traceDragRef.current;
    const viewport = traceGraphViewportRef.current;
    if (!drag || !viewport) return;
    viewport.scrollLeft = drag.scrollLeft - (event.clientX - drag.x);
    viewport.scrollTop = drag.scrollTop - (event.clientY - drag.y);
  };

  const stopTracePan = () => {
    traceDragRef.current = null;
    traceGraphViewportRef.current?.classList.remove("is-panning");
  };

  useEffect(() => {
    if (activeTab !== "Entender un precio" || understandMode !== "trazabilidad" || traceGraph || traceLoading) return;
    if (traceMode === "casos_generales") {
      loadTraceGraph(traceCase);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, understandMode, traceMode]);

  return {
    traceMode,
    setTraceMode,
    traceCase,
    setTraceCase,
    traceGraph,
    setTraceGraph,
    traceLoading,
    traceError,
    setTraceError,
    selectedTraceNodeId,
    setSelectedTraceNodeId,
    traceZoom,
    setTraceZoom,
    traceFullscreen,
    setTraceFullscreen,
    traceShowTechnicalGraph,
    setTraceShowTechnicalGraph,
    traceGraphViewportRef,
    loadTraceGraph,
    handleLoadCurrentQuoteGraph,
    setTraceZoomLevel,
    resetTraceView,
    fitTraceGraphToView,
    handleTraceWheel,
    handleTracePanStart,
    handleTracePanMove,
    stopTracePan,
  };
}

