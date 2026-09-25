# Chat Soporte en Tiempo Real

MVP de chat de soporte entre un cliente y un agente usando Vue 3, Quasar, Node.js, Express, Socket.IO, MySQL y Docker.

## Requisitos

- Docker Desktop o Rancher Desktop con Compose
- Node.js 20+ y npm para ejecutar el frontend en desarrollo

## Ejecutar backend y base de datos

Desde la raíz del proyecto:

```bash
docker compose up -d --build
```

Servicios disponibles:

- Backend y Socket.IO: `http://localhost:4000`
- Health check: `http://localhost:4000/api/health`
- MySQL: `localhost:3306`

Para detener los contenedores sin eliminar los datos:

```bash
docker compose down
```

## Ejecutar frontend

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

Abre `http://localhost:5173`.

## Credenciales demo

- Cliente: `customer@demo.com` / `customer123`
- Agente: `agent@demo.com` / `agent123`

El login guarda el JWT en `localStorage`. La conexión Socket.IO envía el token mediante `auth: { token }`.

## API y eventos

- `POST /api/login`: autentica al usuario y devuelve `token` y `user`.
- `message:history`: solicita el historial con `{ withUserId }`.
- `message:send`: envía `{ toUserId, content, message_uuid }`.
- `message:new`: entrega mensajes nuevos.
- `message:ack`: confirma mensajes enviados o duplicados.
- `message:error`: informa errores de validación o persistencia.

## Decisiones y trade-offs

- **Problema clásico de mensajes duplicados por reintentos de red:** En los chats en tiempo real, si el cliente pierde conectividad al enviar un mensaje, los mecanismos de reintento automático pueden duplicar los registros en el servidor. *Solución elegida:* Se implementó un `message_uuid` (generado como UUID v4 en el cliente) junto con una restricción `UNIQUE` en MySQL para garantizar la idempotencia y bloquear mensajes repetidos de forma nativa.
- **Comunicación en Tiempo Real:** Se seleccionó **Socket.IO** en lugar de consultas HTTP periódicas (*polling*) por su eficiencia en canales bidireccionales persistentes y su manejo robusto de reconexiones automáticas.
- **Persistencia de Historial:** Se utilizó **MySQL** para mantener la consistencia relacional de las conversaciones y ordenar los mensajes cronológicamente mediante `created_at` combinando el índice de `id`.
- **Alcance del MVP y Seguridad:** Se priorizó el uso de tokens JWT en `localStorage` para agilizar la integración del flujo de prueba entre cliente y agente. Como *trade-off* documentado, se señala que en un entorno de producción real se debe migrar a cookies seguras de tipo `HttpOnly`.

## Estructura

- `backend/`: API Express y servidor Socket.IO.
- `database/`: esquema y datos iniciales de MySQL.
- `frontend/`: aplicación Vue 3 + Quasar.
- `openspec/`: propuesta, diseño y tareas del cambio.
