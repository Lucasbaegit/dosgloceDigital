# 12 - Guía de Revisión Humana de Decisiones (Bajadas)

Estado: PENDIENTE_DE_INTERPRETACION

- Decisiones a resolver: `55`

## Cómo usar esta guía
1. Revisar por prioridad (1 a 4).
2. Para cada decisión, responder la pregunta concreta.
3. Cargar la decisión en `12_decisiones_usuario_simple.csv` (`decision_usuario` y `comentario_usuario`).

## Prioridad 1: XL 32x70 / SB04

- Qué está en riesgo: Riesgo alto: salidas con costo de papel o impresión no justificados de forma trazable.
- Qué decisión conviene tomar: Si no hay evidencia clara, usar REQUIERE_REVISION_MANUAL o RECALCULAR_DESDE_COSTO_PAPEL(_E_IMPRESION).
- Qué pasa si se migra tal cual: Si se migra tal cual, se arrastra ambigüedad de precio y potencial desvío comercial.
- Casos en esta prioridad: `24`

### DEC-001 - XL 32x70 SB04 W22
- id_decision: DEC-001
- prioridad: 1
- familia: XL 32x70
- bloque: SB04
- celda: W22
- valor actual: =W14-W4
- fórmula actual: `=W14-W4`
- problema detectado: salida_sin_explicacion_coste_impresion
- clasificación: NO_MIGRAR_TAL_CUAL
- explicación simple: La salida no tiene explicación trazable suficiente para migrarse automáticamente.
- qué falta justificar: No aparece coste de impresión/clic explícito o no está etiquetado.
- recomendación técnica: REQUIERE_REVISION_MANUAL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XL 32x70 W22: ¿este precio debe incluir costo de impresión/clic explícito (sí/no) o se mantiene por regla histórica?

### DEC-013 - XL 32x70 SB04 W22
- id_decision: DEC-013
- prioridad: 1
- familia: XL 32x70
- bloque: SB04
- celda: W22
- valor actual: =W14-W4
- fórmula actual: `=W14-W4`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XL 32x70 W22: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

### DEC-007 - XL 32x70 SB04 X22
- id_decision: DEC-007
- prioridad: 1
- familia: XL 32x70
- bloque: SB04
- celda: X22
- valor actual: =X14-X4
- fórmula actual: `=X14-X4`
- problema detectado: salida_sin_explicacion_coste_impresion
- clasificación: NO_MIGRAR_TAL_CUAL
- explicación simple: La salida no tiene explicación trazable suficiente para migrarse automáticamente.
- qué falta justificar: No aparece coste de impresión/clic explícito o no está etiquetado.
- recomendación técnica: REQUIERE_REVISION_MANUAL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XL 32x70 X22: ¿este precio debe incluir costo de impresión/clic explícito (sí/no) o se mantiene por regla histórica?

### DEC-019 - XL 32x70 SB04 X22
- id_decision: DEC-019
- prioridad: 1
- familia: XL 32x70
- bloque: SB04
- celda: X22
- valor actual: =X14-X4
- fórmula actual: `=X14-X4`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XL 32x70 X22: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

### DEC-002 - XL 32x70 SB04 W23
- id_decision: DEC-002
- prioridad: 1
- familia: XL 32x70
- bloque: SB04
- celda: W23
- valor actual: =W15-W5
- fórmula actual: `=W15-W5`
- problema detectado: salida_sin_explicacion_coste_impresion
- clasificación: NO_MIGRAR_TAL_CUAL
- explicación simple: La salida no tiene explicación trazable suficiente para migrarse automáticamente.
- qué falta justificar: No aparece coste de impresión/clic explícito o no está etiquetado.
- recomendación técnica: REQUIERE_REVISION_MANUAL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XL 32x70 W23: ¿este precio debe incluir costo de impresión/clic explícito (sí/no) o se mantiene por regla histórica?

### DEC-014 - XL 32x70 SB04 W23
- id_decision: DEC-014
- prioridad: 1
- familia: XL 32x70
- bloque: SB04
- celda: W23
- valor actual: =W15-W5
- fórmula actual: `=W15-W5`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XL 32x70 W23: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

