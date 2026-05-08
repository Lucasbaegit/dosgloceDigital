# 30. Staging de Configuración (Pre-aprobación)

## Objetivo
Incorporar una etapa intermedia entre `config_editable` y cualquier promoción futura:
`config_editable -> candidato versionado -> PENDIENTE_APROBACION`.

## Archivos
- `data/bajadas_v2/config_candidates.json`

## Endpoints
- `POST /bajadas-v2/config/candidate/create`
- `GET /bajadas-v2/config/candidates`
- `GET /bajadas-v2/config/candidate/{candidate_id}`
- `POST /bajadas-v2/config/candidate/{candidate_id}/reject`

## Flujo
1. `create` ejecuta `validate` + `diff`.
2. Si `validate` falla: no crea candidato.
3. Si pasa: crea snapshot completo con hash y estado `PENDIENTE_APROBACION`.
4. Se puede listar, consultar detalle y rechazar.

## Garantía
Crear o rechazar candidatos NO aplica cambios productivos ni modifica `config_final`.
No existe endpoint de apply/promote en esta etapa.
