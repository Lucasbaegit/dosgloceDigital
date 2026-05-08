import { useEffect, useMemo, useState } from "react";
import { cotizarBajadaV2, fetchBajadasHealth, fetchBajadasMetrics } from "../api/bajadasV2Api";
import optionRows from "../data/bajadasOptions.json";

const NAV_ITEMS = ["Cotizador", "Pedidos", "Plantillas", "Historial", "Precios", "Ajustes"];
const CARAS = ["4/0", "4/4", "1/0", "1/1"];
const URGENCIAS = ["normal", "express", "super_express", "ya_24hs"];
const INITIAL_FORM = {
  formato: "A4",
  tipo_papel: "",
  material: "",
  gramaje: "",
  cantidad_unidades: "1",
  caras: "4/0",
  urgencia: "normal",
};

function inferFromCaras(caras) {
  const full = caras === "4/0" || caras === "4/4";
  return {
    modo_color: full ? "fullcolor" : "blanco_y_negro",
    categoria: full ? "Bajadas Fullcolor" : "Bajadas Blanco y Negro",
  };
}

function uniqueSorted(values, customOrder = null) {
  const uniq = [...new Set(values.filter(Boolean))];
  if (!customOrder) return uniq.sort((a, b) => String(a).localeCompare(String(b)));
  const order = new Map(customOrder.map((v, i) => [v, i]));
  return uniq.sort((a, b) => (order.get(a) ?? 999) - (order.get(b) ?? 999) || String(a).localeCompare(String(b)));
}

function parseRangeLabel(label) {
  if (!label) return null;
  const clean = String(label).trim();
  if (clean === "1") return { label: clean, min: 1, max: 1 };
  const match = clean.match(/^(\d+)\s*a\s*(\d+)$/i);
  if (!match) return null;
  const min = Number(match[1]);
  const max = Number(match[2]);
  if (!Number.isInteger(min) || !Number.isInteger(max) || min > max) return null;
  return { label: clean, min, max };
}

function deriveRangeFromQuantity(quantity, availableRanges) {
  if (!Number.isInteger(quantity) || quantity < 1) return null;
  const parsed = availableRanges.map(parseRangeLabel).filter(Boolean);
  const candidates = parsed.filter((r) => r.min <= quantity && quantity <= r.max);
  if (candidates.length > 0) {
    candidates.sort((a, b) => {
      const spanA = a.max - a.min;
      const spanB = b.max - b.min;
      if (spanA !== spanB) return spanA - spanB;
      if (a.min !== b.min) return b.min - a.min;
      return a.max - b.max;
    });
    return candidates[0].label;
  }
  return null;
}

function formatMoney(value) {
  if (typeof value !== "number") return "-";
  const numeric = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(
    value
  );
  return `$${numeric} ARS`;
}

async function copyToClipboard(text) {
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
}

