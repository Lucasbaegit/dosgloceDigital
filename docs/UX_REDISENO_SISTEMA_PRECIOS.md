# RediseÃ±o UX del sistema de precios

## 1. DiagnÃ³stico UX actual

El cotizador ya resolviÃ³ una parte tÃ©cnica muy importante: cotiza mÃºltiples productos, conserva trazabilidad, diferencia precios fijos PDF de variables operativas, permite administrar variables seguras y exporta soporte Excel.

El problema actual no es de capacidad, sino de comprensiÃ³n. La interfaz todavÃ­a refleja demasiado la arquitectura interna:

- mÃ³dulos tÃ©cnicos separados
- nombres pensados para desarrollo
- conceptos de trazabilidad visibles demasiado pronto
- muchas pantallas que responden a "cÃ³mo estÃ¡ construido" y no a "quÃ© quiere hacer el usuario"

Para una persona operativa o comercial, la pregunta no es "quÃ© mÃ³dulo tengo que abrir", sino:

- quiero cotizar
- quiero modificar un precio
- quiero entender por quÃ© saliÃ³ este total
- quiero saber quÃ© pasa si cambio una variable
- quiero volver atrÃ¡s si algo saliÃ³ mal
- quiero exportar informaciÃ³n para revisar o compartir

El rediseÃ±o recomendado debe ordenar el sistema alrededor de esas intenciones.

## 2. Problemas de comprensiÃ³n detectados

### No queda claro dÃ³nde modificar precios

Hoy conviven tÃ©rminos como `Variables principales`, `Administrador de precios`, `ConfiguraciÃ³n` y `Excel maestro`. Aunque la regla tÃ©cnica ya estÃ¡ definida, visualmente todavÃ­a puede parecer que hay varias puertas equivalentes para tocar precios.

Riesgo: que el usuario intente editar desde una pantalla tÃ©cnica o interprete el Excel maestro como fuente de escritura.

### No queda claro dÃ³nde entender un precio

El sistema tiene `Ãrbol del precio` y `Trazabilidad visual`, pero ambos nombres pueden sonar tÃ©cnicos. El usuario comercial necesita primero una explicaciÃ³n simple:

- material
- impresiÃ³n
- cantidad/rango
- adicionales
- urgencia
- total

El grafo y el Ã¡rbol deberÃ­an quedar como detalle avanzado, no como primera respuesta.

### No queda claro quÃ© se puede tocar y quÃ© no

Hay conceptos que para desarrollo son correctos, pero para operaciÃ³n generan ruido:

- variable madre
- impacta_hoy
- matriz PDF
- factor de ajuste
- fÃ³rmula calibrada
- tabla fija
- derivado

Estos conceptos deben existir, pero en modo avanzado o en documentaciÃ³n tÃ©cnica. En la operaciÃ³n diaria conviene traducirlos.

### La navegaciÃ³n creciÃ³ por acumulaciÃ³n

La barra actual combina tareas reales con mÃ³dulos auxiliares:

- Cotizador
- Ãrbol del precio
- Trazabilidad visual
- Impacto de variables
- Variables principales
- Administrador de precios
- ConfiguraciÃ³n
- Historial
- Precios
- Ajustes

Esto genera sensaciÃ³n de tablero tÃ©cnico. El sistema necesita una arquitectura de informaciÃ³n por objetivos.

## 3. Principio de rediseÃ±o

El sistema debe organizarse por intenciÃ³n del usuario, no por implementaciÃ³n tÃ©cnica.

Principio rector:

> Una pantalla principal debe responder una pregunta operativa clara.

Ejemplos:

- `Cotizar`: Â¿cuÃ¡nto sale este trabajo?
- `Modificar precios`: Â¿quÃ© valor operativo quiero cambiar y quÃ© impacto tendrÃ¡?
- `Entender un precio`: Â¿de dÃ³nde saliÃ³ este total?
- `Ver impacto de cambios`: Â¿quÃ© productos se afectan si cambio esta variable?
- `Historial y backups`: Â¿quÃ© se cambiÃ³, cuÃ¡ndo y cÃ³mo puedo volver atrÃ¡s?
- `Exportar soporte Excel`: Â¿cÃ³mo genero un archivo de revisiÃ³n o auditorÃ­a?
- `ConfiguraciÃ³n avanzada`: Â¿dÃ³nde quedan las herramientas tÃ©cnicas?

