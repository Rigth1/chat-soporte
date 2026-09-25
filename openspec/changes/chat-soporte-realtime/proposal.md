# Propuesta: Chat de Soporte en Tiempo Real (Tipo WhatsApp)

## Problema
Se requiere construir un chat de soporte simple donde un cliente (usuario) envía mensajes, y un agente los recibe y responde en tiempo real o casi real, sin necesidad de recargar la página.

## Alcance / Mínimo Viable (MVP)
- Autenticación básica con JWT (sin encriptación compleja de base de datos para priorizar agilidad).
- Interfaz gráfica limpia y responsiva usando Vue 3 y Quasar Framework.
- Backend en Node.js con WebSockets (Socket.io) para comunicación bidireccional instantánea.
- Base de datos relacional (MySQL) para persistencia de usuarios y mensajes.
- Solución de problemas clásicos: deduplicación ante reconexiones y ordenamiento de mensajes.

## Fuera de Alcance (Por tiempo de la prueba)
- Roles múltiples avanzados o jerarquías complejas.
- Cifrado de extremo a extremo de los mensajes.