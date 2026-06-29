import { useEffect, useState } from "react";
import { fetchVariablesImpacto } from "../api/bajadasV2Api";
import {
  getQuoteProductKey,
  relationAppliesToCurrentQuote,
} from "../lib/cotizacionLogic";

export default function useImpactMap({
  activeTab,
  lastPayload,
  result,
}) {
  const [impactData, setImpactData] = useState(null);
  const [impactLoading, setImpactLoading] = useState(false);
  const [impactError, setImpactError] = useState("");
  const [impactMode, setImpactMode] = useState("variable");
  const [impactVariable, setImpactVariable] = useState("click_color");
  const [impactProduct, setImpactProduct] = useState("bajadas_fullcolor_byn");

  const loadVariablesImpacto = async () => {
    try {
      setImpactLoading(true);
      setImpactError("");
      const data = await fetchVariablesImpacto();
      setImpactData(data);
      if (data?.variables?.length && !data.variables.some((item) => item.key === impactVariable)) {
        setImpactVariable(data.variables[0].key);
      }
      if (data?.productos?.length && !data.productos.some((item) => item.key === impactProduct)) {
        setImpactProduct(data.productos[0].key);
      }
    } catch (err) {
      setImpactData(null);
      setImpactError(err.message || "No se pudo cargar el impacto de variables.");
    } finally {
      setImpactLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== "Ver impacto de cambios" || impactData || impactLoading) return;
    loadVariablesImpacto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "Ver impacto de cambios" || !impactData || !lastPayload || !result) return;
    const productKey = getQuoteProductKey(lastPayload);
    const suggested = (impactData.relaciones || []).find((relation) => (
      relation.producto_key === productKey &&
      relation.impacta_hoy &&
      relation.editable &&
      relationAppliesToCurrentQuote(relation, lastPayload, result)
    ));
    if (suggested && impactVariable !== suggested.variable) {
      setImpactMode("variable");
      setImpactVariable(suggested.variable);
    }
  }, [activeTab, impactData, impactVariable, lastPayload, result]);

  useEffect(() => {
    if (activeTab !== "Modificar precios" || impactData || impactLoading) return;
    loadVariablesImpacto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  return {
    impactData,
    setImpactData,
    impactLoading,
    impactError,
    impactMode,
    setImpactMode,
    impactVariable,
    setImpactVariable,
    impactProduct,
    setImpactProduct,
    loadVariablesImpacto,
  };
}