## 4. Nueva navegaciÃ³n recomendada

MenÃº principal recomendado:

1. Cotizar
2. Modificar precios
3. Entender un precio
4. Ver impacto de cambios
5. Historial y backups
6. Exportar soporte Excel
7. ConfiguraciÃ³n avanzada

### 1. Cotizar

Pantalla principal de trabajo diario. Debe ser la entrada por defecto.

Incluye:

- selector de producto
- campos necesarios segÃºn producto
- adicionales vÃ¡lidos
- resultado final
- botÃ³n copiar
- acceso rÃ¡pido a "Entender este precio"

### 2. Modificar precios

Reemplaza como entrada operativa al actual `Administrador de precios`.

Incluye:

- wizard guiado
- variables editables reales
- preview obligatorio
- confirmaciÃ³n
- backup
- historial del cambio

No debe mostrar desde el inicio todos los detalles tÃ©cnicos.

### 3. Entender un precio

Fusiona conceptualmente:

- `Ãrbol del precio`
- `Trazabilidad visual`

La primera vista debe ser simple. El grafo y el Ã¡rbol tÃ©cnico aparecen bajo "Ver detalle avanzado".

### 4. Ver impacto de cambios

Equivale al actual `Impacto de variables`, pero con lenguaje menos tÃ©cnico.

Debe responder:

- quÃ© productos dependen de este valor
- quÃ© ejemplos cambian
- quÃ© precios finales estÃ¡n protegidos por PDF
- quÃ© cambios son directos y cuÃ¡les son preparados para futuro

### 5. Historial y backups

Agrupa:

- historial de cambios de precios
- backups generados
- restauraciones disponibles
- quiÃ©n/cuÃ¡ndo/quÃ© cambiÃ³

Debe ser entendible como bitÃ¡cora operativa, no como lista de archivos.

### 6. Exportar soporte Excel

Equivale al Excel maestro exportable.

Mensaje principal:

> El Excel maestro es soporte de revisiÃ³n, auditorÃ­a y documentaciÃ³n. No es la fuente operativa para modificar precios.

### 7. ConfiguraciÃ³n avanzada

Contiene vistas tÃ©cnicas o de mantenimiento:

- Variables principales
- ConfiguraciÃ³n
- Importador preview
- diagnÃ³sticos tÃ©cnicos
- vistas JSON/config si existen

Debe estar separada del uso diario.

## 5. Mapa de pantallas actuales a pantallas nuevas

| Pantalla actual | Pantalla nueva recomendada | Tratamiento |
| --- | --- | --- |
| Cotizador | Cotizar | Mantener como pantalla principal, simplificar accesos secundarios. |
| Administrador de precios | Modificar precios | Renombrar y convertir en wizard guiado. |
| Ãrbol del precio | Entender un precio | Integrar como detalle avanzado. |
| Trazabilidad visual | Entender un precio | Integrar como detalle avanzado visual. |
| Impacto de variables | Ver impacto de cambios | Renombrar y simplificar lenguaje. |
| Variables principales | ConfiguraciÃ³n avanzada / Modificar precios | Vista tÃ©cnica; no debe ser la puerta operativa principal. |
| Excel maestro exportable | Exportar soporte Excel | Mantener como exportaciÃ³n y auditorÃ­a. |
| Importador preview | ConfiguraciÃ³n avanzada | Mantener fuera del flujo diario. |
| Historial | Historial y backups | Fusionar con backups y cambios de precios. |
| Backups | Historial y backups | Mostrar como restauraciones disponibles. |
| ConfiguraciÃ³n | ConfiguraciÃ³n avanzada | Mantener para usuarios tÃ©cnicos. |
| Precios | Modificar precios / ConfiguraciÃ³n avanzada | Evitar duplicaciÃ³n; si es tÃ©cnico, mover a avanzada. |
| Ajustes | ConfiguraciÃ³n avanzada | Mantener separado de operaciÃ³n diaria. |

## 6. Flujo recomendado para modificar precios

El flujo debe ser guiado, progresivo y seguro. No conviene mostrar todos los campos a la vez.

### Paso 1: Elegir quÃ© quiero modificar

Mostrar tarjetas o lista simple:

- DÃ³lar
- Click color
- Papel obra 90g
- Multiplicador general
- Tinta blanca autoadhesiva

