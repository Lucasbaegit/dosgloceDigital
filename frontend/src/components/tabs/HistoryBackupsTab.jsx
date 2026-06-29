import HistorialBackupsPanel from "../cotizador/HistorialBackupsPanel";

export default function HistoryBackupsTab({
  renderAdminHistoryEntries,
  renderRollbackPreviewPanel,
  cfgBackups,
  adminError,
  adminMsg,
  adminLoading,
  adminPrices,
}) {
  return (
    <HistorialBackupsPanel
      renderAdminHistoryEntries={renderAdminHistoryEntries}
      renderRollbackPreviewPanel={renderRollbackPreviewPanel}
      cfgBackups={cfgBackups}
      adminError={adminError}
      adminMsg={adminMsg}
      adminLoading={adminLoading}
      adminPrices={adminPrices}
    />
  );
}
