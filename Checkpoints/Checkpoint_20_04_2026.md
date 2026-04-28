# 🔖 CHECKPOINT — AppyTET v5
**Fecha:** 20/04/2026  
**Conversación ID:** f635b4a6-5a25-4ac9-88f5-517bbee4163e  
**Estado General:** 🟡 Fase de Datos: Casi Completa | Fase de App: Pendiente

---

## 1. OBJETIVO DE ESTA SESIÓN

Unificar y corregir la base de datos de productos de la App AppyTET v5, que tenía datos corruptos en Supabase (valores de tasas desplazados, textos de puntos de encuentro incorrectos, campos vacíos). El objetivo final es que la App genere Vouchers automáticamente con la información correcta de la `utfTabla de productos 140426.csv`, sin intervención manual.

---

## 2. ARQUITECTURA DEL SISTEMA (Mapa de Archivos Clave)

| Archivo | Rol | Estado |
| :--- | :--- | :--- |
| `data_source/CSV utfTabla de productos 140426.csv` | **FUENTE DE VERDAD ABSOLUTA** de logística | ✅ Intacto |
| `src/data/production_snapshot.json` | Snapshot de Supabase (79 productos) | ✅ Capturado |
| `src/data/final_master_catalog.json` | Catálogo unificado y corregido | 🟡 Generado, con bugs pendientes |
| `scripts/build_master_unified.mjs` | Script que une CSV + Snapshot → Catalog | 🟡 V8 (bugs de match pendientes) |
| `scripts/upload_to_supabase.mjs` | Script que sube el catálogo a Supabase | ✅ Listo para usar |
| `src/components/VoucherPreview.jsx` | Componente React que renderiza el Voucher | 🟡 Parcialmente actualizado |
| `.firebaserc` | Config de entornos Firebase | ✅ Tiene `dev` y `production` |

---

## 3. ESTRUCTURA CONFIRMADA DEL VOUCHER

Basada en imagen aportada por el usuario y código de `VoucherPreview.jsx`:

```
╔══════════════════════════════════════════════════════╗
║  [LOGO]    Voucher The Experience Travel             ║
╠══════════════════════════════════════════════════════╣
║  Titular da reserva: [NOMBRE]                        ║
║  Número de pessoas: [PAX]                            ║
╠══════════════════════╦═══════════════════════════════╣
║  Data: [FECHA]       ║  Hora: [HORA]                 ║
╠══════════════════════╬═══════════════════════════════╣
║  Tour: [PASSEIO]     ║  Valor a pagar: [VALOR/PAGO]  ║
╠══════════════════════╬═══════════════════════════════╣
║  Local: [TEXTO LARGO ║  Valor Taxas: COP XX.XXX em   ║
║  de instrucciones]   ║  pesos colombianos por pessoa ║
║                      ║  (somente dinheiro) -         ║
║                      ║  sujeito a alteração          ║
╠══════════════════════╩═══════════════════════════════╣
║  Obs: [TEXTO DE OBSERVACIONES]                       ║
╠══════════════════════════════════════════════════════╣
║  📞 (55) 11 981758504 | www.thexperiencetravel.com   ║
╚══════════════════════════════════════════════════════╝
```

**Mapeo de Campos (App → Base de Datos):**
| Campo del Voucher | Campo en Supabase | Fuente |
| :--- | :--- | :--- |
| Hora | `time` | CSV utfTabla → columna "Local e hora" (extrae la hora) |
| Local | `meet_point` | CSV utfTabla → columna "Dica" (texto descriptivo completo) |
| Valor Taxas | `fees_info` | Generado con formato estándar |
| Valor numérico de tasa | `fees_value` | CSV utfTabla → columna "Taxas" |
| Observaciones | `voucher_obs` | Lógica por tipo de tour |

**Formato OBLIGATORIO de Tasas:**
```
Valor Taxas: COP XX.XXX em pesos colombianos por pessoa (somente dinheiro) - sujeito a alteração
```

---

## 4. BUGS ENCONTRADOS Y SU ESTADO

### BUG CRÍTICO 1 — Datos Corruptos en Supabase por Parser CSV Roto ✅ DIAGNOSTICADO / 🔴 AÚN EN SUPABASE
**Síntoma:** Varios productos tenían valores de campos desplazados. El valor de la tasa (ej: `37500`) estaba en el campo `time`, y el campo `fees_value` tenía un número de un solo dígito (ej: `7`).