export default function CotizadorBajadasV2() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [result, setResult] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [apiConnected, setApiConnected] = useState(false);

  const inferred = useMemo(() => inferFromCaras(form.caras), [form.caras]);

  const validRows = useMemo(
    () =>
      optionRows.filter(
        (r) => r.categoria === inferred.categoria && r.modo_color === inferred.modo_color && r.caras === form.caras
      ),
    [inferred, form.caras]
  );

  const formatoOptions = useMemo(() => uniqueSorted(validRows.map((r) => r.formato)), [validRows]);
  const tipoPapelOptions = useMemo(
    () => uniqueSorted(validRows.filter((r) => r.formato === form.formato).map((r) => r.tipo_papel)),
    [validRows, form.formato]
  );
  const materialOptions = useMemo(
    () =>
      uniqueSorted(
        validRows
          .filter((r) => r.formato === form.formato && r.tipo_papel === form.tipo_papel)
          .map((r) => r.material)
      ),
    [validRows, form.formato, form.tipo_papel]
  );
  const gramajeOptions = useMemo(
    () =>
      uniqueSorted(
        validRows
          .filter((r) => r.formato === form.formato && r.tipo_papel === form.tipo_papel && r.material === form.material)
          .map((r) => r.gramaje)
      ),
    [validRows, form.formato, form.tipo_papel, form.material]
  );
  const cantidadOptions = useMemo(
    () =>
      uniqueSorted(
        validRows
          .filter(
            (r) =>
              r.formato === form.formato &&
              r.tipo_papel === form.tipo_papel &&
              r.material === form.material &&
              r.gramaje === form.gramaje
          )
          .map((r) => r.cantidad_rango)
      ),
    [validRows, form.formato, form.tipo_papel, form.material, form.gramaje]
  );
  const cantidadUnidades = useMemo(() => Number(form.cantidad_unidades), [form.cantidad_unidades]);
  const derivedRange = useMemo(
    () => deriveRangeFromQuantity(cantidadUnidades, cantidadOptions),
    [cantidadUnidades, cantidadOptions]
  );

  useEffect(() => {
    fetchBajadasMetrics().then(setMetrics).catch(() => setMetrics(null));
    fetchBajadasHealth()
      .then((res) => setApiConnected(Boolean(res?.status === "ok" && Object.values(res?.checks ?? {}).every(Boolean))))
      .catch(() => setApiConnected(false));
  }, []);

  useEffect(() => {
    setForm((prev) => {
      const next = { ...prev };
      if (!formatoOptions.includes(next.formato)) next.formato = formatoOptions[0] || "";
      return next;
    });
  }, [formatoOptions]);

  useEffect(() => {
    setForm((prev) => {
      const next = { ...prev };
      if (!tipoPapelOptions.includes(next.tipo_papel)) next.tipo_papel = tipoPapelOptions[0] || "";
      if (!materialOptions.includes(next.material)) next.material = materialOptions[0] || "";
      if (!gramajeOptions.includes(next.gramaje)) next.gramaje = gramajeOptions[0] || "";
      return next;
    });
  }, [tipoPapelOptions, materialOptions, gramajeOptions]);

  const missingFields = useMemo(() => {
    const required = ["formato", "tipo_papel", "material", "gramaje", "caras", "urgencia"];
    return required.filter((field) => !String(form[field] ?? "").trim());
  }, [form]);

  const updateField = (field) => (event) => {
    setCopyStatus("");
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleClear = () => {
    setForm((prev) => ({ ...prev, cantidad_unidades: "1", urgencia: "normal" }));
    setResult(null);
    setError("");
    setCopyStatus("");
    setLoading(false);
  };

  const handleCopy = async () => {
    if (!result) return;
    const text = [
      "Cotización Bajadas v2",
      `Formato: ${form.formato}`,
      `Impresión: ${form.caras}`,
      `Papel: ${form.tipo_papel} / ${form.material} / ${form.gramaje}`,
      `Cantidad: ${result.cantidad_unidades ?? form.cantidad_unidades}`,
      `Rango aplicado: ${result.cantidad_rango_aplicado ?? derivedRange ?? "-"}`,
      `Total sin IVA: ${formatMoney(result.total_sin_iva ?? result.precio_sin_iva)}`,
      `Total con urgencia: ${formatMoney(result.total_con_urgencia ?? result.precio_con_recargo_urgencia)}`,
    ].join("\n");

    try {
      await copyToClipboard(text);
      setCopyStatus("Resultado copiado.");
    } catch {
      setCopyStatus("No se pudo copiar el resultado.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setResult(null);
    setCopyStatus("");

    if (missingFields.length > 0) {
      setError(`Faltan campos obligatorios: ${missingFields.join(", ")}`);
      return;
    }
    if (!Number.isInteger(cantidadUnidades) || cantidadUnidades < 1) {
      setError("Cantidad inválida. Ingresá un entero mayor o igual a 1.");
      return;
    }
    if (!derivedRange) {
      setError("La cantidad ingresada no entra en ningún rango disponible para esta combinación.");
      return;
    }

    const payload = {
      categoria: inferred.categoria,
      modo_color: inferred.modo_color,
      formato: form.formato,
      tipo_papel: form.tipo_papel,
      material: form.material,
      gramaje: form.gramaje,
      cantidad_unidades: cantidadUnidades,
      cantidad_rango: derivedRange,
      caras: form.caras,
      urgencia: form.urgencia,
    };

    setLoading(true);
    try {
      const response = await cotizarBajadaV2(payload);
      setResult(response);
    } catch (err) {
      if (err.code === "combinacion_no_encontrada") {
        setError("La combinación seleccionada no existe en la tabla de Bajadas v2. Revisá formato, papel, gramaje y rango.");
      } else if (err.code === "urgencia_invalida") {
        setError("Urgencia inválida. Revisá el campo Urgencia.");
      } else if (err.status >= 500) {
        setError("La API respondió con error interno.");
      } else if (err.status === 0 || err.message.includes("Failed to fetch")) {
        setError("API caída o inaccesible en http://127.0.0.1:8000.");
      } else {
        setError(err.message || "No se pudo calcular.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img src="/logoPromo.jpg" alt="Promo" />
          <div>
            <h1>Promo</h1>
            <p>Cotizador Bajadas</p>
          </div>
        </div>
        <nav>
          {NAV_ITEMS.map((item, idx) => (
            <button key={item} type="button" className={idx === 0 ? "nav-item active" : "nav-item"}>
              {item}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h2>Cotizador Bajadas</h2>
            <p>Motor productivo v2 conectado a API interna</p>
          </div>
          <div className="topbar-right">
            <div className={apiConnected ? "api-status ok" : "api-status down"}>
              {apiConnected ? "API conectada" : "API no disponible"}
            </div>
            <div className="metrics-chip">
              {metrics ? `OK ${metrics.OK} · Alta ${metrics.DIFERENCIA_ALTA}` : "Métricas no disponibles"}
            </div>
          </div>
        </header>

        <section className="content-grid">
          <form className="card form-card" onSubmit={handleSubmit}>
            <div className="card-head">
              <h3>1. Configura tu impresión</h3>
              <span>Enter = calcular</span>
            </div>

            <div className="form-grid">
              <label>
                <span>Impresión</span>
                <div className="caras-row">
                  {CARAS.map((cara) => (
                    <button
                      key={cara}
                      type="button"
                      className={form.caras === cara ? "pill active" : "pill"}
                      onClick={() => setForm((prev) => ({ ...prev, caras: cara }))}
                    >
                      {cara}
                    </button>
                  ))}
                </div>
              </label>

              <label>
                <span>Categoría (automática)</span>
                <input value={inferred.categoria} readOnly />
              </label>
              <label>
                <span>Medida / formato</span>
                <select value={form.formato} onChange={updateField("formato")}>
                  {formatoOptions.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Tipo de papel</span>
                <select value={form.tipo_papel} onChange={updateField("tipo_papel")}>
                  {tipoPapelOptions.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Material</span>
                <select value={form.material} onChange={updateField("material")}>
                  {materialOptions.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Gramaje</span>
                <select value={form.gramaje} onChange={updateField("gramaje")}>
                  {gramajeOptions.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Cantidad</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  placeholder="Ejemplo: 30"
                  value={form.cantidad_unidades}
                  onChange={updateField("cantidad_unidades")}
                />
                <small className="range-hint">Rango aplicado: {derivedRange ?? "Sin rango disponible"}</small>
              </label>
              <label>
                <span>Urgencia</span>
                <select value={form.urgencia} onChange={updateField("urgencia")}>
                  {URGENCIAS.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
            </div>

            {error ? <div className="error-box">{error}</div> : null}
            {copyStatus ? <div className="info-box">{copyStatus}</div> : null}

            <div className="actions-row">
              <button type="submit" className="calculate-btn" disabled={loading}>
                {loading ? "Calculando..." : "Calcular"}
              </button>
              <button type="button" className="secondary-btn" onClick={handleClear}>Limpiar</button>
            </div>
          </form>

          <section className="card result-card">
            <div className="card-head">
              <h3>2. Resultado</h3>
              <span>{loading ? "Consultando API..." : "Actualizado"}</span>
            </div>
            {!result ? (
              <div className="placeholder">
                <p>Completá los datos y presioná Calcular.</p>
              </div>
            ) : (
              <>
                <div className="result-main">
                  <div className="unit-panel">
                    <h4>Precio unitario</h4>
                    <div className="unit-values">
                      <p><span>Sin IVA</span><strong>{formatMoney(result.precio_unitario_sin_iva ?? result.precio_sin_iva)}</strong></p>
                      <p><span>Con urgencia</span><strong>{formatMoney(result.precio_unitario_con_urgencia ?? result.precio_con_recargo_urgencia)}</strong></p>
                    </div>
                  </div>
                  <div className="total-panel">
                    <p>Total final con urgencia</p>
                    <h3>{formatMoney(result.total_con_urgencia ?? result.precio_con_recargo_urgencia)}</h3>
                    <small>Total sin IVA: {formatMoney(result.total_sin_iva ?? result.precio_sin_iva)}</small>
                  </div>
                </div>

                <div className="detail-list">
                  <div><strong>Cantidad ingresada</strong><span>{result.cantidad_unidades ?? form.cantidad_unidades}</span></div>
                  <div><strong>Rango aplicado</strong><span>{result.cantidad_rango_aplicado ?? derivedRange ?? "-"}</span></div>
                  <div><strong>Precio unitario sin IVA</strong><span>{formatMoney(result.precio_unitario_sin_iva ?? result.precio_sin_iva)}</span></div>
                  <div><strong>Precio unitario con urgencia</strong><span>{formatMoney(result.precio_unitario_con_urgencia ?? result.precio_con_recargo_urgencia)}</span></div>
                  <div><strong>Total sin IVA</strong><span>{formatMoney(result.total_sin_iva ?? result.precio_sin_iva)}</span></div>
                  <div><strong>Total con urgencia</strong><span>{formatMoney(result.total_con_urgencia ?? result.precio_con_recargo_urgencia)}</span></div>
                  <div><strong>Regla aplicada</strong><span>{result.regla_aplicada}</span></div>
                  <div><strong>Fuente</strong><span>{result.fuente}</span></div>
                  <div><strong>Recargo aplicado</strong><span>{result.trazabilidad?.recargo_urgencia_aplicado ?? "-"}</span></div>
                </div>

                <div className="copy-row">
                  <button type="button" className="secondary-btn" onClick={handleCopy}>Copiar resultado</button>
                </div>
              </>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}
