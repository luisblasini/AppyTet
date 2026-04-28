# 🚀 AppyTET v5 - The Experience Travel

Sistema integral de gestión de reservas, vouchers y automatización de operaciones turísticas para **The Experience Travel**.

## 📋 Descripción
AppyTET es una aplicación de última generación diseñada para optimizar el flujo de trabajo de la agencia. Permite la gestión centralizada de tours, procesamiento de pagos, generación de vouchers profesionales y sincronización de datos con inteligencia artificial.

## 🛠️ Stack Tecnológico
- **Frontend:** React 19 + Vite 7
- **Base de Datos:** 
  - **Supabase:** Motor principal para precios y lógica relacional.
  - **Firebase:** Hosting y persistencia de documentos.
- **IA:** Google Gemini AI (Integrado para procesamiento de textos y vouchers).
- **Estilos:** Vanilla CSS / Lucide React para iconografía.

## 📁 Estructura del Proyecto
- `/src`: Código fuente de la aplicación (Componentes, Hooks, Datos).
- `/scripts`: Herramientas de automatización para migración y limpieza de catálogos.
- `/data_source`: Documentación base, PDFs y archivos maestros de productos.
- `/public`: Activos estáticos y logos.

## 🚀 Instalación y Desarrollo
1. Clonar el repositorio.
2. Instalar dependencias: `npm install`
3. Configurar variables de entorno en un archivo `.env` (No incluido en el repo por seguridad).
4. Iniciar servidor local: `npm run dev`

## 🛡️ Flujo de Trabajo (Estándar Profesional)
Para mantener la integridad del sistema:
1. Las nuevas funciones se desarrollan en ramas secundarias.
2. Los commits deben seguir el formato: `tipo: descripción corta` (ej: `feat: agregar vista de finanzas`).
3. La rama `main` siempre debe ser funcional y lista para producción.

---
© 2026 The Experience Travel. Todos los derechos reservados.