Evitar mostrar claves tÃ©cnicas como primera capa. La clave interna puede aparecer en detalle avanzado.

### Paso 2: Ver valor actual

Mostrar:

- valor actual
- unidad
- Ãºltima modificaciÃ³n
- fuente del valor
- estado: operativo

Mensaje claro:

> Este valor impacta hoy en el cotizador.

### Paso 3: Ver productos afectados

Antes de ingresar el nuevo valor, mostrar quÃ© productos podrÃ­an cambiar.

Ejemplo:

- Stickers Circulares
- Bajadas Autoadhesivas
- fÃ³rmulas calibradas conectadas

Usar lenguaje humano:

- "Afecta el cÃ¡lculo base"
- "El precio final puede estar protegido por tabla PDF"
- "Se usa como recargo proporcional"

### Paso 4: Ingresar nuevo valor

Mostrar:

- valor actual
- campo nuevo valor
- diferencia automÃ¡tica
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
- precios que no se modificarÃ¡n por estar fijos por PDF

### Paso 6: Confirmar y guardar

El botÃ³n de guardar solo debe habilitarse si el preview corresponde al valor ingresado.

Antes de guardar:

- modal de confirmaciÃ³n
- resumen del cambio
- aviso de backup automÃ¡tico

### Paso 7: Ver backup/historial

DespuÃ©s de guardar:

- mostrar mensaje de Ã©xito
- mostrar backup creado
- agregar entrada al historial
- ofrecer acciÃ³n: "Ver historial de cambios"

## 7. Flujo recomendado para entender un precio

El objetivo es responder rÃ¡pido "por quÃ© dio este total", sin obligar al usuario a leer un grafo tÃ©cnico.

### Paso 1: Elegir cotizaciÃ³n

Opciones:

- Usar Ãºltima cotizaciÃ³n
- Buscar una cotizaciÃ³n guardada
- Elegir un caso de ejemplo

### Paso 2: Ver resumen simple

Mostrar una tarjeta:

```text
Total final: $38.584
Producto: Bajadas Fullcolor
Cantidad: 53
Formato: A3+
ImpresiÃ³n: 4/0
```

### Paso 3: Ver componentes principales

Mostrar como desglose simple:

- Material: IlustraciÃ³n 150g
- ImpresiÃ³n: Fullcolor 4/0
- Rango aplicado: 51 a 100
- Precio base: $622 por unidad
- Adicional: Laca UV, 1 cara, $106 por unidad
- Cantidad: 53
- Total adicional: $5.618
- Total final: $38.584

### Paso 4: Ver detalle avanzado

BotÃ³n:

```text
Ver detalle avanzado
```

Abre:

- grafo visual
- Ã¡rbol tÃ©cnico
- variables usadas
- fuente PDF
- fÃ³rmula o matriz aplicada

## 8. Flujo recomendado para ver impacto

Esta pantalla debe responder "si cambio esto, quÃ© pasa".

### Paso 1: Elegir valor a analizar

Mostrar nombres entendibles:

- Click color
- Papel obra 90g
- Tinta blanca autoadhesiva
- Multiplicador general
- DÃ³lar

### Paso 2: Ver productos conectados

Separar por estado:

- Impacta hoy
- Preparado para futuro
- Solo referencia histÃ³rica

### Paso 3: Simular cambio

Permitir ingresar un valor hipotÃ©tico sin guardar.

Mostrar:

- ejemplos de precios antes/despuÃ©s
- diferencia
- productos afectados
- advertencias

### Paso 4: Ir a modificar precios

Si el usuario decide avanzar:

```text
Usar este valor en Modificar precios
```

Esto abre el wizard con el valor precargado, pero todavÃ­a exige preview y confirmaciÃ³n.

## 9. Flujo recomendado para historial y rollback

La pantalla `Historial y backups` debe funcionar como bitÃ¡cora.

### Vista principal

Columnas sugeridas:

- Fecha
- Usuario / origen
- Valor modificado
- Antes
- DespuÃ©s
- Productos afectados
- Backup
- Estado

### Detalle de cambio

Al abrir un cambio:

- resumen
- preview usado
- backup asociado
- archivo/config afectado
- botÃ³n "Comparar"
- botÃ³n "Restaurar" solo si el flujo de rollback estÃ¡ implementado y validado

### Rollback

Si se implementa restauraciÃ³n:

