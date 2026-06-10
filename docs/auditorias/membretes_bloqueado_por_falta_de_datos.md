# Membretes bloqueado por falta de datos confiables

## Resultado
- Estado: `MEMBRETES_BLOQUEADO_POR_FALTA_DE_DATOS_CONFIABLES`
- Fecha auditoría: 2026-05-14

## Evidencia PDF (página 14)
Se detecta la sección **Membretes** con:
- Formato: `A4`
- Papel: `80g`
- Cantidades: `100, 200, 300, 500, 1000`
- Caras: `1/0` y `4/0`

Pero la tabla de precios no aparece legible/extráctil (celdas numéricas vacías en extracción estructurada).

## Evidencia Excel (histórico)
En `Hoja3` (filas 151-156) aparecen valores históricos:
- 100: 4/0=473, 1/0=275
- 200: 4/0=814, 1/0=484
- 300: 4/0=1221, 1/0=726
- 500: 4/0=2035, 1/0=1210
- 1000: 4/0=3630, 1/0=2200

## Motivo del bloqueo
Regla vigente del proyecto: **PDF manda precio final**. Sin tabla numérica PDF confiable de Membretes, no se puede publicar implementación sin riesgo de inventar o usar precios históricos no vigentes.

## Dato exacto faltante
1. Tabla completa de Membretes (A4, 80g) para cantidades 100/200/300/500/1000 en caras 1/0 y 4/0.
2. Confirmación de convención de precio: unitario o total por cantidad.

## Próximo paso mínimo correcto
Aportar PDF/imagen de página 14 con resolución suficiente donde se lea completa la tabla de Membretes, o fuente oficial equivalente.
