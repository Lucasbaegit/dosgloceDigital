# Árbol Laca UV

- Encabezado: `E6 = Laca UV`
- Rango de salida: `E7:E13`
- Fórmula patrón: `=Cx/I2`

## Composición
1. Base unitario: `C5 = =A2/B4*C4*C1` -> valor actual `35.2403546`
2. Escala cantidad: `L7:L13` -> 4.0, 3.7, 3.4, 3.1, 2.9, 2.7, 2.5
3. Base brillo por rango: `Cx = C5*Lx*D2`
4. Laca UV por rango: `Ex = Cx/I2`

## Salidas actuales por escala
- `0 - 10` -> `E7` = 136.2627045
- `11-50` -> `E8` = 126.0430016
- `51-100` -> `E9` = 115.8232988
- `101-500` -> `E10` = 105.603596
- `501-1000` -> `E11` = 98.79046073
- `1001 +` -> `E12` = 91.97732551
- `1001 +` -> `E13` = 85.16419028
