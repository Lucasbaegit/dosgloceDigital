# 28. Árbol de Precio y Configuración (v1)

## Alcance
Se agregó una primera versión de paneles productivos en frontend/API:
- Solapa `Cotizador`
- Solapa `Árbol del precio`
- Solapa `Configuración`

## Árbol del precio
Muestra la trazabilidad del último cálculo en nodos jerárquicos:
- Entrada del usuario
- Rango aplicado
- Precio unitario
- Total
- Regla
- Origen
- Urgencia

Incluye `Ver JSON técnico` para diagnóstico.

## Configuración editable versionada
Se creó configuración editable separada de la final:
- `data/bajadas_v2/bajadas_v2_config_editable.json`
- `data/bajadas_v2/config_history.json`

No se modifica `bajadas_v2_config_final.json`.

## Endpoints nuevos
- `GET /bajadas-v2/config`
- `POST /bajadas-v2/config/update`
- `GET /bajadas-v2/config/history`
- `GET /bajadas-v2/config/tree`
- `POST /bajadas-v2/config/restore`

## Validaciones implementadas
- dólar > 0
- factores > 0
- recargos entre 0 y 1
- escalas con `desde <= hasta`
- escalas sin superposición
- etiqueta no vacía

## Nota de integración con motor
Config editable preparada y persistente. En esta etapa no se reemplaza automáticamente el baseline productivo congelado; el motor sigue operando con la base validada actual.
