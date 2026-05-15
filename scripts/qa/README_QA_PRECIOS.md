# QA Masivo de Precios (API)

## 1) Levantar backend/frontend local

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy_local\start_cotizador_local.ps1
```

## 2) Ejecutar QA completo

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\qa\run_qa_precios.ps1
```

## 3) Ejecutar por grupo

```powershell
python .\scripts\qa\qa_precios_masivo.py --only bajadas
python .\scripts\qa\qa_precios_masivo.py --only autoadhesivas
python .\scripts\qa\qa_precios_masivo.py --only tarjetas
```

## 4) Listar casos disponibles

```powershell
python .\scripts\qa\qa_precios_masivo.py --list
```

## 5) Reportes

Se guardan en:

- `reports\qa\qa_precios_YYYYMMDD_HHMMSS.json`
- `reports\qa\qa_precios_YYYYMMDD_HHMMSS.csv`

## 6) Agregar un caso nuevo

Editar `scripts\qa\qa_precios_masivo.py` en `build_cases()` y agregar:

- `id`, `grupo`, `nombre`
- `endpoint`
- `payload`
- `expected_status`
- `expected_total_sin_iva` o `expected_error`
- opcional `checks` para validar campos extra

## 7) Interpretación PASS/FAIL

- `PASS`: status y validaciones esperadas coinciden.
- `FAIL`: difiere status, total, error esperado o checks extra.
- Si la API no responde, el script termina con:
  - `API no disponible. Levantá scripts/deploy_local/start_cotizador_local.ps1`
