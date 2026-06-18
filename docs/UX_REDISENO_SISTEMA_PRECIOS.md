# Rediseño UX del sistema de precios

## 1. Diagnóstico UX actual

El cotizador ya resolvió una parte técnica muy importante: cotiza múltiples productos, conserva trazabilidad, diferencia precios fijos PDF de variables operativas, permite administrar variables seguras y exporta soporte Excel.

El problema actual no es de capacidad, sino de comprensión. La interfaz todavía refleja demasiado la arquitectura interna:

- módulos técnicos separados
- nombres pensados para desarrollo
- conceptos de trazabilidad visibles demasiado pronto
- muchas pantallas que responden a "cómo está construido" y no a "qué quiere hacer el usuario"

Para una persona operativa o comercial, la pregunta no es "qué módulo tengo que abrir", sino:

- quiero cotizar
- quiero modificar un precio
- quiero entender por qué salió este total
- quiero saber qué pasa si cambio una variable
- quiero volver atrás si algo salió mal
- quiero exportar información para revisar o compartir

El rediseño recomendado debe ordenar el sistema alrededor de esas intenciones.

## 2. Problemas de comprensión detectados

### No queda claro dónde modificar precios

Hoy conviven términos como `Variables principales`, `Administrador de precios`, `Configuración` y `Excel maestro`. Aunque la regla técnica ya está definida, visualmente todavía puede parecer que hay varias puertas equivalentes para tocar precios.

Riesgo: que el usuario intente editar desde una pantalla técnica o interprete el Excel maestro como fuente de escritura.

### No queda claro dónde entender un precio

El sistema tiene `Árbol del precio` y `Trazabilidad visual`, pero ambos nombres pueden sonar técnicos. El usuario comercial necesita primero una explicación simple:

- material
- impresión
- cantidad/rango
- adicionales
- urgencia
- total

El grafo y el árbol deberían quedar como detalle avanzado, no como primera respuesta.

### No queda claro qué se puede tocar y qué no

Hay conceptos que para desarrollo son correctos, pero para operación generan ruido:

- variable madre
- impacta_hoy
- matriz PDF
- factor de ajuste
- fórmula calibrada
- tabla fija
- derivado

Estos conceptos deben existir, pero en modo avanzado o en documentación técnica. En la operación diaria conviene traducirlos.

### La navegación creció por acumulación

La barra actual combina tareas reales con módulos auxiliares:

- Cotizador
- Árbol del precio
- Trazabilidad visual
- Impacto de variables
- Variables principales
- Administrador de precios
- Configuración
- Historial
- Precios
- Ajustes

Esto genera sensación de tablero técnico. El sistema necesita una arquitectura de información por objetivos.

## 3. Principio de rediseño

El sistema debe organizarse por intención del usuario, no por implementación técnica.

Principio rector:

> Una pantalla principal debe responder una pregunta operativa clara.

Ejemplos:

- `Cotizar`: ¿cuánto sale este trabajo?
- `Modificar precios`: ¿qué valor operativo quiero cambiar y qué impacto tendrá?
- `Entender un precio`: ¿de dónde salió este total?
- `Ver impacto de cambios`: ¿qué productos se afectan si cambio esta variable?
- `Historial y backups`: ¿qué se cambió, cuándo y cómo puedo volver atrás?
- `Exportar soporte Excel`: ¿cómo genero un archivo de revisión o auditoría?
- `Configuración avanzada`: ¿dónde quedan las herramientas técnicas?

## 4. Nueva navegación recomendada

Menú principal recomendado:

1. Cotizar
2. Modificar precios
3. Entender un precio
4. Ver impacto de cambios
5. Historial y backups
6. Exportar soporte Excel
7. Configuración avanzada

### 1. Cotizar

Pantalla principal de trabajo diario. Debe ser la entrada por defecto.

Incluye:

- selector de producto
- campos necesarios según producto
- adicionales válidos
- resultado final
- botón copiar
- acceso rápido a "Entender este precio"

### 2. Modificar precios

Reemplaza como entrada operativa al actual `Administrador de precios`.

