import ExportarSoporteExcelPanel from "../cotizador/ExportarSoporteExcelPanel";

export default function ExportSupportTab({
  isSimpleMode,
  principalMsg,
  downloadPricesExcel,
  downloadPricesPdf,
}) {
  return (
    <ExportarSoporteExcelPanel
      isSimpleMode={isSimpleMode}
      principalMsg={principalMsg}
      downloadPricesExcel={downloadPricesExcel}
      downloadPricesPdf={downloadPricesPdf}
    />
  );
}
