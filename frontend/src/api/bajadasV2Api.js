const API_BASE =
  (import.meta.env.VITE_API_BASE || "").trim() ||
  (import.meta.env.DEV ? "http://127.0.0.1:8000" : "");

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

export async function cotizarTarjetas9x5(payload) {
  const response = await fetch(`${API_BASE}/tarjetas-9x5/cotizar`, {
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

export async function cotizarTarjetasPostales(payload) {
  const response = await fetch(`${API_BASE}/tarjetas-postales/cotizar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.detail || "Error desconocido");
    error.status = response.status;
    error.code = body?.error || "api_error";
    throw error;
  }
  return body;
}

export async function cotizarFolletos(payload) {
  const response = await fetch(`${API_BASE}/folletos/cotizar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.detail || "Error desconocido");
    error.status = response.status;
    error.code = body?.error || "api_error";
    throw error;
  }
  return body;
}

export async function cotizarCarpetas(payload) {
  const response = await fetch(`${API_BASE}/carpetas/cotizar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.detail || "Error desconocido");
    error.status = response.status;
    error.code = body?.error || "api_error";
    throw error;
  }
  return body;
}

export async function cotizarSobres(payload) {
  const response = await fetch(`${API_BASE}/sobres/cotizar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.detail || "Error desconocido");
    error.status = response.status;
    error.code = body?.error || "api_error";
    throw error;
  }
  return body;
}

export async function cotizarStickersCorteRecto(payload) {
  const response = await fetch(`${API_BASE}/stickers-corte-recto/cotizar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.detail || "Error desconocido");
    error.status = response.status;
    error.code = body?.error || "api_error";
    throw error;
  }
  return body;
}

export async function cotizarImanesCorteRecto(payload) {
  const response = await fetch(`${API_BASE}/imanes-corte-recto/cotizar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.detail || "Error desconocido");
    error.status = response.status;
    error.code = body?.error || "api_error";
    throw error;
  }
  return body;
}

export async function cotizarStickersCirculares(payload) {
  const response = await fetch(`${API_BASE}/stickers-circulares/cotizar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.detail || "Error desconocido");
    error.status = response.status;
    error.code = body?.error || "api_error";
    throw error;
  }
  return body;
}

export async function cotizarTroqueladoDigital(payload) {
  const response = await fetch(`${API_BASE}/troquelado-digital/cotizar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.detail || "Error desconocido");
    error.status = response.status;
    error.code = body?.error || "api_error";
    throw error;
  }
  return body;
}

export async function cotizarTarjetasTroqueladasCirculares(payload) {
  const response = await fetch(`${API_BASE}/tarjetas-troqueladas-circulares/cotizar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.detail || "Error desconocido");
    error.status = response.status;
    error.code = body?.error || "api_error";
    throw error;
  }
  return body;
}

export async function cotizarPlanchaImanImpreso(payload) {
  const response = await fetch(`${API_BASE}/plancha-iman-impreso/cotizar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.detail || "Error desconocido");
    error.status = response.status;
    error.code = body?.error || "api_error";
    throw error;
  }
  return body;
}

