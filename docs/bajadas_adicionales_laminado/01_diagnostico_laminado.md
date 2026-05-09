# Diagnóstico hoja Laminado

- Hoja analizada: `Laminado`
- Rango usado detectado: `A1:R29`
- Bloques relevantes:
  - Laca UV: `E7:E13` (encabezado `E6`)
  - Laminado brillo: `C7:C13` (encabezado `C6`)
  - Laminado mate: `D7:D13` (encabezado `D6`)
- Escalas detectadas en `B7:B13`: 0 - 10, 11-50, 51-100, 101-500, 501-1000, 1001 +, 1001 +
- Evidencia de pliego A3+: `B3`, `G16`, `G25`

## Observaciones clave
- Brillo y mate comparten estructura, pero **no** tienen el mismo valor final (mate deriva de brillo con otro coeficiente).
- Laca UV usa fórmula propia (`=Cx/I2`) y no es simple copia de brillo/mate.
- No hay referencias directas de fórmula a otras hojas (`!`) ni archivos externos (`[]`).
