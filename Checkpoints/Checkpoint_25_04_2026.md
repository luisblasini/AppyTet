# 🔖 CHECKPOINT — AppyTET v5
**Fecha:** 25/04/2026 (23:15H)
**Estado General:** 🔴 Entorno Local Inestable | 🟢 Producción Restaurada vía Firebase (Pendiente de confirmación)

---

## 1. RESUMEN DE LA SITUACIÓN ACTUAL
La aplicación sufrió una regresión en su última actualización donde el motor de Inteligencia Artificial (Gemini) dejó de reconocer y extraer correctamente los datos de las reservas desde los mensajes de WhatsApp. 

Adicionalmente, el entorno de desarrollo local (Vite) en Windows presentó problemas severos de red (puertos bloqueados, procesos zombis), impidiendo realizar pruebas de manera eficiente.

## 2. ACCIONES DE CONTINGENCIA TOMADAS
Se decidió abortar temporalmente los intentos de hacer un "fix forward" (arreglar y subir inmediatamente) debido al alto riesgo.
La estrategia de emergencia implementada fue:
- **Rollback Inmediato en Producción:** Restaurar la última versión funcional directamente desde la consola web de Firebase Hosting. Esto elimina el impacto negativo sobre los clientes sin necesidad de manipular código en el equipo local.

## 3. PRÓXIMOS PASOS (NEXT STEPS) - PARA LA SIGUIENTE SESIÓN
Cuando se retome el trabajo, se procederá con el siguiente plan de acción estructurado:

1. **Implementación Estricta de Control de Versiones (Git):**
   - Inicializar/Configurar correctamente el repositorio Git en la carpeta del proyecto.
   - Asegurarnos de tener un árbol de historial limpio para poder realizar "deshaceres" rápidos a nivel de código sin depender de intervenciones manuales.

2. **Reparación del Entorno Local:**
   - Liberar puertos bloqueados (`npx vite --port 8080` u otros puertos limpios).
   - Asegurar que el entorno de desarrollo sea un fiel reflejo de la arquitectura de la aplicación sin colisiones de red.

3. **Auditoría y Corrección del Motor IA (Gemini Parser):**
   - Revisar los cambios introducidos en la versión fallida.
   - Solucionar por qué el sistema reporta que "no reconoce el mensaje" a pesar de recibir el string de texto de WhatsApp correcto.
   - Reforzar el manejo de errores (fallback) en caso de que el esquema JSON devuelto por Gemini venga corrupto.

4. **Validación y Nuevo Despliegue:**
   - Probar exhaustivamente el flujo de reserva en local (staging mode) contra Supabase.
   - Solo al tener certeza absoluta, realizar el nuevo despliegue a producción.

---
*Nota para el Agente:* Al reiniciar la sesión, consultar inmediatamente este checkpoint y priorizar la configuración del entorno Git local antes de escribir cualquier código nuevo.