Incluye:

- wizard guiado
- variables editables reales
- preview obligatorio
- confirmación
- backup
- historial del cambio

No debe mostrar desde el inicio todos los detalles técnicos.

### 3. Entender un precio

Fusiona conceptualmente:

- `Árbol del precio`
- `Trazabilidad visual`

La primera vista debe ser simple. El grafo y el árbol técnico aparecen bajo "Ver detalle avanzado".

### 4. Ver impacto de cambios

Equivale al actual `Impacto de variables`, pero con lenguaje menos técnico.

Debe responder:

- qué productos dependen de este valor
- qué ejemplos cambian
- qué precios finales están protegidos por PDF
- qué cambios son directos y cuáles son preparados para futuro

### 5. Historial y backups

Agrupa:

- historial de cambios de precios
- backups generados
- restauraciones disponibles
- quién/cuándo/qué cambió

Debe ser entendible como bitácora operativa, no como lista de archivos.

### 6. Exportar soporte Excel

Equivale al Excel maestro exportable.

Mensaje principal:

> El Excel maestro es soporte de revisión, auditoría y documentación. No es la fuente operativa para modificar precios.

### 7. Configuración avanzada

Contiene vistas técnicas o de mantenimiento:

- Variables principales
- Configuración
- Importador preview
- diagnósticos técnicos
- vistas JSON/config si existen

Debe estar separada del uso diario.

## 5. Mapa de pantallas actuales a pantallas nuevas

| Pantalla actual | Pantalla nueva recomendada | Tratamiento |
| --- | --- | --- |
| Cotizador | Cotizar | Mantener como pantalla principal, simplificar accesos secundarios. |
| Administrador de precios | Modificar precios | Renombrar y convertir en wizard guiado. |
| Árbol del precio | Entender un precio | Integrar como detalle avanzado. |
| Trazabilidad visual | Entender un precio | Integrar como detalle avanzado visual. |
| Impacto de variables | Ver impacto de cambios | Renombrar y simplificar lenguaje. |
| Variables principales | Configuración avanzada / Modificar precios | Vista técnica; no debe ser la puerta operativa principal. |
| Excel maestro exportable | Exportar soporte Excel | Mantener como exportación y auditoría. |
| Importador preview | Configuración avanzada | Mantener fuera del flujo diario. |
| Historial | Historial y backups | Fusionar con backups y cambios de precios. |
| Backups | Historial y backups | Mostrar como restauraciones disponibles. |
| Configuración | Configuración avanzada | Mantener para usuarios técnicos. |
| Precios | Modificar precios / Configuración avanzada | Evitar duplicación; si es técnico, mover a avanzada. |
| Ajustes | Configuración avanzada | Mantener separado de operación diaria. |

## 6. Flujo recomendado para modificar precios

El flujo debe ser guiado, progresivo y seguro. No conviene mostrar todos los campos a la vez.

### Paso 1: Elegir qué quiero modificar

Mostrar tarjetas o lista simple:

- Dólar
- Click color
- Papel obra 90g
- Multiplicador general
- Tinta blanca autoadhesiva

Evitar mostrar claves técnicas como primera capa. La clave interna puede aparecer en detalle avanzado.

### Paso 2: Ver valor actual

Mostrar:

- valor actual
- unidad
- última modificación
- fuente del valor
- estado: operativo

Mensaje claro:

> Este valor impacta hoy en el cotizador.

### Paso 3: Ver productos afectados

Antes de ingresar el nuevo valor, mostrar qué productos podrían cambiar.

Ejemplo:

- Stickers Circulares
- Bajadas Autoadhesivas
- fórmulas calibradas conectadas

Usar lenguaje humano:

- "Afecta el cálculo base"
- "El precio final puede estar protegido por tabla PDF"
- "Se usa como recargo proporcional"

### Paso 4: Ingresar nuevo valor

Mostrar:

- valor actual
- campo nuevo valor
- diferencia automática
- advertencias si el cambio es grande

### Paso 5: Previsualizar impacto

El preview debe ser obligatorio.

Debe mostrar:

