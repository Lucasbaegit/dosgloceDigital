import {
  describeQuoteOperationalAdditions,
  describeQuoteTerminacion,
  formatMoney,
} from "../../lib/cotizacionLogic";

const firstNumber = (...values) => {
  for (const value of values) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return null;
};

const showMoney = (...values) => {
  const numeric = firstNumber(...values);
  return numeric == null ? "-" : formatMoney(numeric);
};

const compactJoin = (items) => items.filter(Boolean).join(" · ");

function BreakdownLine({ label, value, muted = false }) {
  if (value === null || value === undefined || value === "" || value === 0 || value === "$0") return null;
  return (
    <div className={muted ? "result-breakdown-line muted" : "result-breakdown-line"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function TechnicalTree({ result }) {
  const tree = result?.trazabilidad?.arbol_calculo;
  if (!tree || typeof tree !== "object") return null;
  return (
    <details className="result-technical-tree">
      <summary>Árbol técnico de cálculo</summary>
      <div className="result-technical-grid">
        <BreakdownLine label="Material" value={showMoney(tree.material)} muted />
        <BreakdownLine label="Click" value={showMoney(tree.click)} muted />
        <BreakdownLine label="Laca / terminación" value={tree.laca ?? "-"} muted />
        <BreakdownLine label="Corte" value={tree.corte ?? "-"} muted />
        <BreakdownLine label="Subtotal fórmula" value={showMoney(tree.subtotal_formula_excel)} muted />
        <BreakdownLine label="Factor ajuste PDF" value={tree.factor_ajuste_pdf ?? "-"} muted />
        <BreakdownLine label="Total final calibrado" value={showMoney(tree.total_final)} />
      </div>
    </details>
  );
}

export default function ResultadoCotizacion({
  result,
  form,
  inferred,
  loading,
  lastPayload,
  derivedRange,
  isSimpleMode,
  isMatrixProduct,
  isBajadasFlow,
  isAutoadhesivas,
}) {
  const finalTotal = firstNumber(
    result?.total_con_urgencia,
    result?.total_sin_iva,
    result?.precio_con_recargo_urgencia,
    result?.precio_sin_iva
  );
  const totalSinIva = firstNumber(result?.total_sin_iva, result?.precio_sin_iva);
  const unitSinIva = firstNumber(result?.precio_unitario_sin_iva, result?.precio_sin_iva);
  const unitWithUrgency = firstNumber(result?.precio_unitario_con_urgencia, result?.precio_con_recargo_urgencia, unitSinIva);
  const baseUnit = firstNumber(result?.precio_unitario_base_sin_iva, unitSinIva);
  const unitWithAddition = firstNumber(result?.precio_unitario_con_adicional_sin_iva, unitSinIva);
  const quantity = result?.cantidad_unidades ?? form?.cantidad_unidades;
  const rangeOrMatrix = isMatrixProduct
    ? (result?.cantidad_unidades ?? form?.cantidad_unidades)
    : (result?.cantidad_rango_aplicado ?? derivedRange ?? "-");
  const terminacion = describeQuoteTerminacion(lastPayload);
  const operationalAdditions = describeQuoteOperationalAdditions(lastPayload, result);
  const additionSummary = compactJoin([
    terminacion && terminacion !== "No aplica" ? terminacion : null,
    operationalAdditions && operationalAdditions !== "No aplica" ? operationalAdditions : null,
  ]) || "Sin adicional";

  return (
    <section className="card result-card result-sticky" data-testid="result-panel">
      <div className="card-head">
        <h3>2. Resultado</h3>
        <span>{loading ? "Consultando API..." : "Actualizado"}</span>
      </div>

      {!result ? (
        <div className="placeholder"><p>Completá los datos y presioná Calcular.</p></div>
      ) : (
        <div className="quote-result-clean">
          <div className="quote-result-hero">
            <div>
              <span className="quote-result-kicker">Precio final</span>
              <div className="quote-result-total">{showMoney(finalTotal)}</div>
              <p>Sin IVA: {showMoney(totalSinIva)}</p>
            </div>
            <div className="quote-result-unit">
              <span>Unitario</span>
              <strong>{showMoney(unitWithUrgency)}</strong>
              <small>Base: {showMoney(baseUnit)}</small>
            </div>
          </div>

          <div className="result-main">
            <div className="unit-panel">
              <h4>Precio unitario</h4>
              <div className="unit-values">
                <p><span>Sin IVA</span><strong>{showMoney(unitSinIva)}</strong></p>
                <p><span>Con urgencia</span><strong>{showMoney(unitWithUrgency)}</strong></p>
              </div>
            </div>
            <div className="total-panel">
              <p>Total final con urgencia</p>
              <h3>{showMoney(finalTotal)}</h3>
              <small>Total sin IVA: {showMoney(totalSinIva)}</small>
            </div>
          </div>

          <div className="result-breakdown-card" data-testid="quote-breakdown">
            <div className="result-breakdown-head">
              <strong>Desglose de cotización</strong>
              <span>{result.regla_aplicada || result.trazabilidad?.modo_calculo || "Regla no informada"}</span>
            </div>
            <BreakdownLine label="Precio base unitario" value={showMoney(baseUnit)} />
            <BreakdownLine label="Adicional laminado / laca unitario" value={showMoney(result.adicional_unitario_sin_iva)} muted />
            <BreakdownLine label="Subtotal adicional laminado / laca" value={showMoney(result.total_adicional_sin_iva)} muted />
            <BreakdownLine label="Adicional hoja 4 unitario" value={showMoney(result.adicional_hoja4_unitario_sin_iva)} muted />
            <BreakdownLine label="Subtotal hoja 4" value={showMoney(result.total_adicional_hoja4_sin_iva)} muted />
            <BreakdownLine label="Troquelado unitario" value={showMoney(result.adicional_troquelado_unitario_sin_iva)} muted />
            <BreakdownLine label="Subtotal troquelado" value={showMoney(result.total_adicional_troquelado_sin_iva)} muted />
            <BreakdownLine label="Unitario con adicionales" value={showMoney(unitWithAddition)} />
            <BreakdownLine label="Cantidad" value={quantity} />
            <BreakdownLine label={isMatrixProduct ? "Cantidad de matriz" : "Rango aplicado"} value={rangeOrMatrix} />
            <BreakdownLine label="Total final" value={showMoney(finalTotal)} />
          </div>

          {isSimpleMode ? (
            <div className="simple-summary-card" data-testid="quote-simple-summary">
              <strong>Resumen simple del cálculo</strong>
              <div className="detail-list compact-detail-list">
                <div><strong>Material / papel</strong><span>{lastPayload?.material ?? lastPayload?.papel ?? form?.material ?? "-"}</span></div>
                <div><strong>Impresión</strong><span>{lastPayload?.caras ?? inferred?.caras}</span></div>
                <div><strong>Cantidad</strong><span>{quantity}</span></div>
                <div><strong>{isMatrixProduct ? "Cantidad de matriz" : "Rango aplicado"}</strong><span>{rangeOrMatrix}</span></div>
                <div><strong>Terminación / adicionales</strong><span>{additionSummary}</span></div>
                <div><strong>Total final</strong><span>{showMoney(finalTotal)}</span></div>
              </div>
              <p>Activá modo avanzado para ver reglas, fuentes, payload y trazabilidad técnica.</p>
            </div>
          ) : (
            <div className="detail-list advanced-detail" data-testid="quote-advanced-details">
              <div><strong>Precio base unitario</strong><span>{showMoney(baseUnit)}</span></div>
              <div><strong>Terminación del producto</strong><span>{terminacion}</span></div>
              <div><strong>Adicional operativo</strong><span>{operationalAdditions}</span></div>
              {isBajadasFlow && !isAutoadhesivas ? <div><strong>Caras adicional laminado/laca</strong><span>{result.caras_adicional_laminado ?? 1}</span></div> : null}
              {isBajadasFlow && !isAutoadhesivas ? <div><strong>Laminado por lado</strong><span>{result.adicional_laminado_por_lado && result.adicional_laminado_por_lado !== "sin_adicional" ? result.adicional_laminado_por_lado : "No aplica"}</span></div> : null}
              {isBajadasFlow && !isAutoadhesivas ? <div><strong>Plastificado</strong><span>{result.adicional_plastificado ? "sí" : "No aplica"}</span></div> : null}
              <div><strong>Adicional unitario sin IVA</strong><span>{showMoney(result.adicional_unitario_sin_iva ?? 0)}</span></div>
              <div><strong>Adicional hoja 4 unitario</strong><span>{showMoney(result.adicional_hoja4_unitario_sin_iva ?? 0)}</span></div>
              <div><strong>Troquelado adicional</strong><span>{result.adicional_troquelado ? `sí (${result.complejidad_troquelado ?? "-"})` : "no"}</span></div>
              <div><strong>Troquelado unitario</strong><span>{showMoney(result.adicional_troquelado_unitario_sin_iva ?? 0)}</span></div>
              <div><strong>Precio unitario con adicional</strong><span>{showMoney(unitWithAddition)}</span></div>
              <div><strong>Cantidad ingresada</strong><span>{quantity}</span></div>
              <div><strong>{isMatrixProduct ? "Cantidad de matriz" : "Rango aplicado"}</strong><span>{rangeOrMatrix}</span></div>
              <div><strong>Regla aplicada</strong><span>{result.regla_aplicada}</span></div>
              <div><strong>Fuente</strong><span>{result.fuente}</span></div>
              <div><strong>Regla adicional aplicada</strong><span>{result.regla_adicional_aplicada ?? "-"}</span></div>
              <div><strong>Fuente adicional</strong><span>{result.fuente_adicional ?? "-"}</span></div>
              <div><strong>Recargo aplicado</strong><span>{result.trazabilidad?.recargo_urgencia_aplicado ?? "-"}</span></div>
            </div>
          )}

          <TechnicalTree result={result} />
        </div>
      )}
    </section>
  );
}
