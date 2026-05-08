# 02 Árbol de Fórmula Autoadhesivas

## Papel (base stickers)
- Salida: `S4:S10`
- Patrón: `=(AC4x + AC12*AF4x)*AH4x`
- Lectura funcional: `(costo impresión/click + componente stickers ajustado) * coeficiente por escala`

## Especial (base OPP blanco/blanco)
- Salida: `U4:U10`
- Patrón: `=(AC4x + AC13*AF4x)*AH4x`
- Lectura funcional: `(costo impresión/click + componente OPP/blanco ajustado) * coeficiente por escala`

## Celdas núcleo
- `AC12`: componente stickers (deriva de PAPEL US$ + coeficientes)
- `AC13`: componente OPP/blanco
- `AC48:AC55`: costo base click/impresión por tramo
- `AH48:AH55`: coeficientes por escala
- `AF48:AF55`: factor multiplicador intermedio (actualmente 1.0)