- valor actual
- valor nuevo
- diferencia absoluta
- diferencia porcentual
- ejemplos afectados
- advertencias
- precios que no se modificarán por estar fijos por PDF

### Paso 6: Confirmar y guardar

El botón de guardar solo debe habilitarse si el preview corresponde al valor ingresado.

Antes de guardar:

- modal de confirmación
- resumen del cambio
- aviso de backup automático

### Paso 7: Ver backup/historial

Después de guardar:

- mostrar mensaje de éxito
- mostrar backup creado
- agregar entrada al historial
- ofrecer acción: "Ver historial de cambios"

## 7. Flujo recomendado para entender un precio

El objetivo es responder rápido "por qué dio este total", sin obligar al usuario a leer un grafo técnico.

### Paso 1: Elegir cotización

Opciones:

- Usar última cotización
- Buscar una cotización guardada
- Elegir un caso de ejemplo

### Paso 2: Ver resumen simple

Mostrar una tarjeta:

```text
Total final: $38.584
Producto: Bajadas Fullcolor
Cantidad: 53
Formato: A3+
Impresión: 4/0
```

### Paso 3: Ver componentes principales

Mostrar como desglose simple:

- Material: Ilustración 150g
- Impresión: Fullcolor 4/0
- Rango aplicado: 51 a 100
- Precio base: $622 por unidad
- Adicional: Laca UV, 1 cara, $106 por unidad
- Cantidad: 53
- Total adicional: $5.618
- Total final: $38.584

### Paso 4: Ver detalle avanzado

Botón:

```text
Ver detalle avanzado
```

Abre:

- grafo visual
- árbol técnico
- variables usadas
- fuente PDF
- fórmula o matriz aplicada

## 8. Flujo recomendado para ver impacto

Esta pantalla debe responder "si cambio esto, qué pasa".

### Paso 1: Elegir valor a analizar

Mostrar nombres entendibles:

- Click color
- Papel obra 90g
- Tinta blanca autoadhesiva
- Multiplicador general
- Dólar

### Paso 2: Ver productos conectados

Separar por estado:

- Impacta hoy
- Preparado para futuro
- Solo referencia histórica

### Paso 3: Simular cambio

Permitir ingresar un valor hipotético sin guardar.

Mostrar:

- ejemplos de precios antes/después
- diferencia
- productos afectados
- advertencias

### Paso 4: Ir a modificar precios

Si el usuario decide avanzar:

```text
Usar este valor en Modificar precios
```

Esto abre el wizard con el valor precargado, pero todavía exige preview y confirmación.

## 9. Flujo recomendado para historial y rollback

La pantalla `Historial y backups` debe funcionar como bitácora.

### Vista principal

Columnas sugeridas:

- Fecha
- Usuario / origen
- Valor modificado
- Antes
- Después
- Productos afectados
- Backup
- Estado

### Detalle de cambio

Al abrir un cambio:

- resumen
- preview usado
- backup asociado
- archivo/config afectado
- botón "Comparar"
- botón "Restaurar" solo si el flujo de rollback está implementado y validado

### Rollback

Restauración implementada para variables editables:

1. elegir cambio
2. ver backup
3. previsualizar restauración
4. confirmar
5. guardar nuevo historial de rollback

Nunca restaurar silenciosamente.

La vista principal muestra un badge `Cambio` o `Rollback`. Los eventos `Rollback` son informativos y no se restauran directamente. El botón `Restaurar este cambio` queda deshabilitado hasta que exista un preview válido; al confirmar se crea un backup nuevo y se registra el rollback.

## 10. Qué información va en modo simple

Modo simple es para operación diaria.

Debe mostrar:

- valor actual
- nuevo valor
- diferencia
- productos afectados
- advertencias simples
- total final
- desglose principal
- fuente resumida
- botón previsualizar
- botón guardar
- backup creado

Lenguaje recomendado:

- "Afecta hoy"
- "No modifica precios finales fijos"
- "Se guardará con backup"
- "Este Excel es solo soporte"

## 11. Qué información va en modo avanzado

Modo avanzado es para auditoría, soporte técnico y depuración.

