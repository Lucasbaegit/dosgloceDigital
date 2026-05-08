# 02 - Mapa Funcional de Bajadas (Segunda Pasada)

Estado: PENDIENTE_DE_INTERPRETACION

## Alcance
- Hoja analizada: `Bajadas`
- Dependencia externa referenciada: `PAPEL US$` (sin análisis profundo)
- Excel original: sin modificaciones

## Bloques semánticos detectados
| ID | Rango | Tipo | Título detectado | Función probable | Celdas con valor | Fórmulas |
|---|---|---|---|---|---:|---:|
| SB01 | W1:AJ1 | pendiente de interpretación | tienda | PENDIENTE_DE_INTERPRETACION | 5 | 0 |
| SB02 | B2:X11 | cálculo intermedio | A3+ (32x47) | Cálculo de costos/precios por rangos de cantidad, formato, gramaje y caras (probable). | 209 | 152 |
| SB03 | B12:X21 | cálculo intermedio | XA3 (33x48) | Cálculo de costos/precios por rangos de cantidad, formato, gramaje y caras (probable). | 186 | 136 |
| SB04 | B22:X31 | cálculo intermedio | XL 32x70 | Cálculo de costos/precios por rangos de cantidad, formato, gramaje y caras (probable). | 186 | 150 |
| SB05 | Z16:AS44 | tabla de referencia | Coeficiente papel | Parámetros/coeficientes de ajuste para cálculos de bajadas y costos (probable). | 245 | 46 |
| SB06 | B32:X44 | cálculo intermedio | Bajada A4 | Cálculo de costos/precios por rangos de cantidad, formato, gramaje y caras (probable). | 182 | 141 |
| SB07 | B45:AO53 | cálculo intermedio | A3 PLUS | Cálculo de costos/precios por rangos de cantidad, formato, gramaje y caras (probable). | 242 | 153 |
| SB08 | B54:AG62 | cálculo intermedio | XA3 | Cálculo de costos/precios por rangos de cantidad, formato, gramaje y caras (probable). | 190 | 127 |
| SB09 | B63:AC71 | cálculo intermedio | Bajada XL | Cálculo de costos/precios por rangos de cantidad, formato, gramaje y caras (probable). | 161 | 110 |
| SB10 | AB69:AJ71 | cálculo intermedio | A3 PLUS | Cálculo de costos/precios por rangos de cantidad, formato, gramaje y caras (probable). | 17 | 2 |
| SB11 | B72:AB79 | cálculo intermedio | Bajada A4 | Cálculo de costos/precios por rangos de cantidad, formato, gramaje y caras (probable). | 142 | 102 |
| SB12 | B84:E92 | salida | Encuadernacion | Matriz de precios de encuadernación por tipo y tramo (probable). | 29 | 0 |

## Dimensiones de negocio detectadas (heurístico)
- bajadas_por_pliego
- cantidad
- caras_impresion
- coste_impresion
- coste_papel
- gramajes
- margen
- pliegos_necesarios
- precio_base
- precio_final
- rangos_produccion
- tamaños

## Dependencias
- Hojas referenciadas: PAPEL US$
- Celdas con referencia a PAPEL US$: `1`

## Dudas
- PENDIENTE_DE_INTERPRETACION: mapear inequívocamente precio base/final/unitario por columna en cada sub-bloque.
- PENDIENTE_DE_INTERPRETACION: validar si los coeficientes son margen comercial, desperdicio o ajuste técnico según contexto de producto.