### DEC-008 - XL 32x70 SB04 X23
- id_decision: DEC-008
- prioridad: 1
- familia: XL 32x70
- bloque: SB04
- celda: X23
- valor actual: =X15-X5
- fórmula actual: `=X15-X5`
- problema detectado: salida_sin_explicacion_coste_impresion
- clasificación: NO_MIGRAR_TAL_CUAL
- explicación simple: La salida no tiene explicación trazable suficiente para migrarse automáticamente.
- qué falta justificar: No aparece coste de impresión/clic explícito o no está etiquetado.
- recomendación técnica: REQUIERE_REVISION_MANUAL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XL 32x70 X23: ¿este precio debe incluir costo de impresión/clic explícito (sí/no) o se mantiene por regla histórica?

### DEC-020 - XL 32x70 SB04 X23
- id_decision: DEC-020
- prioridad: 1
- familia: XL 32x70
- bloque: SB04
- celda: X23
- valor actual: =X15-X5
- fórmula actual: `=X15-X5`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XL 32x70 X23: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

### DEC-003 - XL 32x70 SB04 W24
- id_decision: DEC-003
- prioridad: 1
- familia: XL 32x70
- bloque: SB04
- celda: W24
- valor actual: =W16-W6
- fórmula actual: `=W16-W6`
- problema detectado: salida_sin_explicacion_coste_impresion
- clasificación: NO_MIGRAR_TAL_CUAL
- explicación simple: La salida no tiene explicación trazable suficiente para migrarse automáticamente.
- qué falta justificar: No aparece coste de impresión/clic explícito o no está etiquetado.
- recomendación técnica: REQUIERE_REVISION_MANUAL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XL 32x70 W24: ¿este precio debe incluir costo de impresión/clic explícito (sí/no) o se mantiene por regla histórica?

### DEC-015 - XL 32x70 SB04 W24
- id_decision: DEC-015
- prioridad: 1
- familia: XL 32x70
- bloque: SB04
- celda: W24
- valor actual: =W16-W6
- fórmula actual: `=W16-W6`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XL 32x70 W24: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

### DEC-009 - XL 32x70 SB04 X24
- id_decision: DEC-009
- prioridad: 1
- familia: XL 32x70
- bloque: SB04
- celda: X24
- valor actual: =X16-X6
- fórmula actual: `=X16-X6`
- problema detectado: salida_sin_explicacion_coste_impresion
- clasificación: NO_MIGRAR_TAL_CUAL
- explicación simple: La salida no tiene explicación trazable suficiente para migrarse automáticamente.
- qué falta justificar: No aparece coste de impresión/clic explícito o no está etiquetado.
- recomendación técnica: REQUIERE_REVISION_MANUAL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XL 32x70 X24: ¿este precio debe incluir costo de impresión/clic explícito (sí/no) o se mantiene por regla histórica?

### DEC-021 - XL 32x70 SB04 X24
- id_decision: DEC-021
- prioridad: 1
- familia: XL 32x70
- bloque: SB04
- celda: X24
- valor actual: =X16-X6
- fórmula actual: `=X16-X6`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XL 32x70 X24: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

### DEC-004 - XL 32x70 SB04 W25
- id_decision: DEC-004
- prioridad: 1
- familia: XL 32x70
- bloque: SB04
- celda: W25
- valor actual: =W17-W7
- fórmula actual: `=W17-W7`
- problema detectado: salida_sin_explicacion_coste_impresion
- clasificación: NO_MIGRAR_TAL_CUAL
- explicación simple: La salida no tiene explicación trazable suficiente para migrarse automáticamente.
- qué falta justificar: No aparece coste de impresión/clic explícito o no está etiquetado.
- recomendación técnica: REQUIERE_REVISION_MANUAL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XL 32x70 W25: ¿este precio debe incluir costo de impresión/clic explícito (sí/no) o se mantiene por regla histórica?

### DEC-016 - XL 32x70 SB04 W25
- id_decision: DEC-016
- prioridad: 1
- familia: XL 32x70
- bloque: SB04
- celda: W25
- valor actual: =W17-W7
- fórmula actual: `=W17-W7`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XL 32x70 W25: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