export async function cotizarAgendasCuadernos(payload) {
  const response = await fetch(`${API_BASE}/agendas-cuadernos/cotizar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.detail || "Error desconocido");
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

export async function fetchPrincipalVariables() {
  const response = await fetch(`${API_BASE}/variables-principales`);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.detail || "No se pudieron cargar variables principales.");
  return body;
}

export async function updatePrincipalVariables(updates) {
  const response = await fetch(`${API_BASE}/variables-principales`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ updates }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.detail || "No se pudieron guardar variables principales.");
  return body;
}

export async function fetchPrincipalVariablesAudit() {
  const response = await fetch(`${API_BASE}/variables-principales/audit`);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.detail || "No se pudo cargar la auditoría.");
  return body;
}

export async function fetchPrincipalVariablesRanges() {
  const response = await fetch(`${API_BASE}/variables-principales/rangos`);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.detail || "No se pudieron cargar los rangos.");
  return body;
}

export async function fetchTraceGraph(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      query.set(key, String(value));
    }
  });
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await fetch(`${API_BASE}/trazabilidad/grafo${suffix}`);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.detail || "No se pudo cargar el grafo de trazabilidad.");
    error.status = response.status;
    error.code = body?.error || "api_error";
    throw error;
  }
  return body;
}

export async function fetchVariablesImpacto() {
  const response = await fetch(`${API_BASE}/variables-impacto`);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.detail || "No se pudo cargar el impacto de variables.");
    error.status = response.status;
    error.code = body?.error || "api_error";
    throw error;
  }
  return body;
}

export async function fetchVariablesImpactoResumen() {
  const response = await fetch(`${API_BASE}/variables-impacto/resumen`);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.detail || "No se pudo cargar el resumen de impacto.");
    error.status = response.status;
    error.code = body?.error || "api_error";
    throw error;
  }
  return body;
}

export async function fetchVariablesImpactoVariable(variableKey) {
  const response = await fetch(`${API_BASE}/variables-impacto/variable/${encodeURIComponent(variableKey)}`);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.detail || "No se pudo cargar el impacto de la variable.");
    error.status = response.status;
    error.code = body?.error || "api_error";
    throw error;
  }
  return body;
}

export async function fetchVariablesImpactoProducto(productKey) {
  const response = await fetch(`${API_BASE}/variables-impacto/producto/${encodeURIComponent(productKey)}`);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.detail || "No se pudo cargar el impacto del producto.");
    error.status = response.status;
    error.code = body?.error || "api_error";
    throw error;
  }
  return body;
}

export async function fetchAdminPreciosVariables() {
  const response = await fetch(`${API_BASE}/admin-precios/variables-editables`);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.detail || "No se pudieron cargar variables editables.");
    error.status = response.status;
    error.code = body?.error || "api_error";
    throw error;
  }
  return body;
}

export async function previewAdminPrecio(payload) {
  const response = await fetch(`${API_BASE}/admin-precios/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.detail || "No se pudo previsualizar el cambio.");
    error.status = response.status;
    error.code = body?.error || "api_error";
    throw error;
  }
  return body;
}

export async function applyAdminPrecio(payload) {
  const response = await fetch(`${API_BASE}/admin-precios/aplicar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.detail || "No se pudo guardar el cambio.");
    error.status = response.status;
    error.code = body?.error || "api_error";
    throw error;
  }
  return body;
}

export async function fetchAdminPreciosHistorial() {
  const response = await fetch(`${API_BASE}/admin-precios/historial`);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.detail || "No se pudo cargar historial de cambios.");
    error.status = response.status;
    error.code = body?.error || "api_error";
    throw error;
  }
  return body;
}

export async function exportPricesPdf() {
  const response = await fetch(`${API_BASE}/export/precios/pdf`);
  if (!response.ok) throw new Error("No se pudo exportar PDF. Revisar backend.");
  const disposition = response.headers.get("Content-Disposition") || "";
  const filename = disposition.match(/filename="([^"]+)"/)?.[1] || "lista_precios_cotizador.pdf";
  return { filename, blob: await response.blob() };
}

export async function exportPricesExcel() {
  const response = await fetch(`${API_BASE}/export/precios/excel`);
  if (!response.ok) throw new Error("No se pudo exportar Excel maestro. Revisar backend.");
  const disposition = response.headers.get("Content-Disposition") || "";
  const filename = disposition.match(/filename="([^"]+)"/)?.[1] || "cotizador_digital_maestro.xlsx";
  return { filename, blob: await response.blob() };
}

export async function previewExcelMaestro(file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE}/import/excel-maestro/preview`, {
    method: "POST",
    body: formData,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.detail || "No se pudo previsualizar el Excel maestro.");
    error.status = response.status;
    error.code = body?.error || "api_error";
    throw error;
  }
  return body;
}

export async function fetchBajadasConfig() {
  const response = await fetch(`${API_BASE}/bajadas-v2/config`);
  if (!response.ok) throw new Error("No se pudo cargar configuración.");
  return response.json();
}

export async function fetchBajadasConfigHistory() {
  const response = await fetch(`${API_BASE}/bajadas-v2/config/history`);
  if (!response.ok) throw new Error("No se pudo cargar historial de configuración.");
  return response.json();
}

