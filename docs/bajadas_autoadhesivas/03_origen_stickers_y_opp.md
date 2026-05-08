# 03 Origen Stickers y OPP

## Stickers (columna papel)
- Encabezado origen: `S2=Sticker`
- Celdas salida: `S4:S10`
- Fórmula usa explícitamente `AC12` como componente de stickers.
- `AC12` se calcula con referencias a `PAPEL US$` y coeficientes (`AM38`, `AC26`).

## OPP blanco/blanco (columna especial)
- Encabezado origen: `U2=OPP  blco o blanco`
- Celdas salida: `U4:U10`
- Fórmula usa explícitamente `AC13` como componente de OPP/blanco.
- `AC13` se calcula con referencias a `PAPEL US$` y coeficientes (`AM38`, `AC27`).

## Comparación Excel histórico vs objetivo PDF

| Rango | Papel Excel fórmula (S) | Papel Excel visible (W) | Papel Objetivo | Especial Excel fórmula (U) | Especial Excel visible (X) | Especial Objetivo |
|---|---:|---:|---:|---:|---:|---:|
| 1 | 523393.00 | 460.00 | 1069.00 | 1341.83 | 588.00 | 1797.00 |
| 2 a 25 | 468299.00 | 436.00 | 875.00 | 1200.58 | 557.00 | 1470.00 |
| 26 a 50 | 454525.50 | 412.00 | 826.00 | 1165.27 | 526.00 | 1389.00 |
| 51 a 100 | 440752.00 | 388.00 | 778.00 | 1129.96 | 495.00 | 1307.00 |
| 101 a 300 | 426978.50 | 363.00 | 729.00 | 1094.65 | 464.00 | 1225.00 |
| 301 a 500 | 413205.00 | 339.00 | 680.00 | 1059.34 | 433.00 | 1144.00 |
| 501 a 1000 | 399431.50 | 315.00 | 632.00 | 1024.03 | 402.00 | 1062.00 |