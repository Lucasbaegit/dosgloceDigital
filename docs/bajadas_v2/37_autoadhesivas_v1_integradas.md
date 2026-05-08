# Bajadas v2 + Autoadhesivas v1 integradas

`POST /bajadas-v2/cotizar` enruta por categoría:
- `Bajadas Autoadhesivas` -> motor `src/bajadas_autoadhesivas`.
- Resto -> motor `src/bajadas_v2` (sin cambios de reglas).

Para Autoadhesivas v1:
- Papel y especial usan precio objetivo PDF exacto por rango.
- `MODELO_B3` queda como trazabilidad técnica de especial.
