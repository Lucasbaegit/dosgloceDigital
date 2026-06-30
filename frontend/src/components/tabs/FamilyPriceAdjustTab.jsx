import { formatMoney } from "../../lib/cotizacionLogic";

const formatFactor = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(4).replace(/\.?0+$/, "") : "-";
};

const formatPreviewPercent = (value) => (
  value == null || !Number.isFinite(Number(value)) ? "-" : `${Number(value).toFixed(2)}%`
);

export default function FamilyPriceAdjustTab({
  adminLoading,
  adminMsg,
  adminError,
  getFamilyPriceRows,
  setFamilyAdjustment,
  familyBulkPercent,
  setFamilyBulkPercent,
  previewFamilyAdjustment,
  applyFamilyAdjustment,
  applyFamilyAdjustmentToAll,
}) {
  const rows = getFamilyPriceRows();

  return (
    <div className="admin-prices-shell" data-testid="family-price-adjust-tab">
      <section className="admin-wizard-panel">
        <div className="admin-wizard-panel-head">
          <span>Administrador comercial</span>
          <h3>Ajustar Precios por Familia</h3>
          <p>
            Edita multiplicadores comerciales por familia sin tocar matrices PDF/lista ni lógica de cotización.
            El valor se ingresa como variación porcentual: +10% guarda multiplicador 1.10.
          </p>
        </div>

        {adminError ? <div className="error-box" data-testid="family-price-error">{adminError}</div> : null}
        {adminMsg ? <div className="success-box" data-testid="family-price-msg">{adminMsg}</div> : null}

        <div className="admin-context-banner family-price-bulk" data-testid="family-price-bulk">
          <div>
            <strong>Aplicar a todas las familias</strong>
            <span>Usa el mismo porcentaje para los 11 multiplicadores comerciales listados abajo.</span>
          </div>
          <label className="family-price-inline-input">
            <span>Porcentaje</span>
            <input
              type="text"
              value={familyBulkPercent}
              placeholder="+10%"
              onChange={(event) => setFamilyBulkPercent(event.target.value)}
              data-testid="family-price-bulk-input"
            />
          </label>
          <button
            type="button"
            className="calculate-btn compact-calculate-btn"
            onClick={applyFamilyAdjustmentToAll}
            disabled={adminLoading}
            data-testid="family-price-apply-all"
          >
            Aplicar a todos
          </button>
        </div>

        <div className="family-price-table" data-testid="family-price-table">
          <div className="family-price-row family-price-header">
            <span>Familia</span>
            <span>Valor actual</span>
            <span>Nuevo %</span>
            <span>Preview</span>
            <span>Acciones</span>
          </div>

          {rows.map((row) => {
            const preview = row.preview;
            const disabled = adminLoading || row.missing;
            return (
              <div className="family-price-row" key={row.variable} data-testid={`family-price-row-${row.family}`}>
                <div>
                  <strong>{row.label}</strong>
                  <small>{row.variable}</small>
                  {row.missing ? <em className="context-badge neutral">Variable no encontrada</em> : null}
                </div>
                <div>
                  <span>{row.currentPercentLabel}</span>
                  <small>factor {formatFactor(row.currentValue)}</small>
                </div>
                <label className="family-price-percent-field">
                  <span className="sr-only">Nuevo porcentaje {row.label}</span>
                  <input
                    type="text"
                    value={row.draft}
                    placeholder={row.currentPercentLabel === "-" ? "+10%" : row.currentPercentLabel}
                    onChange={(event) => setFamilyAdjustment(row.variable, event.target.value)}
                    disabled={row.missing}
                    data-testid={`family-price-input-${row.family}`}
                  />
                  <small>Ej: +10%, -5%, 0%</small>
                </label>
                <div className="family-price-preview" data-testid={`family-price-preview-${row.family}`}>
                  {preview ? (
                    <>
                      <span>Actual {formatFactor(preview.valor_actual)}</span>
                      <span>Nuevo {formatFactor(preview.nuevo_valor)}</span>
                      <span>Diferencia {formatFactor(preview.diferencia)} ({formatPreviewPercent(preview.diferencia_porcentual)})</span>
                      {(preview.precios_ejemplo || []).slice(0, 1).map((example) => (
                        <small key={example.nombre}>
                          {example.nombre}: {formatMoney(example.antes)} → {formatMoney(example.despues)}
                        </small>
                      ))}
                    </>
                  ) : (
                    <small>Generá preview antes de aplicar.</small>
                  )}
                </div>
                <div className="family-price-actions">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => previewFamilyAdjustment(row.variable)}
                    disabled={disabled}
                    data-testid={`family-price-preview-button-${row.family}`}
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    className="calculate-btn compact-calculate-btn"
                    onClick={() => applyFamilyAdjustment(row.variable)}
                    disabled={disabled}
                    data-testid={`family-price-apply-button-${row.family}`}
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