1. elegir cambio
2. ver backup
3. previsualizar restauraciÃ³n
4. confirmar
5. guardar nuevo historial de rollback

Nunca restaurar silenciosamente.

## 10. QuÃ© informaciÃ³n va en modo simple

Modo simple es para operaciÃ³n diaria.

Debe mostrar:

- valor actual
- nuevo valor
- diferencia
- productos afectados
- advertencias simples
- total final
- desglose principal
- fuente resumida
- botÃ³n previsualizar
- botÃ³n guardar
- backup creado

Lenguaje recomendado:

- "Afecta hoy"
- "No modifica precios finales fijos"
- "Se guardarÃ¡ con backup"
- "Este Excel es solo soporte"

## 11. QuÃ© informaciÃ³n va en modo avanzado

Modo avanzado es para auditorÃ­a, soporte tÃ©cnico y depuraciÃ³n.

Puede mostrar:

- variable madre
- clave interna
- impacta_hoy
- factor de ajuste PDF
- matriz PDF
- tabla fija
- fÃ³rmula editable calibrada
- fuente exacta de config
- grafo tÃ©cnico
- Ã¡rbol tÃ©cnico
- JSON de trazabilidad
- endpoints
- archivos de backend

Regla UX:

> El modo avanzado no debe desaparecer, pero no debe ser la primera capa de lectura.

## 12. Nombres actuales vs nombres recomendados

| Nombre actual | Nombre recomendado | Motivo |
| --- | --- | --- |
| Cotizador | Cotizar | AcciÃ³n directa y cotidiana. |
| Administrador de precios | Modificar precios | MÃ¡s claro para uso operativo. |
| Variables principales | Costos base | Traduce el concepto tÃ©cnico a lenguaje comercial. |
| Trazabilidad visual | De dÃ³nde sale este precio | Responde una pregunta humana. |
| Ãrbol del precio | Detalle del cÃ¡lculo | MÃ¡s simple y menos abstracto. |
| Impacto de variables | QuÃ© afecta este cambio | Orientado a decisiÃ³n. |
| Excel maestro | Exportar soporte Excel | Deja claro que es salida, no fuente operativa. |
| ConfiguraciÃ³n | ConfiguraciÃ³n avanzada | Reduce riesgo de tocar algo por error. |
| Matriz PDF | Tabla fija validada | MÃ¡s entendible y menos tÃ©cnico. |
| impacta_hoy | Afecta precios actuales | TraducciÃ³n operativa. |
| FÃ³rmula editable calibrada | FÃ³rmula conectada con ajuste PDF | MÃ¡s explicativo para auditorÃ­a. |
| Factor de ajuste PDF | Ajuste para coincidir con PDF | MÃ¡s claro para no tÃ©cnicos. |
| Variable madre | Costo base | MÃ¡s comercial. |

## 13. Wireframes textuales

### Pantalla: Cotizar

```text
[Header]
Cotizar
CalculÃ¡ precios actuales validados contra PDF.

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
CambiÃ¡ solo costos operativos conectados. El sistema genera preview, backup e historial.

[Stepper]
1 Elegir precio -> 2 Ver impacto -> 3 Previsualizar -> 4 Confirmar

[Paso 1]
Lista de costos editables:
- DÃ³lar
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
Backup automÃ¡tico
Confirmar y guardar
```

### Pantalla: Entender un precio

```text
[Header]
De dÃ³nde sale este precio

[Selector]
Usar Ãºltima cotizaciÃ³n | Buscar cotizaciÃ³n | Caso de ejemplo

[Resumen]
Total final
Producto
Cantidad

[Componentes]
Material
ImpresiÃ³n
Rango
Adicionales
Urgencia

[Acciones]
Ver grafo avanzado
Ver Ã¡rbol tÃ©cnico
Ver fuente PDF/fÃ³rmula
```

### Pantalla: Ver impacto de cambios

```text
[Header]
QuÃ© afecta este cambio

[Selector]
ElegÃ­ un costo base

[Resumen]
Impacta hoy / preparado para futuro / referencia histÃ³rica

[SimulaciÃ³n]
Valor actual
Valor hipotÃ©tico
Diferencia

[Ejemplos]
Producto | Antes | DespuÃ©s | Diferencia | Estado

[AcciÃ³n]
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
DespuÃ©s
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
El Excel maestro es soporte de auditorÃ­a y revisiÃ³n. No modifica precios del sistema.

[Contenido]
Variables
Tablas finales
Trazabilidad
Bloqueados

[AcciÃ³n]
Generar Excel maestro
Descargar Ãºltimo Excel
```

