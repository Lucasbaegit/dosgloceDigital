# 06 - Recalibración desde CSV limpio

Fuente única: precios_pdf_objetivo_limpio.csv/json (sin PDF, sin OCR).

## Factores Modelo A
- factor_xl_global: 1.9616560919797734
- factor_a4_global: 0.5516795865633075

## Factores Modelo B
- factores_xl: {'blanco_y_negro': 1.9407645534290272, 'fullcolor': 1.9621456813798899, 'global': 1.9616560919797734}
- factores_a4: {'blanco_y_negro': 0.8112610507458037, 'fullcolor': 0.5400453857791225, 'global': 0.5516795865633075}

## Factores Modelo C
- factores_xl: {'blanco_y_negro|liviano': 1.9407645534290272, 'blanco_y_negro|pesado': 2.0535605483625288, 'fullcolor|liviano': 1.9759680134680133, 'fullcolor|pesado': 1.9394824259092633, 'global': 1.9616560919797734, 'fullcolor': 1.9621456813798899, 'blanco_y_negro': 1.9407645534290272}
- factores_a4: {'blanco_y_negro|liviano': 0.8624168806373034, 'blanco_y_negro|pesado': 0.7682140273504572, 'fullcolor|liviano': 0.5347157077340003, 'fullcolor|pesado': 0.5449394763402651, 'global': 0.5516795865633075, 'fullcolor': 0.5400453857791225, 'blanco_y_negro': 0.8112610507458037}

## Modelo A
- OK: 405
- DIFERENCIA_LEVE: 88
- DIFERENCIA_MEDIA: 23
- DIFERENCIA_ALTA: 148
- SIN_COMPARACION: 78

## Modelo B
- OK: 472
- DIFERENCIA_LEVE: 65
- DIFERENCIA_MEDIA: 56
- DIFERENCIA_ALTA: 71
- SIN_COMPARACION: 78

## Modelo C
- OK: 515
- DIFERENCIA_LEVE: 44
- DIFERENCIA_MEDIA: 47
- DIFERENCIA_ALTA: 58
- SIN_COMPARACION: 78