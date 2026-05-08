# 31 - Aprobación y Promoción de Configuración (Bajadas v2)

## Objetivo
Agregar un flujo seguro de staging para configuración:

1. `config_editable` se valida y se transforma en candidato.
2. el candidato se aprueba (`APROBADO`) sin tocar producción.
3. recién después se promueve (`PROMOVIDO`) con confirmación explícita y backup automático.

La fuente productiva sigue siendo `data/bajadas_v2/bajadas_v2_config_final.json` hasta que se ejecute una promoción válida.

## Endpoints nuevos

- `POST /bajadas-v2/config/candidate/{candidate_id}/approve`
  - Cambia estado de `PENDIENTE_APROBACION` a `APROBADO`.
  - Guarda `fecha_aprobacion`, `usuario_aprobacion`, `motivo_aprobacion`.
  - No modifica `config_final`.

- `POST /bajadas-v2/config/candidate/{candidate_id}/promote`
  - Requiere body:
    - `confirmacion: "PROMOVER_CONFIG_BAJADAS_V2"`
    - `motivo`
    - `usuario` (opcional)
  - Solo permite candidatos `APROBADO`.
  - Revalida snapshot y hash.
  - Crea backup automático en `data/bajadas_v2/backups/`.
  - Reemplaza `bajadas_v2_config_final.json`.
  - Marca candidato como `PROMOVIDO`.
  - Registra evento en `config_history.json`.

- `GET /bajadas-v2/config/active-version`
  - Devuelve versión activa, hash actual, candidato origen y estado productivo.

- `GET /bajadas-v2/config/backups`
  - Lista backups disponibles con fecha, tamaño y hash.

## Flujo recomendado

1. Editar `config_editable` desde UI o endpoint update.
2. Validar (`POST /config/validate`).
3. Crear candidato (`POST /config/candidate/create`).
4. Aprobar candidato (`POST /config/candidate/{id}/approve`).
5. Promover candidato (`POST /config/candidate/{id}/promote`) escribiendo el texto exacto:
   - `PROMOVER_CONFIG_BAJADAS_V2`
6. Verificar versión activa y backups:
   - `GET /config/active-version`
   - `GET /config/backups`

## UI (solapa Configuración)

Se agregó:

- sección "Versión activa"
- sección "Candidato de configuración" con acciones:
  - `Aprobar`
  - `Promover` (solo si está `APROBADO`)
  - `Rechazar`
- sección "Backups disponibles"
- advertencia:
  - "Promover reemplaza la configuración productiva. Se creará backup automático."

Importante:
crear o aprobar candidato no impacta la cotización productiva.

## Garantías de seguridad implementadas

- Confirmación textual obligatoria en promoción.
- Validación completa del snapshot antes de promover.
- Verificación de hash del snapshot candidato.
- Backup automático previo al reemplazo de configuración productiva.
- Trazabilidad en historial (`config_history.json`).

## Pendiente (siguiente etapa)

- endpoint de restore desde backup específico.
- política de retención/rotación de backups.
- auditoría de usuario real (no solo `local`).