### DEC-010 - XL 32x70 SB04 X25
- id_decision: DEC-010
- prioridad: 1
- familia: XL 32x70
- bloque: SB04
- celda: X25
- valor actual: =X17-X7
- fórmula actual: `=X17-X7`
- problema detectado: salida_sin_explicacion_coste_impresion
- clasificación: NO_MIGRAR_TAL_CUAL
- explicación simple: La salida no tiene explicación trazable suficiente para migrarse automáticamente.
- qué falta justificar: No aparece coste de impresión/clic explícito o no está etiquetado.
- recomendación técnica: REQUIERE_REVISION_MANUAL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XL 32x70 X25: ¿este precio debe incluir costo de impresión/clic explícito (sí/no) o se mantiene por regla histórica?

### DEC-022 - XL 32x70 SB04 X25
- id_decision: DEC-022
- prioridad: 1
- familia: XL 32x70
- bloque: SB04
- celda: X25
- valor actual: =X17-X7
- fórmula actual: `=X17-X7`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XL 32x70 X25: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

### DEC-005 - XL 32x70 SB04 W26
- id_decision: DEC-005
- prioridad: 1
- familia: XL 32x70
- bloque: SB04
- celda: W26
- valor actual: =W18-W8
- fórmula actual: `=W18-W8`
- problema detectado: salida_sin_explicacion_coste_impresion
- clasificación: NO_MIGRAR_TAL_CUAL
- explicación simple: La salida no tiene explicación trazable suficiente para migrarse automáticamente.
- qué falta justificar: No aparece coste de impresión/clic explícito o no está etiquetado.
- recomendación técnica: REQUIERE_REVISION_MANUAL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XL 32x70 W26: ¿este precio debe incluir costo de impresión/clic explícito (sí/no) o se mantiene por regla histórica?

### DEC-017 - XL 32x70 SB04 W26
- id_decision: DEC-017
- prioridad: 1
- familia: XL 32x70
- bloque: SB04
- celda: W26
- valor actual: =W18-W8
- fórmula actual: `=W18-W8`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XL 32x70 W26: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

### DEC-011 - XL 32x70 SB04 X26
- id_decision: DEC-011
- prioridad: 1
- familia: XL 32x70
- bloque: SB04
- celda: X26
- valor actual: =X18-X8
- fórmula actual: `=X18-X8`
- problema detectado: salida_sin_explicacion_coste_impresion
- clasificación: NO_MIGRAR_TAL_CUAL
- explicación simple: La salida no tiene explicación trazable suficiente para migrarse automáticamente.
- qué falta justificar: No aparece coste de impresión/clic explícito o no está etiquetado.
- recomendación técnica: REQUIERE_REVISION_MANUAL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XL 32x70 X26: ¿este precio debe incluir costo de impresión/clic explícito (sí/no) o se mantiene por regla histórica?

### DEC-023 - XL 32x70 SB04 X26
- id_decision: DEC-023
- prioridad: 1
- familia: XL 32x70
- bloque: SB04
- celda: X26
- valor actual: =X18-X8
- fórmula actual: `=X18-X8`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XL 32x70 X26: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

### DEC-006 - XL 32x70 SB04 W27
- id_decision: DEC-006
- prioridad: 1
- familia: XL 32x70
- bloque: SB04
- celda: W27
- valor actual: =W19-W9
- fórmula actual: `=W19-W9`
- problema detectado: salida_sin_explicacion_coste_impresion
- clasificación: NO_MIGRAR_TAL_CUAL
- explicación simple: La salida no tiene explicación trazable suficiente para migrarse automáticamente.
- qué falta justificar: No aparece coste de impresión/clic explícito o no está etiquetado.
- recomendación técnica: REQUIERE_REVISION_MANUAL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XL 32x70 W27: ¿este precio debe incluir costo de impresión/clic explícito (sí/no) o se mantiene por regla histórica?

### DEC-018 - XL 32x70 SB04 W27
- id_decision: DEC-018
- prioridad: 1
- familia: XL 32x70
- bloque: SB04
- celda: W27
- valor actual: =W19-W9
- fórmula actual: `=W19-W9`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XL 32x70 W27: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