**Causa Raíz:** El script original de importación no manejaba correctamente las líneas del CSV que estaban envueltas en comillas dobles externas (formato `"campo1,campo2,..."`). Esto causaba que las columnas se "corrieran" una posición.

**Productos Confirmados Afectados:**
- `Capri Premium` (PROD-021): `time: "37500"`, `fees_value: 7`, `price_cost: 0`
- `Isla Palma` (PROD-055): similar
- `Corona Island` (PROD-020): `fees_value: 8`

**Solución Aplicada:** Script `build_master_unified.mjs` V8 que:
1. Detecta líneas con comillas externas y las limpia antes de parsear.
2. Prioriza los datos de `utfTabla` sobre los de Supabase.

**Estado:** El `final_master_catalog.json` tiene los datos corregidos. **Supabase aún no ha sido actualizado.**

---

### BUG 2 — `fees_info` No Actualizado por el Script V8 🔴 PENDIENTE
**Síntoma:** El campo `fees_info` de `Rosario de Mar` (y posiblemente otros) en `final_master_catalog.json` conserva el texto viejo de Supabase con errores:
- `"Pagar a taxas portuarias COP29;000(valor por persona – solamente em dinero. Valor sujeto a alteraçooes)"`
- Errores: punto y coma en lugar de punto, texto en español mezclado, acentos incorrectos.

**Causa Raíz:** El script V8 no sobreescribe `fees_info` cuando el producto ya tiene un match en Supabase (lo regenera solo si hay un match con la utfTabla). Los productos que no hicieron match en la utfTabla pasan al catálogo final con el `fees_info` corrupto de Supabase.

**Solución Propuesta (NO APLICADA):**
El script debe forzar la regeneración del `fees_info` con el formato estándar para **todos** los productos que tengan `fees_value > 0`, independientemente de si hubo match con la utfTabla:
```javascript
// Lógica correcta para TODOS los productos:
const fees_info = fees_value > 0 
  ? `Valor Taxas: COP ${formatCOP(fees_value)} em pesos colombianos por pessoa (somente dinheiro) - sujeito a alteração`
  : '';
```

---

### BUG 3 — Match de Nombres Fallando (Rosario de Mar y otros) 🔴 PENDIENTE
**Síntoma:** El script `build_master_unified.mjs` no está encontrando el match entre `"Rosario De Mar"` (nombre en Supabase) y el nombre en `utfTabla`. Esto hace que el producto pase al catálogo final sin actualizar su logística desde el CSV.

**Evidencia:** El campo `meet_point` de `Rosario De Mar` en el catálogo final es `"Apresentar-se na porta 04 da Marina la Bodeguita."` (texto simple de `products_master.csv`), no el texto descriptivo completo de `utfTabla`.

**Causa Raíz:** El nombre en la `utfTabla` probablemente tiene tilde (`Rosário de Mar`) mientras que en Supabase está sin tilde (`Rosario De Mar`). La función `normalize()` del script debería manejar esto, pero el alias en el script está configurado como `"rosario de mar": "rosário de mar"` (minúsculas), mientras que en Supabase el nombre es `"Rosario De Mar"` (con mayúsculas iniciales).

**Solución Propuesta (NO APLICADA):**
1. Verificar en la `utfTabla` cómo exactamente está escrito el nombre del tour.
2. Ajustar la función `normalize()` o los `aliases` del script para asegurar el match.

---

### BUG 4 — Supabase Aún Tiene Datos Corruptos 🔴 PENDIENTE (Bloqueante)
**Estado:** El script `upload_to_supabase.mjs` está listo, pero la subida **no se ha ejecutado** porque el `final_master_catalog.json` aún tiene los bugs 2 y 3 arriba descritos. Subir el catálogo con bugs reemplazaría los datos de Supabase con datos incorrectos.

---

### BUG 5 — VoucherPreview.jsx Parcialmente Actualizado 🟡 PARCIAL
**Cambios aplicados en esta sesión:**
- `t.Hora` → Ahora también lee de `t.time` (retrocompatible).
- `t.Local` → Ahora prioriza `t.meet_point` (campo de Supabase).
- `t.Taxas_valor` → Ahora prioriza `t.fees_info` (texto completo de Supabase).
- `defaultObs` → Ahora también lee de `t.voucher_obs`.

