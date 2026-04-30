# 🏗️ Architecture Audit Report — AppyTET v5
**Fecha:** 28/04/2026
**Fase:** Bloque 2 - Architecture Deep Audit

## 1. Análisis de Complejidad en `App.jsx`
El componente `App.jsx` actúa actualmente como un "God Component" que gestiona múltiples responsabilidades que deberían estar delegadas:

| Responsabilidad | Estado Actual | Propuesta de Refactorización |
| :--- | :--- | :--- |
| **Navegación** | Gestionada mediante un `useState` simple y renderizado condicional masivo. | Extraer a un componente `NavigationLayout` o usar un router si la complejidad crece. |
| **Persistencia PDF/CSV** | Lógica de `jspdf`, `html2canvas` y generación de CSV incrustada en el componente. | Mover a `src/utils/exporters.js`. |
| **Gestión de Estado de Pestañas** | `search`, `expandedId`, `loadingTab` repetidos para Historia, Contactos y Finanzas. | Unificar en un hook `useTabState` o delegar al componente hijo correspondiente. |
| **Drag & Drop (dnd-kit)** | Sensores y handlers definidos en el root. | Mover a un componente `SortableTourList` que encapsule la lógica de `dnd-kit`. |
| **Sincronización de Datos** | `useEffect` para cargar datos al cambiar de pestaña. | Mover la lógica de carga a los componentes Dashboard correspondientes (Encapsulamiento). |

## 2. Hallazgos Críticos (Arquitectura)
1. **Acoplamiento de Datos (Prop Drilling):** Se pasan demasiadas props a `BookingDetails` y `SettingsDashboard`. Muchos de estos estados podrían vivir dentro de hooks especializados.
2. **Lógica de UI Pesada:** El renderizado de `App.jsx` (líneas 449-611) es difícil de leer y mantener debido a la profundidad del árbol y la mezcla de componentes.
3. **Falta de Error Boundaries:** Un error en la generación de un PDF o en el mapeo de un producto puede tirar abajo toda la aplicación.

## 3. Plan de Remediación (Bloque 2)

### Fase 2.1: Extracción de Utilidades de Exportación
- **Archivo:** [NEW] `src/utils/exporters.js`
- **Acción:** Mover `handleGeneratePDF` y `exportContactsCSV` fuera de `App.jsx`.

### Fase 2.2: Refactorización de Dashboards Autónomos
- **Acción:** Los componentes `HistoryDashboard`, `ContactsDashboard` y `FinanceDashboard` deben ser responsables de su propio fetch de datos (usando hooks locales o props mínimas), eliminando la lógica de carga de `App.jsx`.

### Fase 2.3: Simplificación de `App.jsx`
- **Acción:** Reducir `App.jsx` a menos de 300 líneas, enfocándose únicamente en la orquestación de alto nivel y el layout principal.

---
**Nota:** Este reporte es un documento vivo. Se actualizará a medida que se profundice en la auditoría.
