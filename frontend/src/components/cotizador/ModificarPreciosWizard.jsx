export default function ModificarPreciosWizard({
  adminError,
  adminMsg,
  adminLoading,
  adminPrices,
  renderAdminStepper,
  renderCurrentPriceChain,
  adminWizardStep,
  renderVariableList,
  renderImpactStep,
  renderValueStep,
  renderPreviewStep,
  renderConfirmStep,
  renderHistoryStep,
}) {
  return (
    <section className="card result-card admin-prices-card">
      <div className="card-head">
        <div>
          <h3 data-testid="admin-prices-title">Modificar precios</h3>
          <p>Cambiá variables habilitadas desde el sistema. Antes de guardar, revisá el impacto. El sistema crea backup e historial automáticamente.</p>
        </div>
        <span>Wizard seguro</span>
      </div>

      <div className="warning-box">
        El Excel maestro es solo soporte de visualización y auditoría. Los cambios reales se hacen desde esta pantalla.
      </div>
      {adminError ? <div className="error-box" data-testid="admin-prices-error">{adminError}</div> : null}
      {adminMsg ? <div className="info-box" data-testid="admin-prices-message">{adminMsg}</div> : null}
      {adminLoading && !adminPrices ? <div className="placeholder"><p>Cargando wizard de precios...</p></div> : null}

      {adminPrices ? (
        <>
          {renderCurrentPriceChain ? renderCurrentPriceChain() : null}
          {renderAdminStepper()}
          <div className="admin-wizard-shell">
            {adminWizardStep === 1 ? renderVariableList() : null}
            {adminWizardStep === 2 ? renderImpactStep() : null}
            {adminWizardStep === 3 ? renderValueStep() : null}
            {adminWizardStep === 4 ? renderPreviewStep() : null}
            {adminWizardStep === 5 ? renderConfirmStep() : null}
            {adminWizardStep === 6 ? renderHistoryStep() : null}
          </div>
        </>
      ) : null}
    </section>
  );
}