### DEC-012 - XL 32x70 SB04 X27
- id_decision: DEC-012
- prioridad: 1
- familia: XL 32x70
- bloque: SB04
- celda: X27
- valor actual: =X19-X9
- fórmula actual: `=X19-X9`
- problema detectado: salida_sin_explicacion_coste_impresion
- clasificación: NO_MIGRAR_TAL_CUAL
- explicación simple: La salida no tiene explicación trazable suficiente para migrarse automáticamente.
- qué falta justificar: No aparece coste de impresión/clic explícito o no está etiquetado.
- recomendación técnica: REQUIERE_REVISION_MANUAL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XL 32x70 X27: ¿este precio debe incluir costo de impresión/clic explícito (sí/no) o se mantiene por regla histórica?

### DEC-024 - XL 32x70 SB04 X27
- id_decision: DEC-024
- prioridad: 1
- familia: XL 32x70
- bloque: SB04
- celda: X27
- valor actual: =X19-X9
- fórmula actual: `=X19-X9`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XL 32x70 X27: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

## Prioridad 2: A3 PLUS pack color / SB07

- Qué está en riesgo: Riesgo medio-alto: faltan componentes explícitos de papel en varias salidas.
- Qué decisión conviene tomar: Preferir RECALCULAR_DESDE_COSTO_PAPEL cuando no haya trazabilidad suficiente.
- Qué pasa si se migra tal cual: Migrar sin resolver puede dejar reglas implícitas no reproducibles.
- Casos en esta prioridad: `11`

### DEC-034 - A3 PLUS pack color SB07 AM45
- id_decision: DEC-034
- prioridad: 2
- familia: A3 PLUS pack color
- bloque: SB07
- celda: AM45
- valor actual: =AK45*AM38
- fórmula actual: `=AK45*AM38`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para A3 PLUS pack color AM45: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

### DEC-025 - A3 PLUS pack color SB07 AB48
- id_decision: DEC-025
- prioridad: 2
- familia: A3 PLUS pack color
- bloque: SB07
- celda: AB48
- valor actual: =AM43*$AF$48
- fórmula actual: `=AM43*$AF$48`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para A3 PLUS pack color AB48: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

### DEC-027 - A3 PLUS pack color SB07 AC48
- id_decision: DEC-027
- prioridad: 2
- familia: A3 PLUS pack color
- bloque: SB07
- celda: AC48
- valor actual: =AF48*$AM$42
- fórmula actual: `=AF48*$AM$42`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para A3 PLUS pack color AC48: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

### DEC-029 - A3 PLUS pack color SB07 AD48
- id_decision: DEC-029
- prioridad: 2
- familia: A3 PLUS pack color
- bloque: SB07
- celda: AD48
- valor actual: =AF48*$AM$40
- fórmula actual: `=AF48*$AM$40`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para A3 PLUS pack color AD48: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

### DEC-031 - A3 PLUS pack color SB07 AE48
- id_decision: DEC-031
- prioridad: 2
- familia: A3 PLUS pack color
- bloque: SB07
- celda: AE48
- valor actual: =AF48*$AM$41
- fórmula actual: `=AF48*$AM$41`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para A3 PLUS pack color AE48: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

### DEC-026 - A3 PLUS pack color SB07 AB49
- id_decision: DEC-026
- prioridad: 2
- familia: A3 PLUS pack color
- bloque: SB07
- celda: AB49
- valor actual: =AM43*$AF$49
- fórmula actual: `=AM43*$AF$49`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para A3 PLUS pack color AB49: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

### DEC-028 - A3 PLUS pack color SB07 AC49
- id_decision: DEC-028
- prioridad: 2
- familia: A3 PLUS pack color
- bloque: SB07
- celda: AC49
- valor actual: =AF49*$AM$42
- fórmula actual: `=AF49*$AM$42`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para A3 PLUS pack color AC49: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

### DEC-030 - A3 PLUS pack color SB07 AD49
- id_decision: DEC-030
- prioridad: 2
- familia: A3 PLUS pack color
- bloque: SB07
- celda: AD49
- valor actual: =AF49*$AM$40
- fórmula actual: `=AF49*$AM$40`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para A3 PLUS pack color AD49: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

