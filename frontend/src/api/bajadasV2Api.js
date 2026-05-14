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


