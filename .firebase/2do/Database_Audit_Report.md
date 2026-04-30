# Database Audit & Remediation Report

## Executive Summary (CoT):
He realizado una inmersión profunda en la capa de persistencia actual, contrastando el Catálogo Maestro (`final_master_catalog.json`) con la estructura de Supabase inferida a través del adaptador de base de datos (`src/supabase.js`). 
Mi razonamiento (Chain of Thought) se enfocó en detectar discrepancias de mapeo entre los objetos de la aplicación y la persistencia en SQL, identificar vulnerabilidades lógicas en los *upserts* y detectar *Silent Failures* que causarían pérdida de datos en el largo plazo.
**El estado actual es de Riesgo Alto**. Existen discrepancias graves entre lo que el front-end asume que se guarda y lo que realmente se inserta en Supabase. Si pasamos a producción con este mapeo, habrá pérdida silenciosa de datos vitales (como el estado de los productos y datos extendidos de los contactos).

## Deep Technical Audit:

### Análisis de Estructura:
1. **Tabla `products` (Catálogo vs Supabase):** 
   - El catálogo maestro posee campos vitales como `status` (ej. "active", "tariff_only") y `voucher_obs` (instrucciones críticas para el voucher). 
   - **Silent Failure:** La función `toSupabaseProduct()` en `supabase.js` **no mapea** ni `status` ni `voucher_obs`. Cualquier actualización desde la UI a Supabase sobrescribirá o ignorará estos campos, corrompiendo la fuente de la verdad en la base de datos.
2. **Tabla `contacts`:**
   - **Silent Data Loss:** La UI envía datos completos del pasajero (dirección, CEP, fecha de nacimiento, Instagram, ciudad), pero `upsertContactSupabase()` **solo guarda**: `name`, `phone`, `cpf`, `email`, `passport`. Los demás datos se pierden en el insert/update, aunque luego `getConfirmationsFromSupabase()` intente leerlos.
3. **Tabla `bookings` y `booking_items`:**
   - Hay redundancia y desnormalización peligrosa. Por ejemplo, `hotel` se guarda tanto en `metadata` de `bookings` como en cada `booking_items`. Si un cliente cambia de hotel para un tour específico, la jerarquía es confusa.
   - El campo `instagram` se guarda dentro de `metadata` del booking, pero la función de historial intenta leerlo desde `contacts.instagram` (el cual no se guardó).

### Mapa de Relaciones:
- **`contacts` -> `bookings` (1:N):** Relación gestionada a través de `contact_id`.
- **`bookings` -> `booking_items` (1:N):** Gestionada mediante `booking_id` con eliminación en cascada manual simulada en código antes de hacer un update.
- **Riesgo en Upsert de `contacts`:** El código usa `{ onConflict: 'cpf' }` para actualizar contactos. **Vulnerabilidad Crítica:** Si dos pasajeros internacionales no proporcionan `cpf` (y se envía como *null* o string vacío ""), Supabase intentará hacer match con el registro vacío anterior, fusionando erróneamente contactos distintos en uno solo.

### Identificación de Bugs/Leaks:
1. **Pérdida de campos en Products:** `status` y `voucher_obs` se leen en GET, pero se omiten en INSERT/UPDATE.
2. **Pérdida de campos en Contacts:** `address`, `cep`, `dob`, `city`, `instagram` no se persisten.
3. **Colisión de Identidad (Race Condition lógica):** `upsertContactSupabase` basado estrictamente en `cpf` fallará para extranjeros o contactos sin CPF, sobreescribiendo datos cruzados.
4. **Delete/Insert en cascada desde Frontend:** Al actualizar un booking, el frontend borra explícitamente (`delete`) todos los `booking_items` para recrearlos. Esto puede dejar bookings sin items si la red falla a la mitad del proceso.


## Surgical Remediation Plan (The Blueprint):

### Propuesta de Cambio:

**1. Refactorización del adaptador `supabase.js` (Productos):**
```javascript
const toSupabaseProduct = (p) => ({
  name: p.Passeio || '',
  city: p.Ciudad || 'Cartagena',
  description: p.Descricao || '',
  price_sale: Number(p.Valor_venda_COP) || 0,
  price_cost: Number(p.Preco_custo_COP) || 0,
  price_entry: Number(p.ENTRADA) || 0,
  meet_point: p.Local || '',
  time: p.Hora || '',
  fees_value: Number(p.Taxas_valor) || 0,
  fees_info: p.Taxas_info || '',
  comments: p.Comentarios || '',
  has_variable_time: Boolean(p.hasVariableTime),
  status: p.status || 'active',           // [NUEVO]
  voucher_obs: p.voucher_obs || ''        // [NUEVO]
});
```

**2. Refactorización del adaptador `supabase.js` (Contactos):**
Cambiar el upsert para que incluya los campos faltantes, y cambiar el `onConflict` a un campo garantizado o manejar el chequeo de existencia por `phone` + `email` si `cpf` es null. 
```javascript
export const upsertContactSupabase = async (contact) => {
  // Manejo de identidad más robusto: Si no hay CPF, generar un ID virtual o usar el tlf.
  const conflictKey = contact.cpf ? 'cpf' : 'phone'; // Requiere ajuste en constraints de Supabase

  const { data, error } = await supabase
    .from('contacts')
    .upsert({
      name: contact.name,
      phone: contact.phone,
      cpf: contact.cpf || null,
      email: contact.email,
      passport: contact.passport,
      address: contact.address, // [NUEVO]
      cep: contact.cep,         // [NUEVO]
      dob: contact.dob,         // [NUEVO]
      city: contact.city,       // [NUEVO]
      instagram: contact.instagram // [NUEVO]
    }, { onConflict: conflictKey }) // Constraint debe adaptarse en BD
    // ...
};
```

**3. Migrar la cascada de Bookings a un Stored Procedure (RPC) o usar transacciones:**
Actualmente Supabase JS no soporta transacciones nativas desde el cliente. Para evitar que un error de red deje una reserva huérfana de ítems al hacer UPDATE, se debe habilitar `ON DELETE CASCADE` en la FK de `booking_items`, o manejar el borrado de ítems de forma atómica en el backend.

### Análisis de Impacto:
- **Seguridad y Consistencia:** Se preservará el 100% de la metadata en contactos y productos sin afectar el contrato actual con la UI.
- **Riesgo Colateral:** Modificar el `upsert` de contactos requerirá ajustar los índices/constraints `UNIQUE` en la base de datos de Supabase para no fallar cuando `cpf` sea nulo.
- **Aislamiento:** Los cambios propuestos solo tocan la capa de serialización (mapping) de `supabase.js`, por lo que los componentes de la aplicación no se enterarán del cambio, pero dejarán de perder datos silenciosamente.

## Checklist de Integridad para Validación:

- [ ] ¿El cambio mantiene la integridad referencial de los datos?
- [ ] ¿El cambio optimiza activamente el tiempo de respuesta (Latency)?
- [ ] ¿El cambio es retrocompatible con el código actual de la aplicación (Backwards Compatible)?
- [ ] ¿La estructura previene condiciones de carrera (Race Conditions) en alta concurrencia?