### DEC-032 - A3 PLUS pack color SB07 AE49
- id_decision: DEC-032
- prioridad: 2
- familia: A3 PLUS pack color
- bloque: SB07
- celda: AE49
- valor actual: =AF49*$AM$41
- fórmula actual: `=AF49*$AM$41`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para A3 PLUS pack color AE49: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

### DEC-033 - A3 PLUS pack color SB07 AI49
- id_decision: DEC-033
- prioridad: 2
- familia: A3 PLUS pack color
- bloque: SB07
- celda: AI49
- valor actual: =(AF49+AG49)-1
- fórmula actual: `=(AF49+AG49)-1`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para A3 PLUS pack color AI49: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

### DEC-035 - A3 PLUS pack color SB07 AO49
- id_decision: DEC-035
- prioridad: 2
- familia: A3 PLUS pack color
- bloque: SB07
- celda: AO49
- valor actual: =AF48+AG48
- fórmula actual: `=AF48+AG48`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para A3 PLUS pack color AO49: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

## Prioridad 3: XA3 ByN / SB08

- Qué está en riesgo: Riesgo medio-alto: salidas ByN con costo de papel no explícito en múltiples casos.
- Qué decisión conviene tomar: Tomar decisión por celda: conservar solo si hay justificación funcional verificable.
- Qué pasa si se migra tal cual: Se puede consolidar una lógica incompleta y distorsionar precios objetivo.
- Casos en esta prioridad: `13`

### DEC-036 - XA3 ByN SB08 AA54
- id_decision: DEC-036
- prioridad: 3
- familia: XA3 ByN
- bloque: SB08
- celda: AA54
- valor actual: =$AM$45
- fórmula actual: `=$AM$45`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XA3 ByN AA54: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

### DEC-038 - XA3 ByN SB08 AB54
- id_decision: DEC-038
- prioridad: 3
- familia: XA3 ByN
- bloque: SB08
- celda: AB54
- valor actual: =AM43*$AF$54
- fórmula actual: `=AM43*$AF$54`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XA3 ByN AB54: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

### DEC-040 - XA3 ByN SB08 AC54
- id_decision: DEC-040
- prioridad: 3
- familia: XA3 ByN
- bloque: SB08
- celda: AC54
- valor actual: =AF54*$AM$42
- fórmula actual: `=AF54*$AM$42`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XA3 ByN AC54: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

### DEC-043 - XA3 ByN SB08 AD54
- id_decision: DEC-043
- prioridad: 3
- familia: XA3 ByN
- bloque: SB08
- celda: AD54
- valor actual: =AF54*$AM$40
- fórmula actual: `=AF54*$AM$40`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XA3 ByN AD54: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

### DEC-046 - XA3 ByN SB08 AE54
- id_decision: DEC-046
- prioridad: 3
- familia: XA3 ByN
- bloque: SB08
- celda: AE54
- valor actual: =AF54*$AM$41
- fórmula actual: `=AF54*$AM$41`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XA3 ByN AE54: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

### DEC-037 - XA3 ByN SB08 AA55
- id_decision: DEC-037
- prioridad: 3
- familia: XA3 ByN
- bloque: SB08
- celda: AA55
- valor actual: =$AM$45
- fórmula actual: `=$AM$45`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XA3 ByN AA55: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

### DEC-039 - XA3 ByN SB08 AB55
- id_decision: DEC-039
- prioridad: 3
- familia: XA3 ByN
- bloque: SB08
- celda: AB55
- valor actual: =AM43*$AF$55
- fórmula actual: `=AM43*$AF$55`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XA3 ByN AB55: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

### DEC-041 - XA3 ByN SB08 AC55
- id_decision: DEC-041
- prioridad: 3
- familia: XA3 ByN
- bloque: SB08
- celda: AC55
- valor actual: =AF55*$AM$42
- fórmula actual: `=AF55*$AM$42`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XA3 ByN AC55: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

### DEC-044 - XA3 ByN SB08 AD55
- id_decision: DEC-044
- prioridad: 3
- familia: XA3 ByN
- bloque: SB08
- celda: AD55
- valor actual: =AF55*$AM$40
- fórmula actual: `=AF55*$AM$40`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XA3 ByN AD55: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