**Pendiente:**
- Verificar que el campo `time` de Supabase se mapea correctamente al campo `t.time` que ahora usa el componente.
- Probar en `localhost` con el servidor `npm run dev` que ya está corriendo.

---

## 5. ENTORNOS DISPONIBLES

| Entorno | Proyecto Firebase | URL | Uso |
| :--- | :--- | :--- | :--- |
| **Desarrollo** | `appytet-v5-dev-9182` | Link de Dev | Pruebas seguras |
| **Producción** | `appytet-34f3f` | App real de clientes | 🚨 No tocar hasta validar |

**Supabase:** Un único proyecto compartido. Actualizar Supabase afecta **ambos entornos** (Dev y Prod).

---

## 6. NEXT STEPS (En Orden Estricto)

### Paso 1 — Corregir el Script V8 (ANTES de subir nada)
**Objetivo:** Asegurar que `fees_info` se regenera con el formato estándar para TODOS los productos con `fees_value > 0`, y que el match de "Rosario de Mar" y otros nombres con tilde funciona correctamente.

**Acción:** En el próximo chat, abrir `/execode_v2` y pedir:
> "Corrige el script `build_master_unified.mjs` para que: 1) `fees_info` siempre se regenere con el formato estándar para cualquier producto con `fees_value > 0`, sin importar si hubo match con la utfTabla. 2) Verifica que el nombre `Rosario De Mar` de Supabase hace match con el nombre correspondiente en la utfTabla. 3) Ejecuta el script y muéstrame la verificación rápida de Capri Premium, Bora Bora Club, Rosario De Mar y Pa'ue."

---

### Paso 2 — Validar el `final_master_catalog.json` Manualmente
**Objetivo:** Antes de subir, confirmar los valores clave.

Verificar en `src/data/final_master_catalog.json`:
| Producto | fees_value | fees_info | meet_point | time |
| :--- | :--- | :--- | :--- | :--- |
| Capri Premium | 37.500 | formato estándar ✓ | texto largo de dica | 07:30 |
| Bora Bora Club | 40.500 | formato estándar ✓ | texto largo de dica | 07:30 |
| Rosario De Mar | 29.000 | formato estándar ✓ | texto largo de dica | 08:15 |
| Pa'ue | 37.500 | formato estándar ✓ | texto largo de dica | 07:30 |
| Isla Palma | 37.500 | formato estándar ✓ | texto largo de dica | 05:45 |

---

### Paso 3 — Ejecutar la Subida a Supabase
```bash
node scripts/upload_to_supabase.mjs
```
> ⚠️ Este comando afectará la App de producción. Ejecutar solo después de validar el catálogo en el Paso 2.

---

### Paso 4 — Probar en Local
Con `npm run dev` activo (ya está corriendo):
1. Abrir `http://localhost:5173`
2. Crear una reserva de prueba con **Capri Premium** para 2 pax.
3. Generar el PDF del Voucher.
4. Confirmar que la hora, el local, las tasas y las observaciones son correctas.

---

### Paso 5 — Deploy a Dev (Opcional)
```bash
firebase use default
npm run build
firebase deploy
```

---

### Paso 6 — Deploy a Producción (Solo si todo está OK)
```bash
firebase use production
npm run build
firebase deploy
```

---

## 7. ESTADO FINAL DE ARCHIVOS MODIFICADOS EN ESTA SESIÓN

| Archivo | Tipo de Cambio | Seguro para Producción |
| :--- | :--- | :--- |
| `scripts/build_master_unified.mjs` | Creado (V8) | Solo genera JSON local, no afecta Prod |
| `scripts/upload_to_supabase.mjs` | Creado | Afecta Prod si se ejecuta |
| `src/data/final_master_catalog.json` | Generado | Solo es un archivo local |
| `src/components/VoucherPreview.jsx` | Modificado (retrocompatible) | ✅ Retrocompatible, no rompe nada |
| **Supabase (nube)** | **NO MODIFICADO** | ✅ Producción intacta |

---

## 8. COMANDOS DE REFERENCIA RÁPIDA

```bash
# Generar catálogo local corregido:
node scripts/build_master_unified.mjs

# Subir catálogo a Supabase (afecta producción):
node scripts/upload_to_supabase.mjs

# Servidor de desarrollo local:
npm run dev

# Deploy a Dev:
firebase use default && npm run build && firebase deploy

# Deploy a Producción:
firebase use production && npm run build && firebase deploy
```
