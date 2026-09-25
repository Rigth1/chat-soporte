# Plan de Tareas - Chat de Soporte

- [x] **Fase 1: Base de Datos**
  - [x] Crear el script SQL `database/init.sql` con las tablas `users` y `messages` (incluyendo `message_uuid`).
- [x] **Fase 2: Backend (Node.js + WebSockets)**
  - [x] Inicializar proyecto Node.js, configurar Express, CORS y dotenv.
  - [x] Configurar la conexión a MySQL con `mysql2`.
  - [x] Implementar endpoint de Login básico con generación de Token JWT.
  - [x] Configurar servidor HTTP y acoplar Socket.io con autenticación por token.
  - [x] Implementar eventos de Socket.io para envío, validación de `message_uuid` (deduplicación), persistencia en MySQL y retransmisión al destinatario.
- [x] **Fase 3: Frontend (Vue 3 + Quasar)**
  - [x] Inicializar proyecto Quasar/Vue 3.
  - [x] Crear vista de Login (`LoginPage.vue`) conectada al JWT del backend.
  - [x] Crear interfaz de chat estilo WhatsApp (`ChatPage.vue`) usando componentes de Quasar (`QChatMessage`, `QInput`, etc.).
  - [x] Integrar `socket.io-client` para conectar en tiempo real y actualizar el estado local de los mensajes sin recargar la página.
- [x] **Fase 4: Documentación**
  - [x] Redactar el `README.md` principal con instrucciones claras de ejecución y la sección de "Decisiones y Trade-offs".