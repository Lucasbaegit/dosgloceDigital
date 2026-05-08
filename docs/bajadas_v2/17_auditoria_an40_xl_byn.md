# 17 - Auditoría AN40 en XL ByN

- AN40 valor actual: **2.0**
- AN40 fórmula: **2.0**
- Bloque: **SB05**
- Fórmulas que usan AN40: **103**
- Bloques afectados: **SB05, SB09**
- Modos afectados: **blanco_y_negro, fullcolor**
- Caras afectadas: **1/0, 1/1**

## Etiquetas cercanas AN40
- AL38:Dólar
- AL40:Coeficiente XL
- AL41:Coeficiente A4
- AL42:costo clic color A3

## Diferencia estructural ByN vs Fullcolor
- XL ByN 1/0: `=(AA11+AA48*AN40)*AH$48`
- XL Fullcolor 4/0: `=(AD48+AA11)*$AH$48`
- Lectura: AN40 entra como multiplicador del click en ByN y no tiene homólogo directo en fullcolor dentro de la misma composición.