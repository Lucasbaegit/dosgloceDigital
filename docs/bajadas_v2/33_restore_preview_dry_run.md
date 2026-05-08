# 33 - Restore Preview (Dry-Run) de Backups

## Objetivo
Agregar una previsualización segura de restore para inspeccionar impacto antes de restaurar un backup productivo.

## Endpoint nuevo

- `POST /bajadas-v2/config/backups/{backup_filename}/restore-preview`

## Comportamiento

Este endpoint:

- valida `backup_filename` con protección anti path traversal;
- verifica existencia del backup;
- parsea JSON y valida estructura completa de configuración;
- compara backup contra `config_final` actual;
- devuelve diff y resumen de criticidad.

Y **no** hace lo siguiente:

- no modifica `config_final`;
- no crea backup pre-restore;
- no registra evento de restore real en `history`.

## Respuesta

Incluye:

- `backup_filename`
- `backup_hash`
- `config_final_hash_actual`
- `valid`
- `errors`
- `warnings`
- `diff_preview[]`:
  - `campo`, `valor_actual`, `valor_backup`, `estado`, `criticidad`, `descripcion`
- `resumen`:
  - `cantidad_cambios`
  - `criticidad_maxima`
  - `puede_restaurarse`
- `mensaje`:
  - `"Dry-run: no se modificó la configuración productiva."`

## UI

En Configuración > Backups:

- botón `Previsualizar restore`
- muestra hashes, cantidad de cambios, criticidad y diff de cambios relevantes
- advertencia visible:
  - `"Esta previsualización no modifica la configuración productiva."`

Se recomienda usar preview antes de ejecutar restore real.

## Nota sobre restore-simulate

`restore-simulate` queda **pendiente** para una etapa posterior, para comparar cotización final vs backup sin promover/restaurar.
