# 15 - Auditoría de 7 diferencias altas del Modelo D

## Resumen general
- Casos auditados: **7**
- Filtro aplicado: `estado = DIFERENCIA_ALTA` en `comparativa_modelo_d_final.json`.
- Segmento: `Bajadas Blanco y Negro / XL`.
- Mismo tipo de papel: **False**
- Misma cara: **False**
- Mismo rango de cantidad: **False**

## Tabla de los 7 casos
| id | tipo_papel | material | gramaje | cantidad_rango | caras | objetivo | estimado | dif_% | factor | clasificación |
|---|---|---|---|---|---:|---:|---:|---:|---:|---|
| MD7-01 | liviano | Ilustracion | 80g | 1 | 1/1 | 687.00 | 789.31 | 14.8922% | 2.2423559796 | REGLA_ESPECIAL_REQUERIDA |
| MD7-02 | pesado | Triplex | Triplex | 1 | 1/0 | 884.00 | 990.76 | 12.0766% | 1.8553509037 | PRECIO_FIJO_CSV |
| MD7-03 | pesado | Triplex | Triplex | 2 a 50 | 1/0 | 724.00 | 810.79 | 11.9873% | 1.8553509037 | PRECIO_FIJO_CSV |
| MD7-04 | pesado | Triplex | Triplex | 51 a 100 | 1/0 | 683.00 | 764.40 | 11.9187% | 1.8553509037 | PRECIO_FIJO_CSV |
| MD7-05 | pesado | Triplex | Triplex | 101 a 500 | 1/0 | 643.00 | 719.88 | 11.9559% | 1.8553509037 | PRECIO_FIJO_CSV |
| MD7-06 | pesado | Triplex | Triplex | 501 a 1000 | 1/0 | 603.00 | 675.35 | 11.9980% | 1.8553509037 | PRECIO_FIJO_CSV |
| MD7-07 | pesado | Triplex | Triplex | 1001 a 5000 | 1/0 | 563.00 | 630.82 | 12.0461% | 1.8553509037 | PRECIO_FIJO_CSV |

## Causa probable
- Patron repetido de desvio alto en subsegmento XL ByN liviano 1/1 por rango de cantidad: **1** casos
- Outlier puntual en XL ByN no absorbido por factor D2 tipo_papel+caras: **6** casos

## Recomendación por caso
- **MD7-01** (Ilustracion 80g / 1 / 1/1): Evaluar mini-regla puntual por rango (sin tocar globales). Si se prioriza simplicidad, usar precio fijo CSV.
- **MD7-02** (Triplex Triplex / 1 / 1/0): Fijar este caso con precio fijo CSV para cierre operativo de Modelo D sin agregar subfactores.
- **MD7-03** (Triplex Triplex / 2 a 50 / 1/0): Fijar este caso con precio fijo CSV para cierre operativo de Modelo D sin agregar subfactores.
- **MD7-04** (Triplex Triplex / 51 a 100 / 1/0): Fijar este caso con precio fijo CSV para cierre operativo de Modelo D sin agregar subfactores.
- **MD7-05** (Triplex Triplex / 101 a 500 / 1/0): Fijar este caso con precio fijo CSV para cierre operativo de Modelo D sin agregar subfactores.
- **MD7-06** (Triplex Triplex / 501 a 1000 / 1/0): Fijar este caso con precio fijo CSV para cierre operativo de Modelo D sin agregar subfactores.
- **MD7-07** (Triplex Triplex / 1001 a 5000 / 1/0): Fijar este caso con precio fijo CSV para cierre operativo de Modelo D sin agregar subfactores.

## Decisión recomendada de cierre
- Recomendación: **agregar precios fijos puntuales para los 7 casos** y mantener Modelo D congelado. Opcionalmente, documentar una mini-regla futura solo para el caso liviano 1/1 si se quiere eliminar el último outlier por regla.