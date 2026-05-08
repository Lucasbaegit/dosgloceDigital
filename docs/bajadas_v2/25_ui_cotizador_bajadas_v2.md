# UI Cotizador Bajadas v2

## Objetivo
Crear interfaz visual moderna para cotización de Bajadas v2, conectada al endpoint `POST /bajadas-v2/cotizar`.

## Referencias visuales usadas
- Mockup principal: `C:\Users\baezl\Desktop\proyectos\desgloceExcel\imagenes\mockup dark cotizador bajadas.png`
- Logo principal: `C:\Users\baezl\Desktop\proyectos\desgloceExcel\imagenes\logoPromo.jpg`

## Estructura implementada
- `frontend/package.json`
- `frontend/index.html`
- `frontend/src/main.jsx`
- `frontend/src/App.jsx`
- `frontend/src/styles.css`
- `frontend/src/api/bajadasV2Api.js`
- `frontend/src/components/CotizadorBajadasV2.jsx`
- `frontend/public/logoPromo.jpg`

## Layout y estilo
- Tema oscuro (fondo negro/charcoal, cards oscuras, texto claro).
- Sidebar izquierda con placeholders:
  - Cotizador
  - Pedidos
  - Plantillas
  - Historial
  - Precios
  - Ajustes
- Panel central: formulario de cotización.
- Panel derecho: resultado y trazabilidad.
- Branding superior con `logoPromo.jpg`.

## Funcionalidad
- Campos de cotización:
  - categoría (automática según impresión)
  - formato (A3+, XA3, XL, A4, Kraft)
  - impresión/caras (4/0, 4/4, 1/0, 1/1)
  - tipo_papel (liviano, pesado, autoadhesivo, kraft)
  - material (select)
  - gramaje (select)
  - cantidad_rango (select)
  - urgencia (normal, express, super_express, ya_24hs)
- Inferencias:
  - 4/0 o 4/4 => `modo_color=fullcolor` y `categoria=Bajadas Fullcolor`
  - 1/0 o 1/1 => `modo_color=blanco_y_negro` y `categoria=Bajadas Blanco y Negro`
- Botón principal `Calcular`.
- Enter dispara cálculo (`form onSubmit`).
- Loading visible durante request.
- Manejo de errores claros:
  - combinación inexistente
  - urgencia inválida
  - API caída
  - campos incompletos
- Resultado mostrado:
  - `precio_sin_iva`
  - `precio_con_recargo_urgencia`
  - `regla_aplicada`
  - `fuente`
  - `trazabilidad`

## Endpoint consumido
- `POST http://127.0.0.1:8000/bajadas-v2/cotizar`

## Ejecución local
### 1) API
```powershell
python scripts\bajadas_v2\run_api_bajadas_v2.py --host 127.0.0.1 --port 8000
```

### 2) Frontend
```powershell
cd frontend
npm install
npm run dev
```

## Nota
No se modificó motor/reglas de Bajadas v2 ni archivos de Excel/CSV/PDF.
# Actualización: cantidad manual + rango derivado

Se actualizó la UI para que `Cantidad` sea un input numérico manual y se derive automáticamente `cantidad_rango` usando los rangos disponibles para la combinación seleccionada (`formato + tipo_papel + material + gramaje + caras`).

Comportamiento:
- El usuario ingresa unidades reales (ej. `30`).
- La UI deriva el rango aplicable (ej. `2 a 25` o `2 a 50` según disponibilidad real).
- El payload ahora envía ambos campos:
  - `cantidad_unidades`
  - `cantidad_rango`

El backend/API mantiene compatibilidad con contrato anterior (`cantidad_rango`) y agrega salida extendida:
- `precio_unitario_sin_iva`
- `precio_unitario_con_urgencia`
- `cantidad_unidades`
- `cantidad_rango_aplicado`
- `total_sin_iva`
- `total_con_urgencia`
- además de `precio_sin_iva` y `precio_con_recargo_urgencia` (compatibilidad, equivalentes unitarios)
## Mejora UX producción

Se mejoró la pantalla de cotización con foco de uso operativo:
- Estado API visible: `API conectada` / `API no disponible`.
- `Cantidad` manual con hint inmediato `Rango aplicado: ...` debajo del input.
- Resultado separado entre bloque de precio unitario y bloque de total final.
- Total final destacado visualmente como dato principal.
- Botón `Limpiar` (resetea cantidad, resultado, error, loading y traza visible).
- Botón `Copiar resultado` con resumen operativo listo para pegar.
- Estado vacío mejorado: `Completá los datos y presioná Calcular.`
- Errores de API/combinación/cantidad/campos mejorados.
