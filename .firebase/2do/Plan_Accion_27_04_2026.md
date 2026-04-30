# 🗺️ Plan Maestro de Acción — AppyTET v5
**Fecha:** 27/04/2026
**Estado:** ✅ BLOQUE 1 COMPLETADO — Iniciando Bloque 2

> 📍 **CHECKPOINT DE REINICIO (Leer antes de cualquier acción):**
> El **Bloque 1 (Data Integrity & Connection Layer)** está 100% completado y validado.
>
> **Resumen de lo ejecutado en el Bloque 1:**
> - `supabase.js` → `upsertContactSupabase` refactorizado: incluye todos los campos de contacto (`address`, `cep`, `dob`, `city`, `instagram`) y resuelve la colisión de identidad para extranjeros sin CPF usando `phone` como fallback.
> - `supabase.js` → `toSupabaseProduct` corregido: ahora guarda `status` y `voucher_obs` en cada update, cerrando la fuga de datos del catálogo.
> - `supabase.js` → Nueva función `deleteContactSupabase` nativa, reemplazando el código muerto de `db.js`.
> - `App.jsx` → Import de `db.js` eliminado. Prop `deleteContact` actualizada a `deleteContactSupabase`.
> - `useAIProcessor.js` → Silent failure eliminado. Los errores de red al guardar contactos ahora se propagan al usuario.
> - **BD Supabase (`appytet-v5-dev-9182`):** Se aplicaron los índices únicos necesarios en `contacts.cpf` (WHERE NOT NULL) y `contacts.phone`.
>
> **Reportes generados:**
> - `.firebase/2do/Database_Audit_Report.md` (Fase 1.1)
> - `.firebase/2do/Connection_Layer_Audit_Report.md` (Fase 1.2)
>
> **🚀 PRÓXIMO PASO INMEDIATO:** Ejecutar el **Bloque 2: Architecture Deep Audit** usando el workflow `/arquiaudit`.

---

## 1. OBJETIVO GENERAL
Refactorizar y estabilizar la aplicación AppyTET_v5 para convertirla en un sistema de grado producción: arquitectónicamente perfecto, con una única fuente de verdad (Supabase), un motor de IA resiliente y un entorno de despliegue automatizado y seguro.

---

## 2. ESTRATEGIA DE FIREBASE (Decisión 1.1 / 1.2)
*   **Acción:** Trabajaremos sobre el proyecto `appytet-v5-dev-9182` como entorno de STAGING (Pruebas).
*   **Transición:** Una vez que la auditoría y refactorización terminen al 100% en este proyecto:
    *   **Opción Elegida:** Se evaluará en el Bloque 4 si se transforma en producción o se duplica al original.
    *   **Tabula Rasa:** Se realizará una limpieza total de las colecciones de Firestore y registros de contacto para iniciar desde cero con datos limpios y validados.

---

## 3. BLOQUES DE TRABAJO (Ventanas de Contexto Independientes)

### ✅ Bloque 1: Data Integrity & Connection Layer — COMPLETADO

#### ✅ Fase 1.1: Database Deep Audit (The Foundation)
*   **Estado:** ✅ Completada
*   **Reporte:** `.firebase/2do/Database_Audit_Report.md`

#### ✅ Fase 1.2: Connection Layer Audit (The Bridges)
*   **Estado:** ✅ Completada
*   **Reporte:** `.firebase/2do/Connection_Layer_Audit_Report.md`

#### ✅ Fase 1.3: Remediación del Bloque 1
*   **Estado:** ✅ Completada — Todos los cambios aprobados aplicados en `supabase.js`, `App.jsx`, `useAIProcessor.js`.

---

### 🔵 Bloque 2: Architecture Deep Audit (Refactorización del Sistema) — ACTIVO
*   **Meta:** Revisión absoluta de la UI y Lógica de Negocio para detectar acoplamiento excesivo, lógica de negocio mezclada con renderizado, y re-renders innecesarios.
*   **Workflow:** `/arquiaudit`
*   **Foco Principal Conocido:** `App.jsx` tiene 865 líneas con lógica de negocio mezclada con UI. Es el candidato principal de refactorización.
*   **Archivos a Auditar (Alcance Inicial):**
    - `src/App.jsx` (componente raíz monolítico)
    - `src/components/` (árbol de componentes hijos)
    - `src/hooks/` (hooks de estado y lógica)
*   **Entregable:** `.firebase/2do/Architecture_Audit_Report.md`
*   **Checkpoint 2:** Reporte aprobado + código limpio y escalable.

---

### Bloque 3: AI Engine Recovery (Reparación de Gemini)
*   **Meta:** Restaurar y blindar el parser de WhatsApp.
*   **Workflow:** `/execode_v2`
*   **Checkpoint 3:** Parser funcionando al 100% con tests.

### Bloque 4: DevOps, GitHub & Deploy
*   **Meta:** Automatización y lanzamiento final.
*   **Workflow:** `/archi_v2`
*   **Checkpoint 4:** Sistema en vivo y estable.

---

## 4. PRÁCTICAS DE EJECUCIÓN Y MODELOS
*   **Modelos recomendados:**
    *   **Auditorías y Lógica:** **Claude Sonnet** (Primario) / Gemini Pro.
    *   **Tareas de Soporte/Docs:** Gemini Flash.

---

## 5. REGLA DE ORO: STOP-ON-FAILURE
Ante cualquier error técnico o duda de negocio, el agente se detendrá, explicará la situación en lenguaje no-técnico y esperará aprobación. No se permiten "parches rápidos".

---
**Plan actualizado al cierre del Bloque 1. Listo para Bloque 2.**