export async function updateBajadasConfig(payload) {
  const response = await fetch(`${API_BASE}/bajadas-v2/config/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.detail || "Error al actualizar configuración");
    error.status = response.status;
    throw error;
  }
  return body;
}

export async function restoreBajadasConfig(payload = { motivo: "restauracion_manual_ui" }) {
  const response = await fetch(`${API_BASE}/bajadas-v2/config/restore`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.detail || "Error al restaurar configuración");
    error.status = response.status;
    throw error;
  }
  return body;
}

export async function fetchBajadasConfigDiff() {
  const response = await fetch(`${API_BASE}/bajadas-v2/config/diff`);
  if (!response.ok) throw new Error("No se pudo cargar diff de configuración.");
  return response.json();
}

export async function validateBajadasConfig() {
  const response = await fetch(`${API_BASE}/bajadas-v2/config/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.detail || "No se pudo validar configuración");
    error.status = response.status;
    throw error;
  }
  return body;
}

export async function simulateBajadasConfig(payload) {
  const response = await fetch(`${API_BASE}/bajadas-v2/config/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.detail || "No se pudo simular configuración");
    error.status = response.status;
    throw error;
  }
  return body;
}

export async function createBajadasConfigCandidate(payload = { motivo: "staging_manual_ui" }) {
  const response = await fetch(`${API_BASE}/bajadas-v2/config/candidate/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.detail || "No se pudo crear candidato");
    error.status = response.status;
    throw error;
  }
  return body;
}

export async function fetchBajadasConfigCandidates() {
  const response = await fetch(`${API_BASE}/bajadas-v2/config/candidates`);
  if (!response.ok) throw new Error("No se pudo listar candidatos.");
  return response.json();
}

export async function fetchBajadasActiveVersion() {
  const response = await fetch(`${API_BASE}/bajadas-v2/config/active-version`);
  if (!response.ok) throw new Error("No se pudo cargar versión activa.");
  return response.json();
}

export async function fetchBajadasBackups() {
  const response = await fetch(`${API_BASE}/bajadas-v2/config/backups`);
  if (!response.ok) throw new Error("No se pudo cargar backups.");
  return response.json();
}

export async function fetchBajadasBackupDetail(backupFilename) {
  const response = await fetch(`${API_BASE}/bajadas-v2/config/backups/${encodeURIComponent(backupFilename)}`);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.detail || "No se pudo cargar detalle del backup");
    error.status = response.status;
    throw error;
  }
  return body;
}

export async function restoreBajadasBackup(backupFilename, payload) {
  const response = await fetch(`${API_BASE}/bajadas-v2/config/backups/${encodeURIComponent(backupFilename)}/restore`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.detail || "No se pudo restaurar backup");
    error.status = response.status;
    throw error;
  }
  return body;
}

export async function previewRestoreBajadasBackup(backupFilename) {
  const response = await fetch(`${API_BASE}/bajadas-v2/config/backups/${encodeURIComponent(backupFilename)}/restore-preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.detail || "No se pudo previsualizar restore");
    error.status = response.status;
    throw error;
  }
  return body;
}

export async function simulateRestoreBajadasBackup(backupFilename, cotizacion) {
  const response = await fetch(`${API_BASE}/bajadas-v2/config/backups/${encodeURIComponent(backupFilename)}/restore-simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cotizacion }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.detail || "No se pudo simular cotización con backup");
    error.status = response.status;
    error.code = body?.error || "api_error";
    throw error;
  }
  return body;
}

export async function approveBajadasConfigCandidate(candidateId, motivo = "aprobacion_manual_ui") {
  const response = await fetch(`${API_BASE}/bajadas-v2/config/candidate/${candidateId}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ motivo_aprobacion: motivo }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.detail || "No se pudo aprobar candidato");
    error.status = response.status;
    throw error;
  }
  return body;
}

export async function promoteBajadasConfigCandidate(candidateId, payload) {
  const response = await fetch(`${API_BASE}/bajadas-v2/config/candidate/${candidateId}/promote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.detail || "No se pudo promover candidato");
    error.status = response.status;
    throw error;
  }
  return body;
}

export async function rejectBajadasConfigCandidate(candidateId, motivo = "rechazo_manual_ui") {
  const response = await fetch(`${API_BASE}/bajadas-v2/config/candidate/${candidateId}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ motivo_rechazo: motivo }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.detail || "No se pudo rechazar candidato");
    error.status = response.status;
    throw error;
  }
  return body;
}


