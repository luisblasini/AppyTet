# Checkpoint: AppyTET v5 — Estabilización y Staging (21-04-2026)

## 🎯 Objetivo Actual
Lograr operatividad al 100% en un entorno de **Staging Local** (Modo Espejo) antes de sincronizar con Supabase Prod y realizar el deploy final en Firebase.

---

## ✅ Logros Alcanzados (Fase 1 y 2)
1.  **Seguridad:** `.env` y `.env.*` agregados al `.gitignore`. Credenciales blindadas.
2.  **Estabilidad de Estado (App.jsx):** 
    *   Implementado `INITIAL_BOOKING_STATE` atómico.
    *   Arreglado el crash en "Nuevo Booking" (ahora limpia `childAges` y `companionList` correctamente).
3.  **Inmutabilidad (VoucherPreview.jsx):** 
    *   Refactorizado el cambio de estado de Pago (Pix) usando `.map()` para evitar mutaciones directas.
4.  **Base de Datos (db.js):** 
    *   Implementada lógica de `multi-batch` (lotes de 450) para evitar límites de Firestore en la limpieza de duplicados.
5.  **Unificación de Datos (scripts/):** 
    *   Limpieza de caracteres rotos en el CSV.
    *   Estandarización de `fees_info`.

---

## 🔍 Hallazgo Crítico: El "Espejismo" de los Vouchers
*   **Diagnóstico:** Los Vouchers se ven bien en local porque usan `src/data/voucherRules.js` (un backup hardcodeado).
*   **El Problema:** La pestaña **Settings** (y por ende Supabase) está vacía para productos como "Top 3" porque el script de unificación no tenía los alias necesarios.
*   **Causa:** Discrepancia de nombres entre Supabase (`Top 3`) y CSV (`Top 3 Islas`).

---

## 🛠️ Nueva Estrategia: "Modo Espejo" (Mirror DB)
Para no arriesgar la producción, trabajaremos en un entorno aislado:
1.  **Fuente de Verdad Local:** Usaremos `src/data/final_master_catalog.json` como nuestra base de datos espejo.
2.  **Staging Switch:** Inyectaremos un flag en `src/supabase.js` para que en desarrollo el App lea el JSON local.
3.  **Refine de Datos:** Actualizaremos el script de unificación con todos los alias de `voucherRules.js` para que el JSON local esté perfecto.

---

## 📋 Lista de Alias Pendientes (Para el próximo Build)
| Nombre en Supabase | Nombre en CSV | Estado |
| :--- | :--- | :--- |
| `Top 3` | `Top 3 Islas` | Pendiente |
| `Bela` | `Isla Bela` | Pendiente |
| `Capri` | `Capri Classic` | Pendiente |
| `Walking Tour` | `Walking Tour + Visita...` | Pendiente |

---

## 🚀 Próximos Pasos Inmediatos
1.  [ ] **Actualizar `build_master_unified.mjs`** con el diccionario completo de alias.
2.  [ ] **Implementar el Staging Switch** en la capa de datos.
3.  [ ] **Validar en Localhost:** Confirmar que "Settings" ya muestra la logística correcta leyendo del espejo.
4.  [ ] **Deploy Final:** Sincronizar Supabase y subir a Firebase.