### DEC-047 - XA3 ByN SB08 AE55
- id_decision: DEC-047
- prioridad: 3
- familia: XA3 ByN
- bloque: SB08
- celda: AE55
- valor actual: =AF55*$AM$41
- fórmula actual: `=AF55*$AM$41`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XA3 ByN AE55: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

### DEC-042 - XA3 ByN SB08 AC58
- id_decision: DEC-042
- prioridad: 3
- familia: XA3 ByN
- bloque: SB08
- celda: AC58
- valor actual: =$AM$45*AF58
- fórmula actual: `=$AM$45*AF58`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XA3 ByN AC58: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

### DEC-045 - XA3 ByN SB08 AD58
- id_decision: DEC-045
- prioridad: 3
- familia: XA3 ByN
- bloque: SB08
- celda: AD58
- valor actual: =AC58*$AM$40
- fórmula actual: `=AC58*$AM$40`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XA3 ByN AD58: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

### DEC-048 - XA3 ByN SB08 AE58
- id_decision: DEC-048
- prioridad: 3
- familia: XA3 ByN
- bloque: SB08
- celda: AE58
- valor actual: =AC58*$AM$41
- fórmula actual: `=AC58*$AM$41`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XA3 ByN AE58: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

## Prioridad 4: XL ByN / SB09

- Qué está en riesgo: Riesgo medio: menor volumen, pero con alertas de papel no explicadas.
- Qué decisión conviene tomar: Resolver una por una; si no hay contexto, marcar REQUIERE_REVISION_MANUAL.
- Qué pasa si se migra tal cual: Quedan excepciones opacas que complican auditoría futura.
- Casos en esta prioridad: `7`

### DEC-049 - XL ByN SB09 AC63
- id_decision: DEC-049
- prioridad: 4
- familia: XL ByN
- bloque: SB09
- celda: AC63
- valor actual: =$AM$45*AF63
- fórmula actual: `=$AM$45*AF63`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XL ByN AC63: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

### DEC-050 - XL ByN SB09 X63
- id_decision: DEC-050
- prioridad: 4
- familia: XL ByN
- bloque: SB09
- celda: X63
- valor actual: =W63*W62
- fórmula actual: `=W63*W62`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XL ByN X63: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

### DEC-051 - XL ByN SB09 X64
- id_decision: DEC-051
- prioridad: 4
- familia: XL ByN
- bloque: SB09
- celda: X64
- valor actual: =W64*W62
- fórmula actual: `=W64*W62`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XL ByN X64: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

### DEC-052 - XL ByN SB09 X65
- id_decision: DEC-052
- prioridad: 4
- familia: XL ByN
- bloque: SB09
- celda: X65
- valor actual: =W65*W62
- fórmula actual: `=W65*W62`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XL ByN X65: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

### DEC-053 - XL ByN SB09 X66
- id_decision: DEC-053
- prioridad: 4
- familia: XL ByN
- bloque: SB09
- celda: X66
- valor actual: =W66*W62
- fórmula actual: `=W66*W62`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XL ByN X66: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

### DEC-054 - XL ByN SB09 X67
- id_decision: DEC-054
- prioridad: 4
- familia: XL ByN
- bloque: SB09
- celda: X67
- valor actual: =W67*W62
- fórmula actual: `=W67*W62`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XL ByN X67: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?

### DEC-055 - XL ByN SB09 X68
- id_decision: DEC-055
- prioridad: 4
- familia: XL ByN
- bloque: SB09
- celda: X68
- valor actual: =W68*W62
- fórmula actual: `=W68*W62`
- problema detectado: salida_sin_explicacion_coste_papel
- clasificación: ERROR_REAL_PROBABLE
- explicación simple: La salida no muestra de forma clara el componente de coste de papel.
- qué falta justificar: No aparece coste de papel explícito/trazable en la salida.
- recomendación técnica: RECALCULAR_DESDE_COSTO_PAPEL
- opciones de decisión: CONSERVAR_PRECIO_EXCEL, RECALCULAR_DESDE_COSTO_PAPEL, RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION, CREAR_REGLA_NUEVA, DESCARTAR_COMO_OBSOLETO, REQUIERE_REVISION_MANUAL
- pregunta concreta para el usuario: Para XL ByN X68: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?