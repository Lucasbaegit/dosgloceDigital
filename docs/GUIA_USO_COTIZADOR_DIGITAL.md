# Guía de uso del Cotizador Digital Promo Directa

## 1. Qué es el cotizador nuevo

El cotizador nuevo es un sistema web interno para calcular precios de productos digitales de Promo Directa.

El objetivo es reemplazar el uso directo del Excel histórico por una herramienta más clara, controlada y fácil de mantener.

El sistema toma como referencia principal:

- **PDF de lista de precios**: fuente confiable de precios finales.
- **Excel histórico**: fuente de lógica antigua, fórmulas y variables base.
- **Configuraciones internas del sistema**: fuente operativa actual para calcular, validar y exportar.

El cotizador no busca copiar el Excel viejo tal cual estaba, sino modernizarlo y ordenarlo.

---

## 2. Cómo se usa el cotizador

El usuario ingresa al sistema desde el navegador.

Dirección local:

```text
http://127.0.0.1:5174
```

Desde ahí puede seleccionar productos, cargar opciones y obtener el precio final.

Cada producto tiene campos propios, por ejemplo:

- Producto
- Formato
- Papel
- Gramaje
- Cantidad
- Caras
- Color
- Terminación
- Adicionales
- Urgencia, si corresponde

El sistema devuelve:

- Precio final
- Precio unitario, si corresponde
- Detalle del cálculo
- Estado del cálculo
- Trazabilidad técnica, cuando está disponible

---

## 3. Productos implementados

Actualmente el cotizador trabaja con estos productos:

- Bajadas Fullcolor
- Bajadas Blanco y Negro
- Bajadas Kraft
- Bajadas Autoadhesivas
- Troquelado digital
- Stickers circulares
- Tarjetas troqueladas circulares
- Tarjetas personales 9x5
- Tarjetas postales
- Folletos
- Carpetas
- Sobres
- Stickers corte recto
- Imanes corte recto
- Plancha imán impreso
- Agendas / Cuadernos

También hay productos detectados pero bloqueados por falta de datos confiables:

- Membretes
- DTF UV
- DTF Textil
- PegaManía
- OPP en stickers circulares, si todavía no está conectado
- Algunas terminaciones de tarjetas, si no tienen matriz confiable

---

## 4. Cómo se calculan los precios

El cotizador trabaja con dos formas principales de cálculo.

### A. Tablas fijas PDF

Algunos productos usan precios finales tomados directamente del PDF.

En estos casos, el precio final no se calcula desde cero, sino que se busca en una matriz cerrada.

Ejemplos:

- Tarjetas 9x5
- Tarjetas postales
- Folletos
- Carpetas
- Sobres
- Stickers corte recto
- Imanes corte recto
- Plancha imán
- Agendas / Cuadernos

En estos productos, la tabla final es la autoridad.

No se debe modificar un precio individual a mano salvo que se actualice la matriz completa desde una fuente confiable.

---

### B. Fórmulas editables calibradas

Algunos productos usan una lógica más flexible basada en variables madre.

Ejemplo:

- Stickers circulares

En este caso, el sistema puede usar variables como:

- Costo de papel
- Click color
- Multiplicador comercial
- Laca UV
- Factor de ajuste contra PDF

El resultado final se calibra para coincidir con la lista publicada, pero permite que algunas variables madre sean editables.

---

## 5. Qué son las variables madre

Las variables madre son los valores base que pueden modificar precios de forma controlada.

Ejemplos actuales:

- Tipo de cambio USD
- Click color
- Obra 90g
- Multiplicador general
- Tinta blanca base 1 copia

Estas variables son editables porque tienen una fuente confiable y el sistema sabe dónde impactan.

---

## 6. Qué son los valores derivados

Los valores derivados son precios o importes que salen de una fórmula, matriz o cálculo.

No se editan directamente.

Ejemplos:

- Precio final
- Precio por rango
- Recargo calculado
- Precio unitario
- Total final
- Factor de ajuste PDF
- Matriz final del PDF

Si se quiere cambiar un valor derivado, hay que modificar la variable madre correspondiente o actualizar la matriz desde una fuente válida.

---

## 7. Qué son las tablas PDF fijas

Son matrices de precios tomadas del PDF oficial.

El sistema las muestra, exporta y usa para cotizar, pero no las trata como campos editables.

Ejemplo:

Una tabla de tarjetas 9x5 puede tener precios por:

- Cantidad
- Caras
- Laminado
- Laca
- Papel

Esos precios vienen de la lista oficial y se consideran cerrados.

---

## 8. Qué es el Excel maestro

El sistema puede generar un Excel maestro nuevo y ordenado.

Este archivo sirve como documentación comercial y técnica del cotizador.

Incluye:

- Resumen general
- Variables madre
- Rangos
- Tablas finales
- Productos bloqueados
- Trazabilidad
- Estado de validación

El Excel maestro no reemplaza automáticamente al sistema. Es una exportación controlada.

Sirve para revisar, auditar y ordenar la información.

---

## 9. Qué significa "impacta hoy"

En la hoja de variables madre, cada variable puede tener un estado.

### Impacta hoy = true

Significa que la variable está conectada al sistema y modificarla puede cambiar precios reales.

Ejemplo:

```text
click_color
obra_90g
tipo_cambio_usd
```

### Impacta hoy = false

Significa que la variable fue detectada desde el Excel histórico, pero todavía no está conectada a una fórmula operativa.

Ejemplo:

```text
ilustracion_150g
triplex_350g
autoadhesivo_opp
```

Estas variables pueden estar preparadas para futuras fórmulas, pero cambiarlas todavía no modifica precios finales.

---

## 10. Qué significa producto bloqueado

Un producto queda bloqueado cuando no hay datos suficientes o confiables para cotizarlo automáticamente.

El sistema prefiere bloquear antes que inventar un precio.

Ejemplo:

```text
Membretes
```

Motivo:

```text
Falta de datos confiables en PDF o Excel para armar una matriz segura.
```

---

## 11. Exportaciones disponibles

El sistema puede exportar:

### PDF de tablas

Sirve para consultar las tablas finales vigentes.

### Excel maestro

Sirve para auditar todo el sistema en formato ordenado.

Incluye variables, rangos, productos, bloqueados y trazabilidad.

También incluye la hoja `21_TRAZABILIDAD_PRECIOS`, donde se explica de dónde provienen precios testigo y cómo se componen: tabla PDF, variables madre, adicionales, factores, derivados o bloqueados.

---

## 12. Regla general de uso

El cotizador nuevo debe usarse como fuente operativa diaria.

El PDF sigue siendo la fuente confiable de precios finales.

El Excel viejo queda como fuente histórica.

El Excel maestro nuevo sirve para ordenar, revisar y documentar el sistema actual.