### Pantalla: ConfiguraciÃ³n avanzada

```text
[Header]
ConfiguraciÃ³n avanzada

[Aviso]
SecciÃ³n tÃ©cnica. Usar solo para auditorÃ­a, soporte o mantenimiento.

[Opciones]
Variables principales tÃ©cnicas
Importador preview
DiagnÃ³sticos
ConfiguraciÃ³n interna
```

## 14. ImplementaciÃ³n recomendada por etapas

### Etapa 1: Renombrado y agrupaciÃ³n de navegaciÃ³n

Objetivo: reducir confusiÃ³n sin reescribir flujos.

Cambios:

- renombrar tabs principales
- ocultar vistas tÃ©cnicas bajo `ConfiguraciÃ³n avanzada`
- agregar texto explicativo corto por pantalla
- mantener rutas/componentes actuales internamente

Riesgo bajo.

### Etapa 2: Modificar precios como wizard

Objetivo: transformar el administrador actual en flujo paso a paso.

Cambios:

- dividir en pasos
- mostrar una sola decisiÃ³n por vez
- bloquear guardado hasta preview
- mostrar historial posterior al guardado

Riesgo medio, porque toca UX operativa de ediciÃ³n.

### Etapa 3: Entender un precio en modo simple

Objetivo: crear lectura comercial antes del grafo.

Cambios:

- resumen simple de la Ãºltima cotizaciÃ³n
- componentes principales
- botones a grafo y Ã¡rbol avanzado

Riesgo bajo/medio.

### Etapa 4: Impacto de cambios mÃ¡s comercial

Objetivo: convertir `Impacto de variables` en simulador entendible.

Cambios:

- renombrar conceptos
- mostrar productos por estado
- agregar simulaciÃ³n antes/despuÃ©s
- conectar con wizard de modificaciÃ³n

Riesgo medio.

### Etapa 5: Historial y backups integrados

Objetivo: que el usuario pueda auditar cambios sin buscar archivos.

Cambios:

- unificar historial y backups
- detalle de cambio
- preparar rollback con preview

Riesgo medio/alto si se habilita rollback real. Puede implementarse primero como lectura.

### Etapa 6: Exportar soporte Excel con mensaje explÃ­cito

Objetivo: evitar confusiÃ³n sobre el rol del Excel.

Cambios:

- pantalla propia
- explicaciÃ³n clara
- botÃ³n generar/descargar
- link a documentaciÃ³n

Riesgo bajo.

## 15. Riesgos de seguir sumando funciones sin rediseÃ±o

Si se sigue agregando funcionalidad con la navegaciÃ³n actual, aparecen estos riesgos:

- el usuario no sabe dÃ³nde operar
- aumenta la probabilidad de tocar pantallas tÃ©cnicas por error
- el Excel puede volver a interpretarse como fuente operativa
- el grafo puede ser visto como obligatorio aunque sea avanzado
- se duplican conceptos con nombres distintos
- soporte y capacitaciÃ³n se vuelven mÃ¡s costosos
- cada nuevo producto o variable aumenta la carga cognitiva
- las mejoras tÃ©cnicas quedan menos visibles para el usuario real

El riesgo principal no es que el sistema falle, sino que se vuelva difÃ­cil de usar con confianza.

## 16. Veredicto final

La arquitectura tÃ©cnica ya permite una administraciÃ³n segura de precios. El prÃ³ximo salto debe ser de arquitectura de informaciÃ³n.

RecomendaciÃ³n final:

> Reorganizar el sistema alrededor de siete acciones principales: cotizar, modificar precios, entender un precio, ver impacto, consultar historial/backups, exportar soporte Excel y acceder a configuraciÃ³n avanzada.

La prioridad deberÃ­a ser implementar primero el renombrado de navegaciÃ³n y convertir `Administrador de precios` en `Modificar precios` con flujo guiado. Eso ataca el punto mÃ¡s sensible: que el usuario entienda dÃ³nde se cambian precios y quÃ© estÃ¡ protegido.

El Excel maestro debe comunicarse siempre como soporte, auditorÃ­a y exportaciÃ³n, no como lugar operativo de ediciÃ³n.
