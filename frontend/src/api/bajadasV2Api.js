const API_BASE = "http://127.0.0.1:8000";

export async function cotizarBajadaV2(payload) {
  const response = await fetch(`${API_BASE}/bajadas-v2/cotizar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = body?.detail || "Error desconocido";
    const error = new Error(detail);
    error.status = response.status;
    error.code = body?.error || "api_error";
    throw error;
  }
  return body;
}

export async function fetchBajadasMetrics() {
  const response = await fetch(`${API_BASE}/bajadas-v2/metrics`);
  if (!response.ok) {
    throw new Error("No se pudieron cargar métricas.");
  }
  return response.json();
}

export async function fetchBajadasHealth() {
  const response = await fetch(`${API_BASE}/bajadas-v2/health`);
  if (!response.ok) {
    throw new Error("No se pudo validar salud de API.");
  }
  return response.json();
}
