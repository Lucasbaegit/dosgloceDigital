import ImpactoCambiosPanel from "../cotizador/ImpactoCambiosPanel";
import { getQuoteProductKey, getQuoteProductLabel } from "../../lib/cotizacionLogic";

export default function VariableImpactTab({
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
  lastPayload,
  result,
}) {
  return (
    <ImpactoCambiosPanel
      isSimpleMode={isSimpleMode}
      isAdvancedMode={isAdvancedMode}
      impactData={impactData}
      impactError={impactError}
      impactLoading={impactLoading}
      impactMode={impactMode}
      setImpactMode={setImpactMode}
      impactVariable={impactVariable}
      setImpactVariable={setImpactVariable}
      impactProduct={impactProduct}
      setImpactProduct={setImpactProduct}
      currentQuote={{
        payload: lastPayload,
        result,
        productKey: getQuoteProductKey(lastPayload),
        productLabel: lastPayload ? getQuoteProductLabel(lastPayload, impactData) : "",
      }}
    />
  );
}
