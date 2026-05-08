# 34 - Restore Simulate con Backup (Dry-Run de Cotización)

## Endpoint

- `POST /bajadas-v2/config/backups/{backup_filename}/restore-simulate`

## Entrada

```json
{
  "cotizacion": {
    "categoria": "Bajadas Fullcolor",
    "modo_color": "fullcolor",
    "formato": "A3+",
    "tipo_papel": "liviano",
    "material": "Ilustracion",
    "gramaje": "150g",
    "cantidad_unidades": 30,
    "cantidad_rango": "26 a 50",
    "caras": "4/0",
    "urgencia": "normal"
  }
}
```

## Qué hace

- valida `backup_filename` y bloquea path traversal;
- valida que el backup exista y sea estructura válida;
- calcula la cotización con:
  - `config_final` actual;
  - `config` del backup seleccionado;
- compara resultados y devuelve diferencias.

## Qué NO hace

- no restaura backup;
- no modifica `config_final`;
- no modifica `config_editable`;
- no escribe `history`;
- no crea backups;
- no toca candidates.

## Respuesta principal

- `resultado_config_final`
- `resultado_backup`
- `diferencia_unitaria_sin_iva`
- `diferencia_total_sin_iva`
- `diferencia_total_con_urgencia`
- `diferencia_porcentual_total`
- `trazabilidad_comparativa`
- `mensaje`: `"Simulación dry-run: no se modificó la configuración productiva."`

## UI

En Configuración > Backups se agregó botón:

- `Simular cotización con backup`

Usa la última cotización realizada como payload base y muestra:

- total actual;
- total con backup;
- diferencia absoluta;
- diferencia porcentual;
- trazabilidad comparativa.

Incluye leyenda:

- `"Esta simulación no restaura el backup."`
