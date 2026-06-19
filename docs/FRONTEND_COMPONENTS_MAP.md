# Mapa de componentes frontend del cotizador

## Objetivo

El frontend del cotizador separa responsabilidades para que futuras etapas sean más seguras. `CotizadorBajadasV2.jsx` conserva estado principal, llamadas API y reglas de armado de payload; los componentes en `frontend/src/components/cotizador/` encapsulan piezas de presentación o paneles por tarea.

## Árbol actual

```text
frontend/src/components/
  CotizadorBajadasV2.jsx
  cotizador/
    NavigationTabs.jsx
    ViewModeToggle.jsx
    EntenderPrecioPanel.jsx
    ImpactoCambiosPanel.jsx
    HistorialBackupsPanel.jsx
    ExportarSoporteExcelPanel.jsx
    ConfiguracionAvanzadaPanel.jsx
    ModificarPreciosWizard.jsx
```

## Responsabilidades

| Archivo | Responsabilidad | Props principales |
| --- | --- | --- |
| `CotizadorBajadasV2.jsx` | Contenedor principal: estado, formularios, payloads, llamadas API, selección de tabs y composición de paneles. | Estado global del cotizador |
| `NavigationTabs.jsx` | Navegación principal por tareas. | `activeTab`, `setActiveTab` |
| `ViewModeToggle.jsx` | Selector global Modo simple / Modo avanzado. | `viewMode`, `setViewMode`, `isSimpleMode`, `isAdvancedMode` |
| `EntenderPrecioPanel.jsx` | Intro y conmutación entre resumen, árbol y trazabilidad visual. | `understandMode`, `setUnderstandMode`, render callbacks |
| `ImpactoCambiosPanel.jsx` | Vista de impacto de variables/productos. | `impactData`, filtros y setters |
| `HistorialBackupsPanel.jsx` | Pantalla general de historial y backups. | render callbacks de historial/rollback, `cfgBackups` |
| `ExportarSoporteExcelPanel.jsx` | Exportación de Excel/PDF de soporte. | mensajes y callbacks de descarga |
| `ConfiguracionAvanzadaPanel.jsx` | Guard simple/avanzado y composición de configuración técnica. | `isSimpleMode`, `setViewMode`, render callbacks |
| `ModificarPreciosWizard.jsx` | Layout del wizard de modificación de precios. | estado del wizard y render callbacks por paso |

## Regla para futuras pantallas

- No agregar nuevas pantallas grandes directamente en `CotizadorBajadasV2.jsx`.
- Mantener estado/API en el contenedor si reduce riesgo.
- Extraer UI y paneles a `frontend/src/components/cotizador/`.
- Pasar props explícitas.
- No mover lógica de precios al frontend.

## Garantía del refactor

Este refactor no cambia precios, matrices PDF, endpoints ni lógica productiva. Solo separa responsabilidades visuales y reduce el tamaño del archivo principal.
