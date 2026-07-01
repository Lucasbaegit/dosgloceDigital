import { useEffect, useMemo, useState } from "react";
import { fetchCostosProduccion, saveCostosProduccion } from "../../api/bajadasV2Api";

const PIN = "1234";

const PAPER_LABELS = {
  ilustracion: "Ilustración",
  obra: "Obra",
  autoadhesivo: "Autoadhesivo",
  kraft: "Kraft",
};

const CLICK_LABELS = [
  { key: "click_color_a3plus", label: "Click color A3+" },
  { key: "click_bn_a3plus", label: "Click B/N A3+" },
  { key: "click_color_a3plus_doble_cara", label: "Click color A3+ doble cara" },
];

const formatProductLabel = (key) => (
  String(key || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
);

const parsePaperKey = (key) => {
  const parts = String(key || "").split("_");
  const size = parts.at(-1) || "-";
  const gramaje = parts.find((part) => /\d+g/i.test(part)) || "-";
  const materialKey = parts.filter((part) => part !== gramaje && part !== size).join("_");
  const material = PAPER_LABELS[materialKey] || formatProductLabel(materialKey);
  return { material, gramaje, size };
};

const parseNumberOrNull = (value) => {
  const raw = String(value ?? "").trim().replace(",", ".");
  if (!raw) return null;
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : null;
};

export default function MaestrosCostosTab() {
  const [pinInput, setPinInput] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [pinError, setPinError] = useState("");
  const [costos, setCostos] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const paperRows = useMemo(() => (
    Object.entries(draft?.papel_por_pliego || {}).map(([key, value]) => ({
      key,
      value,
      ...parsePaperKey(key),
    }))
  ), [draft]);

  const loadCostos = async () => {
    try {
      setLoading(true);
      setError("");
      const payload = await fetchCostosProduccion();
      setCostos(payload);
      setDraft(payload);
    } catch (err) {
      setError(err.message || "No se pudieron cargar los maestros de costos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (unlocked && !costos && !loading) loadCostos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked]);

  const handleUnlock = (event) => {
    event.preventDefault();
    if (pinInput !== PIN) {
      setPinError("PIN incorrecto.");
      setPinInput("");
      return;
    }
    setPinError("");
    setPinInput("");
    setUnlocked(true);
  };

  const handleLock = () => {
    setUnlocked(false);
    setPinInput("");
    setPinError("");
    setMessage("");
    setError("");
  };

  const updateDraftAt = (path, value) => {
    setDraft((current) => {
      const next = structuredClone(current);
      let target = next;
      path.slice(0, -1).forEach((part) => {
        target = target[part];
      });
      target[path.at(-1)] = value;
      return next;
    });
    setMessage("");
    setError("");
  };

  const saveRow = async (rowKey) => {
    try {
      setSavingKey(rowKey);
      setError("");
      const saved = await saveCostosProduccion(draft);
      setCostos(saved.data || draft);
      setDraft(saved.data || draft);
      setMessage(`Guardado correcto. Backup: ${saved.backup || "-"}`);
    } catch (err) {
      setError(err.message || "No se pudo guardar el maestro de costos.");
    } finally {
      setSavingKey("");
    }
  };

  if (!unlocked) {
    return (
      <section className="card result-card masters-cost-card" data-testid="maestros-costos-pin-gate">
        <div className="card-head">
          <div>
            <h3>Maestros de Costos</h3>
            <p>Acceso protegido para editar costos base de producción. Estos valores todavía no modifican precios finales.</p>
          </div>
          <span>PIN requerido</span>
        </div>
        <form className="masters-pin-panel" onSubmit={handleUnlock}>
          <label>
            <span>PIN de 4 dígitos</span>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pinInput}
              onChange={(event) => setPinInput(event.target.value.replace(/\D/g, "").slice(0, 4))}
              data-testid="maestros-costos-pin-input"
            />
          </label>
          <button type="submit" className="calculate-btn compact-calculate-btn" data-testid="maestros-costos-unlock">
            Entrar
          </button>
        </form>
        {pinError ? <div className="error-box" data-testid="maestros-costos-pin-error">{pinError}</div> : null}
      </section>
    );
  }

  return (
    <section className="card result-card masters-cost-card" data-testid="maestros-costos-tab">
      <div className="card-head">
        <div>
          <h3>Maestros de Costos</h3>
          <p>Costos base por pliego, click, posturas y cm². Guardan backup, pero no están conectados a motores de precio.</p>
        </div>
        <button type="button" className="secondary-btn" onClick={handleLock}>Cerrar sesión</button>
      </div>

      {loading ? <div className="placeholder"><p>Cargando costos de producción...</p></div> : null}
      {message ? <div className="info-box" data-testid="maestros-costos-message">{message}</div> : null}
      {error ? <div className="error-box" data-testid="maestros-costos-error">{error}</div> : null}

      {draft ? (
        <div className="masters-cost-sections">
          <section className="principal-group">
            <h4>Sección A — Papel por pliego</h4>
            <div className="masters-cost-table masters-paper-table">
              <div className="masters-cost-row masters-cost-header">
                <span>Material</span>
                <span>Gramaje</span>
                <span>Tamaño</span>
                <span>Costo ARS</span>
                <span>Acción</span>
              </div>
              {paperRows.map((row) => (
                <div className="masters-cost-row" key={row.key}>
                  <strong>{row.material}</strong>
                  <span>{row.gramaje}</span>
                  <span>{row.size}</span>
                  <input
                    type="number"
                    step="0.000001"
                    value={row.value ?? ""}
                    onChange={(event) => updateDraftAt(["papel_por_pliego", row.key], parseNumberOrNull(event.target.value))}
                    data-testid={`maestros-paper-${row.key}`}
                  />
                  <button type="button" className="secondary-btn" onClick={() => saveRow(row.key)} disabled={savingKey === row.key}>
                    {savingKey === row.key ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="principal-group">
            <h4>Sección B — Clicks</h4>
            <div className="masters-click-grid">
              {CLICK_LABELS.map((item) => (
                <label className="principal-variable" key={item.key}>
                  <span className="principal-variable-title">{item.label}</span>
                  <input
                    type="number"
                    step="0.000001"
                    value={draft[item.key] ?? ""}
                    onChange={(event) => updateDraftAt([item.key], parseNumberOrNull(event.target.value))}
                    data-testid={`maestros-click-${item.key}`}
                  />
                  <button type="button" className="secondary-btn" onClick={() => saveRow(item.key)} disabled={savingKey === item.key}>
                    {savingKey === item.key ? "Guardando..." : "Guardar"}
                  </button>
                </label>
              ))}
            </div>
          </section>

          <section className="principal-group">
            <h4>Sección C — Posturas por producto</h4>
            <div className="masters-cost-table masters-posturas-table">
              <div className="masters-cost-row masters-cost-header">
                <span>Producto</span>
                <span>Pliego</span>
                <span>Posturas</span>
                <span>Acción</span>
              </div>
              {Object.entries(draft.posturas_por_producto || {}).map(([key, value]) => (
                <div className="masters-cost-row" key={key}>
                  <strong>{formatProductLabel(key)}</strong>
                  <input
                    value={value.pliego ?? ""}
                    onChange={(event) => updateDraftAt(["posturas_por_producto", key, "pliego"], event.target.value)}
                    data-testid={`maestros-postura-pliego-${key}`}
                  />
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={value.posturas ?? ""}
                    onChange={(event) => updateDraftAt(["posturas_por_producto", key, "posturas"], parseNumberOrNull(event.target.value))}
                    data-testid={`maestros-postura-${key}`}
                  />
                  <button type="button" className="secondary-btn" onClick={() => saveRow(key)} disabled={savingKey === key}>
                    {savingKey === key ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="principal-group">
            <h4>Sección D — Costo por cm² (stickers/imanes)</h4>
            <div className="masters-cost-table masters-cm2-table">
              <div className="masters-cost-row masters-cost-header">
                <span>Producto</span>
                <span>Papel ($/cm²)</span>
                <span>Click ($/cm²)</span>
                <span>Acción</span>
              </div>
              {Object.entries(draft.costo_cm2 || {}).map(([key, value]) => (
                <div className="masters-cost-row" key={key}>
                  <strong>{formatProductLabel(key)}</strong>
                  <input
                    type="number"
                    step="0.000001"
                    value={value.papel ?? ""}
                    onChange={(event) => updateDraftAt(["costo_cm2", key, "papel"], parseNumberOrNull(event.target.value))}
                    data-testid={`maestros-cm2-papel-${key}`}
                  />
                  <input
                    type="number"
                    step="0.000001"
                    value={value.click ?? ""}
                    onChange={(event) => updateDraftAt(["costo_cm2", key, "click"], parseNumberOrNull(event.target.value))}
                    data-testid={`maestros-cm2-click-${key}`}
                  />
                  <button type="button" className="secondary-btn" onClick={() => saveRow(key)} disabled={savingKey === key}>
                    {savingKey === key ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