Puede mostrar:

- variable madre
- clave interna
- impacta_hoy
- factor de ajuste PDF
- matriz PDF
- tabla fija
- fórmula editable calibrada
- fuente exacta de config
- grafo técnico
- árbol técnico
- JSON de trazabilidad
- endpoints
- archivos de backend

Regla UX:

> El modo avanzado no debe desaparecer, pero no debe ser la primera capa de lectura.

## 12. Nombres actuales vs nombres recomendados

| Nombre actual | Nombre recomendado | Motivo |
| --- | --- | --- |
| Cotizador | Cotizar | Acción directa y cotidiana. |
| Administrador de precios | Modificar precios | Más claro para uso operativo. |
| Variables principales | Costos base | Traduce el concepto técnico a lenguaje comercial. |
| Trazabilidad visual | De dónde sale este precio | Responde una pregunta humana. |
| Árbol del precio | Detalle del cálculo | Más simple y menos abstracto. |
| Impacto de variables | Qué afecta este cambio | Orientado a decisión. |
| Excel maestro | Exportar soporte Excel | Deja claro que es salida, no fuente operativa. |
| Configuración | Configuración avanzada | Reduce riesgo de tocar algo por error. |
| Matriz PDF | Tabla fija validada | Más entendible y menos técnico. |
| impacta_hoy | Afecta precios actuales | Traducción operativa. |
| Fórmula editable calibrada | Fórmula conectada con ajuste PDF | Más explicativo para auditoría. |
| Factor de ajuste PDF | Ajuste para coincidir con PDF | Más claro para no técnicos. |
| Variable madre | Costo base | Más comercial. |

## 13. Wireframes textuales

### Pantalla: Cotizar

```text
[Header]
Cotizar
Calculá precios actuales validados contra PDF.

[Panel principal]
Producto
Formato
Material
Cantidad
Adicionales
Urgencia

[Acciones]
Calcular | Copiar precio | Limpiar

[Resultado]
Total final
Resumen de componentes

[Accesos]
Entender este precio
Ver detalle avanzado
```

### Pantalla: Modificar precios

```text
[Header]
Modificar precios
Cambiá solo costos operativos conectados. El sistema genera preview, backup e historial.

[Stepper]
1 Elegir precio -> 2 Ver impacto -> 3 Previsualizar -> 4 Confirmar

[Paso 1]
Lista de costos editables:
- Dólar
- Click color
- Papel obra 90g
- Multiplicador general
- Tinta blanca autoadhesiva

[Paso 2]
Valor actual
Productos afectados
Advertencias

[Paso 3]
Nuevo valor
Diferencia
Previsualizar impacto

[Paso 4]
Resumen final
Backup automático
Confirmar y guardar
```

### Pantalla: Entender un precio

```text
[Header]
De dónde sale este precio

[Selector]
Usar última cotización | Buscar cotización | Caso de ejemplo

[Resumen]
Total final
Producto
Cantidad

[Componentes]
Material
Impresión
Rango
Adicionales
Urgencia

[Acciones]
Ver grafo avanzado
Ver árbol técnico
Ver fuente PDF/fórmula
```

### Pantalla: Ver impacto de cambios

```text
[Header]
Qué afecta este cambio

[Selector]
Elegí un costo base

[Resumen]
Impacta hoy / preparado para futuro / referencia histórica

[Simulación]
Valor actual
Valor hipotético
Diferencia

[Ejemplos]
Producto | Antes | Después | Diferencia | Estado

[Acción]
Usar este valor en Modificar precios
```

### Pantalla: Historial y backups

```text
[Header]
Historial y backups

[Filtros]
Fecha | Variable | Producto afectado | Tipo de cambio

[Tabla]
Fecha
Cambio
Antes
Después
Backup
Estado

[Detalle]
Resumen del cambio
Preview usado
Archivo respaldado
Acciones disponibles
```

### Pantalla: Exportar soporte Excel

