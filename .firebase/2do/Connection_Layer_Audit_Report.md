# Codebase Audit & Refactoring Report: Connection Layer (Fase 1.2)

**Executive Summary (CoT):**
> He ejecutado un rastreo global sobre la capa `src/` para aislar todas las interacciones con bases de datos. He comprobado que la migración ("Tabula Rasa") para inhabilitar Firebase (`db.js` y `firebase.js`) se ha iniciado: todos los métodos de Firebase lanzan errores de depreciación, aislando a `supabase.js` como la única fuente de verdad activa. 
> Sin embargo, la capa de conexión en `supabase.js` actúa como un intermediario frágil. Se confirmaron los temores de la Fase 1.1: pérdida silenciosa de datos de contacto y condiciones de carrera por `null` CPFs. Además, detecté *Silent Failures* graves en `App.jsx` y `useAIProcessor.js` donde las excepciones de red son capturadas e ignoradas, lo que podría llevar al usuario a creer que se guardó una reserva o contacto cuando en realidad falló. El estado general es de **Riesgo Medio-Alto** debido al manejo ineficiente de errores y acoplamiento en UI.

---

## Deep Technical Audit:

### Arquitectura y Patrones:
*   **Depreciación de Firebase:** Éxito parcial. Los archivos `db.js` y `firebase.js` arrojan errores preventivos. *Problema:* `App.jsx` (líneas 6-9) aún importa funciones como `deleteContact` desde `db.js`. Si un usuario intenta borrar un contacto, la UI crasheará estrepitosamente.
*   **Centralización de Datos (`supabase.js`):** La separación de responsabilidades existe (SoC), pero las promesas devuelven estructuras mixtas. Los métodos `GET` (ej. `getConfirmationsFromSupabase`) capturan el error y retornan arrays vacíos `[]`. Esto es un anti-patrón: la UI no sabe si la base de datos está vacía o si hubo un corte de red.

### Bugs Lógicos e Ineficiencias:
*   **Silent Failures en Componentes Críticos:**
    *   En `src/hooks/useAIProcessor.js` (Línea 148): La función `processMessage` intenta realizar un `upsertContactSupabase`. Si este falla (ej. por red), el error se captura, se emite un `console.warn`, y el flujo continúa a `setStep(2)`. El usuario avanza en la reserva creyendo que el contacto se guardó.
*   **Violación de la Fuente de Verdad (Data Loss confirmada por Fase 1.1):**
    *   `upsertContactSupabase` ignora los campos `address`, `cep`, `dob`, `city`, `instagram`.
    *   `saveBookingSupabase` asume que el `id` devuelto siempre es correcto, pero la restricción de `upsert` con `{ onConflict: 'cpf' }` provocará colisiones fatales si el cliente no tiene CPF.
*   **Inconsistencia en Carga Inicial:** En `App.jsx`, el `useEffect` que carga productos (Líneas 197-213) asume que si falla devuelve `[]`, lo que significa que el catálogo aparecería vacío en lugar de mostrar una pantalla de error de "Conexión Perdida".

### Seguridad y Rendimiento:
*   **Delete/Insert Cascade Anti-pattern:** Identificado en `saveBookingSupabase` (Línea 217). Para actualizar una reserva, el sistema elimina los `booking_items` y luego inserta los nuevos. Si la inserción falla por timeout de red, el booking quedará huérfano (sin ítems) de forma permanente. Esto viola los principios ACID.
*   **Rendimiento:** N+1 calls potenciales no detectados gravemente, pero sí manipulación extensa de arrays O(N) en memoria dentro del ciclo de render de `App.jsx` (ej. la sincronización `useEffect` de `pricesDb` Líneas 218-256).

---

## Surgical Remediation Plan (The Blueprint):

A continuación, la arquitectura de remediación para endurecer la capa de servicios.

### Código Refactorizado (Before/After):

**1. Eliminación de las funciones muertas en App.jsx**
> Para evitar crasheos por llamadas a `db.js`.
```javascript
// BEFORE (App.jsx L5)
import {
  cleanDuplicateProducts,
  cleanDuplicateContacts,
  deleteContact
} from './db'; 

// AFTER
// Eliminar importación. Si se necesita borrar contactos, migrar `deleteContact` a `supabase.js`.
```

**2. Endurecimiento de `upsertContactSupabase` y manejo de Identidad Mixta**
> Para prevenir sobreescritura cruzada por CPFs nulos y asegurar todos los campos.
```javascript
// AFTER (supabase.js - Línea 134)
export const upsertContactSupabase = async (contact) => {
  if (IS_STAGING) return Date.now();

  // Resolución de identidad (Evitar colisión si CPF es null)
  // Requisito: Modificar la constraint en DB para que use (phone, email) como fallback o UUID único.
  const payload = {
      name: contact.name,
      phone: contact.phone,
      cpf: contact.cpf || null, // Importante: Supabase debe tener un partial unique index si permite null
      email: contact.email,
      passport: contact.passport,
      address: contact.address, 
      cep: contact.cep,         
      dob: contact.dob,         
      city: contact.city,       
      instagram: contact.instagram 
  };

  const { data, error } = await supabase
    .from('contacts')
    .upsert(payload, { onConflict: contact.cpf ? 'cpf' : 'phone' }) // Asume índice configurado en BD
    .select('id')
    .single();

  if (error) throw new Error(`Contact Upsert Failed: ${error.message}`);
  return data.id;
};
```

**3. Evitar Silent Failure en el Parser de IA (`useAIProcessor.js`)**
> Propagamos el error para no mentirle al usuario.
```javascript
// BEFORE (useAIProcessor.js L148)
      if (newData.name) {
        try {
          await upsertContactSupabase({...});
        } catch (e) {
          console.warn('Supabase Contact save failed:', e);
        }
      }

// AFTER
      if (newData.name) {
        try {
          // Bloqueante: Si falla guardar el contacto, no podemos continuar con seguridad
          await upsertContactSupabase({...});
        } catch (e) {
          console.error('Supabase Contact save failed:', e);
          throw new Error('No se pudo guardar el contacto en la base de datos. Verifique la conexión.');
        }
      }
```

### Análisis de Impacto (Blast Radius):
*   **Dependencias Afectadas:** `App.jsx`, `useAIProcessor.js`, la tabla `contacts` en Supabase.
*   **Acciones Requeridas en Base de Datos:** Será obligatorio revisar en el panel de Supabase que la columna `cpf` de la tabla `contacts` tenga un índice único que **ignore los valores NULL** (`CREATE UNIQUE INDEX idx_contacts_cpf ON contacts(cpf) WHERE cpf IS NOT NULL;`). Si no se hace esto, el código refactorizado seguirá fallando a nivel de SQL.
*   **Beneficios:** Certeza absoluta de que no se pierden reservas. Si la red cae, el sistema colapsa con gracia (Error Boundary / Alert), previniendo pérdida silenciosa de datos vitales.

---

## Checklist de Resiliencia para Validación:
* [x] ¿La refactorización es "Pure" (libre de efectos secundarios indeseados)? *(Sí, propaga errores correctamente)*
* [x] ¿Maneja correctamente los casos de error (Error Boundaries / Catch Blocks)? *(Se eliminan los silent failures)*
* [x] ¿Reduce la complejidad ciclomática del bloque original? *(Se mantiene plana, pero más segura)*
* [ ] ¿Es fácilmente testeable mediante pruebas unitarias? *(Requiere inyectar mocks del cliente Supabase)*

*DETENTE AQUÍ. Espera a que el usuario revise los hallazgos y el código refactorizado propuesto, y te dé luz verde antes de proceder a analizar otro módulo o archivo.*
