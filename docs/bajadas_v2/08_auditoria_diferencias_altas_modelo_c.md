# 08 - Auditoría diferencias altas Modelo C

- Diferencias altas auditadas: `58`

## Resumen general
- REGLA_ESPECIAL_REQUERIDA: `58`

## Tabla por categoría
| Categoría | Cantidad |
|---|---:|
| Bajadas Blanco y Negro | 58 |

## Tabla por formato
| Formato | Cantidad |
|---|---:|
| XL | 58 |

## Tabla por causa probable
| Causa probable | Cantidad |
|---|---:|
| Patrón repetido XL ByN pesado: el derivado desde A3+ no replica bien la curva real del CSV. | 36 |
| Patrón repetido XL ByN liviano: sensibilidad de escala por rango/cara no capturada por factor fijo. | 22 |

## Top 20 diferencias más grandes
| id | categoría | formato | tipo_papel | material | gramaje | rango | caras | dif_% | clasificación recomendada |
|---|---|---|---|---|---|---|---|---:|---|
| ALT-001 | Bajadas Blanco y Negro | XL | pesado | Triplex | Triplex | 1 | 1/0 | 24.05 | REGLA_ESPECIAL_REQUERIDA |
| ALT-002 | Bajadas Blanco y Negro | XL | pesado | Triplex | Triplex | 1001 a 5000 | 1/0 | 24.02 | REGLA_ESPECIAL_REQUERIDA |
| ALT-003 | Bajadas Blanco y Negro | XL | pesado | Triplex | Triplex | 501 a 1000 | 1/0 | 23.96 | REGLA_ESPECIAL_REQUERIDA |
| ALT-004 | Bajadas Blanco y Negro | XL | pesado | Triplex | Triplex | 2 a 50 | 1/0 | 23.95 | REGLA_ESPECIAL_REQUERIDA |
| ALT-005 | Bajadas Blanco y Negro | XL | pesado | Triplex | Triplex | 101 a 500 | 1/0 | 23.92 | REGLA_ESPECIAL_REQUERIDA |
| ALT-006 | Bajadas Blanco y Negro | XL | pesado | Triplex | Triplex | 51 a 100 | 1/0 | 23.88 | REGLA_ESPECIAL_REQUERIDA |
| ALT-007 | Bajadas Blanco y Negro | XL | pesado | Ilustracion | 350g | 2 a 50 | 1/1 | -17.67 | REGLA_ESPECIAL_REQUERIDA |
| ALT-008 | Bajadas Blanco y Negro | XL | pesado | Ilustracion | 350g | 1001 a 5000 | 1/1 | -17.65 | REGLA_ESPECIAL_REQUERIDA |
| ALT-009 | Bajadas Blanco y Negro | XL | pesado | Ilustracion | 350g | 501 a 1000 | 1/1 | -17.63 | REGLA_ESPECIAL_REQUERIDA |
| ALT-010 | Bajadas Blanco y Negro | XL | pesado | Ilustracion | 350g | 101 a 500 | 1/1 | -17.61 | REGLA_ESPECIAL_REQUERIDA |
| ALT-011 | Bajadas Blanco y Negro | XL | pesado | Ilustracion | 350g | 1 | 1/1 | -17.55 | REGLA_ESPECIAL_REQUERIDA |
| ALT-012 | Bajadas Blanco y Negro | XL | pesado | Ilustracion | 350g | 51 a 100 | 1/1 | -17.52 | REGLA_ESPECIAL_REQUERIDA |
| ALT-013 | Bajadas Blanco y Negro | XL | pesado | Ilustracion | 300g | 501 a 1000 | 1/1 | -16.59 | REGLA_ESPECIAL_REQUERIDA |
| ALT-014 | Bajadas Blanco y Negro | XL | pesado | Ilustracion | 300g | 1 | 1/1 | -16.57 | REGLA_ESPECIAL_REQUERIDA |
| ALT-015 | Bajadas Blanco y Negro | XL | pesado | Ilustracion | 300g | 51 a 100 | 1/1 | -16.56 | REGLA_ESPECIAL_REQUERIDA |
| ALT-016 | Bajadas Blanco y Negro | XL | pesado | Ilustracion | 300g | 1001 a 5000 | 1/1 | -16.5 | REGLA_ESPECIAL_REQUERIDA |
| ALT-017 | Bajadas Blanco y Negro | XL | pesado | Ilustracion | 300g | 101 a 500 | 1/1 | -16.48 | REGLA_ESPECIAL_REQUERIDA |
| ALT-018 | Bajadas Blanco y Negro | XL | pesado | Ilustracion | 300g | 2 a 50 | 1/1 | -16.45 | REGLA_ESPECIAL_REQUERIDA |
| ALT-019 | Bajadas Blanco y Negro | XL | liviano | Ilustracion | 150g | 1001 a 5000 | 1/1 | -16.29 | REGLA_ESPECIAL_REQUERIDA |
| ALT-020 | Bajadas Blanco y Negro | XL | liviano | Ilustracion | 150g | 51 a 100 | 1/1 | -16.24 | REGLA_ESPECIAL_REQUERIDA |

## Recomendación de cierre
- Congelar Modelo C como baseline (sin nuevos factores por ahora).
- Tratar el bloque XL ByN como segmento especial en próxima iteración, o fijar precios CSV para los casos críticos si se busca cierre rápido.
- Mantener `SIN_COMPARACION` sin inventar valores.