```text
[Header]
Exportar soporte Excel

[Aviso]
El Excel maestro es soporte de auditoría y revisión. No modifica precios del sistema.

[Contenido]
Variables
Tablas finales
Trazabilidad
Bloqueados

[Acción]
Generar Excel maestro
Descargar último Excel
```

### Pantalla: Configuración avanzada

```text
[Header]
Configuración avanzada

[Aviso]
Sección técnica. Usar solo para auditoría, soporte o mantenimiento.

[Opciones]
Variables principales técnicas
Importador preview
Diagnósticos
Configuración interna
```

## 14. Implementación recomendada por etapas

### Etapa 1: Renombrado y agrupación de navegación

Objetivo: reducir confusión sin reescribir flujos.

Cambios:

- renombrar tabs principales
- ocultar vistas técnicas bajo `Configuración avanzada`
- agregar texto explicativo corto por pantalla
- mantener rutas/componentes actuales internamente

Riesgo bajo.

### Etapa 2: Modificar precios como wizard

Objetivo: transformar el administrador actual en flujo paso a paso.

Cambios:

- dividir en pasos
- mostrar una sola decisión por vez
- bloquear guardado hasta preview
- mostrar historial posterior al guardado

Riesgo medio, porque toca UX operativa de edición.

Estado implementado:

- `Modificar precios` muestra un stepper de seis pasos: elegir variable, revisar impacto, nuevo valor, previsualizar, confirmar e historial.
- El guardado queda deshabilitado hasta que exista un preview válido para el valor ingresado.
- La pantalla conserva los endpoints existentes y no convierte el Excel maestro en fuente de escritura.
- El historial reciente queda visible como cierre del flujo e incluye rollback con preview, backup nuevo e historial propio.

### Etapa 3: Entender un precio en modo simple

Objetivo: crear lectura comercial antes del grafo.

Cambios:

- resumen simple de la última cotización
- componentes principales
- botones a grafo y árbol avanzado

Riesgo bajo/medio.

### Etapa 4: Impacto de cambios más comercial

Objetivo: convertir `Impacto de variables` en simulador entendible.

Cambios:

- renombrar conceptos
- mostrar productos por estado
- agregar simulación antes/después
- conectar con wizard de modificación

Riesgo medio.

### Etapa 5: Historial y backups integrados

Objetivo: que el usuario pueda auditar cambios sin buscar archivos.

Cambios:

- unificar historial y backups
- detalle de cambio
- preparar rollback con preview

Riesgo medio/alto si se habilita rollback real. Puede implementarse primero como lectura.

### Etapa 6: Exportar soporte Excel con mensaje explícito

Objetivo: evitar confusión sobre el rol del Excel.

Cambios:

- pantalla propia
- explicación clara
- botón generar/descargar
- link a documentación

Riesgo bajo.

## 15. Riesgos de seguir sumando funciones sin rediseño

Si se sigue agregando funcionalidad con la navegación actual, aparecen estos riesgos:

- el usuario no sabe dónde operar
- aumenta la probabilidad de tocar pantallas técnicas por error
- el Excel puede volver a interpretarse como fuente operativa
- el grafo puede ser visto como obligatorio aunque sea avanzado
- se duplican conceptos con nombres distintos
- soporte y capacitación se vuelven más costosos
- cada nuevo producto o variable aumenta la carga cognitiva
- las mejoras técnicas quedan menos visibles para el usuario real

El riesgo principal no es que el sistema falle, sino que se vuelva difícil de usar con confianza.

## 16. Veredicto final

La arquitectura técnica ya permite una administración segura de precios. El próximo salto debe ser de arquitectura de información.

Recomendación final:

> Reorganizar el sistema alrededor de siete acciones principales: cotizar, modificar precios, entender un precio, ver impacto, consultar historial/backups, exportar soporte Excel y acceder a configuración avanzada.

La prioridad debería ser implementar primero el renombrado de navegación y convertir `Administrador de precios` en `Modificar precios` con flujo guiado. Eso ataca el punto más sensible: que el usuario entienda dónde se cambian precios y qué está protegido.

El Excel maestro debe comunicarse siempre como soporte, auditoría y exportación, no como lugar operativo de edición.
