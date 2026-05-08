# 03 - Entradas y Salidas de Bajadas

Estado: PENDIENTE_DE_INTERPRETACION

## Entradas reales o probables
- Rango/cantidad (ej: `2 a 25`, `26 a 50`, `501 a 1000`)
- Gramajes y tipo de papel (Triplex, Obra, Sticker, OPP, Imán)
- Tamaños/formato (A3, XA3, A4, XL, medidas cm)
- Caras de impresión (`4/0`, `4/4`, `1/0`, `1/1`)
- Coeficientes y parámetros (rangos pack, coeficientes de color/ByN, clic)
- Dependencia de costos de papel referenciando `PAPEL US$`

## Salidas reales o probables
- Celdas de cálculo final por tramo dentro de cada bloque de bajada
- Matrices de costo/precio en zonas derechas y tablas de cada formato
- Tabla de encuadernación (`B84:E92`) como salida tarifaria probable

## Listado técnico (muestra)
- Entradas candidatas detectadas: `451`
- Salidas candidatas detectadas: `1056`
- Ejemplo entradas: `AA1, AA18, AA19, AA20, AA21, AA22, AA23, AA24, AA25, AA26, AA27, AA32, AA33, AA34, AA35, AA36, AA37, AA38, AA39, AA40`
- Ejemplo salidas: `AA54, AA55, AB48, AB49, AB50, AB51, AB52, AB53, AB54, AB55, AC48, AC49, AC50, AC51, AC52, AC53, AC54, AC55, AC63, AD48`

## Dudas pendientes
- PENDIENTE_DE_INTERPRETACION: confirmar qué columnas son precio base vs precio final vs precio unitario.
- PENDIENTE_DE_INTERPRETACION: confirmar fórmula exacta de margen/desperdicio por familia de producto.