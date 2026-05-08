# 29. Auditoría de Config Editable

## Objetivo
Agregar una capa de auditoría y comparación entre `config_final` y `config_editable` antes de cualquier conexión directa con el motor productivo.

## Endpoints nuevos
- `GET /bajadas-v2/config/diff`
- `POST /bajadas-v2/config/validate`
- `POST /bajadas-v2/config/simulate`

## Qué resuelve cada endpoint
- `config/diff`: muestra diferencias campo por campo con estado y criticidad.
- `config/validate`: valida estructura y reglas de integridad completas.
- `config/simulate`: compara cotización final vs editable sin modificar baseline productivo.

## Resguardo clave
`bajadas_v2_config_final.json` permanece inmutable como fuente activa del motor productivo.

## UI (solapa Configuración)
- Sección “Cambios pendientes” (diff final vs editable)
- Botón “Validar configuración”
- Botón “Simular con configuración editable”
- Advertencia visible: la editable no impacta cotizador productivo.

## Estado
Capa de auditoría lista. Aún no hay promoción de editable a productiva.
