# 04 Modelo Recomendado Autoadhesivas (base Excel)

## Modelos evaluados
- **Modelo A**: mantener fórmula Excel y actualizar solo dólar/materiales.
- **Modelo B**: mantener estructura Excel + factor de calibración por columna (`papel`, `especial`).
- **Modelo C**: mantener trazabilidad Excel pero resolver precio final por tabla calibrada por rango.

## Recomendación
- **Modelo recomendado: B (híbrido simple)**.

Justificación:
1. Se conserva la lógica estructural del Excel (`S4:S10`, `U4:U10`) y su trazabilidad.
2. El componente `stickers` muestra magnitudes históricas no directamente compatibles con precio objetivo actual; requiere calibración explícita.
3. `especial` (U) está en escala de magnitud cercana al objetivo y se beneficia de calibración moderada.
4. Evita convertir todo en precio fijo, pero permite llegar al objetivo PDF actualizado por rango.

## Pendientes de interpretación
- Relación exacta entre salidas de fórmula `S/U` y valores visibles históricos `W/X`.
- Confirmar si `W/X` fueron lista manual comercial o salida derivada externa.
- Validar negocio sobre uso de `AM38`, `AM42` y política de margen actual.