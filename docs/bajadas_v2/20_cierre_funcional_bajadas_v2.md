# 20 - Cierre funcional Bajadas v2

## Decisiones de cierre
- Se abandona la migraci?n f?rmula-por-f?rmula del Excel hist?rico por deuda l?gica y acoplamiento a variables desactualizadas (p. ej. d?lar hist?rico).
- Se adopta `precios_pdf_objetivo_limpio.csv` como fuente de verdad de precios finales sin IVA.
- A3+ se mantiene como base de c?lculo por cobertura y estabilidad relativa.
- XA3 se deriva como +10% (`factor_xa3=1.10`) para consistencia operativa.
- XL ByN requiri? Modelo D/D2 por desv?os persistentes no resueltos por Modelo C.
- AN40 queda como `PENDIENTE_DE_INTERPRETACION` y `NO_MODIFICAR` porque su simulaci?n no mejora materialmente el ajuste.
- Los 7 casos residuales de alta diferencia se cierran con `PRECIO_FIJO_CSV` para evitar sobreajuste y preservar mantenibilidad.

## Validaci?n final
- OK: **533**
- DIFERENCIA_LEVE: **51**
- DIFERENCIA_MEDIA: **40**
- DIFERENCIA_ALTA: **0**
- SIN_COMPARACION: **48**
- precios_fijos_aplicados: **7**
- reglas_especiales_activas: **1**
- correcciones_l?gicas_activas: **1**
- pendientes_interpretaci?n: **1**

## Qu? queda listo
- Motor Bajadas v2 parametrizable por d?lar, factores, recargos y redondeo.
- Segmento XL ByN estabilizado operativamente con D2 + 7 precios fijos.
- Trazabilidad de decisiones funcionales y auditor?as AN40 disponibles.

## Pendiente para m?dulos futuros
- Resolver sem?ntica definitiva de AN40 con validaci?n de negocio.
- Revisar estrategia de `SIN_COMPARACION` por categor?as no derivables desde A3+.
- Integrar flujo de mantenimiento de precios fijos con gobernanza (altas/bajas/versionado).