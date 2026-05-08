# API interna Bajadas v2

## Alcance
API HTTP mínima interna para exponer cotización y estado del motor Bajadas v2 sin UI.

## Estructura
- `src/api/main.py`
- `src/api/bajadas_v2_routes.py`
- `src/api/schemas.py`
- `src/api/__init__.py`

## Endpoints

### `GET /health`
Respuesta:
```json
{
  "status": "ok",
  "service": "bajadas_v2_api"
}
```

### `GET /bajadas-v2/health`
Valida:
- `config final` existe
- `snapshot` existe
- motor importa correctamente

### `GET /bajadas-v2/metrics`
Devuelve métricas desde snapshot:
- `OK`
- `DIFERENCIA_LEVE`
- `DIFERENCIA_MEDIA`
- `DIFERENCIA_ALTA`
- `SIN_COMPARACION`
- `casos_regresion`
- `precio_fijo_csv`

### `POST /bajadas-v2/cotizar`
Body:
```json
{
  "categoria": "Bajadas Fullcolor",
  "modo_color": "fullcolor",
  "formato": "A3+",
  "tipo_papel": "liviano",
  "material": "Ilustracion",
  "gramaje": "150g",
  "cantidad_rango": "1",
  "caras": "4/0",
  "terminacion": null,
  "urgencia": "express"
}
```

Respuesta:
- `precio_sin_iva`
- `precio_con_recargo_urgencia`
- `regla_aplicada`
- `fuente`
- `trazabilidad`

## Manejo de errores
- `400 validation_error`: campos faltantes o JSON inválido.
- `400 urgencia_invalida`: urgencia fuera de catálogo.
- `404 combinacion_no_encontrada`: combinación sin resolución.
- `500 internal_error`: error interno controlado.

## Tests
- `tests/api/test_bajadas_v2_api.py`
  - `/health`
  - `/bajadas-v2/health`
  - `/bajadas-v2/metrics`
  - `/bajadas-v2/cotizar` caso normal
  - `/bajadas-v2/cotizar` caso `precio_fijo_csv`
  - urgencia inválida
  - combinación inexistente

## Arranque local
```powershell
python scripts\bajadas_v2\run_api_bajadas_v2.py --host 127.0.0.1 --port 8000
```

## Nota de stack
No se detectó `FastAPI` en el entorno actual, por eso se implementó una API mínima separada sobre `http.server` para mantener cero dependencias extra.
