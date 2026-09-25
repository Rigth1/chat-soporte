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

- Socket.IO permite comunicación bidireccional y reconexión sencilla.
- MySQL conserva el historial y ordena los mensajes por `created_at` e `id`.
- `message_uuid` generado como UUID v4 en el cliente y una restricción `UNIQUE` evitan duplicados tras reintentos.
- El MVP usa credenciales demo y un destinatario fijo por rol; la selección de conversaciones queda para una iteración posterior.
- El JWT se almacena en `localStorage` para simplificar el flujo de desarrollo local. En producción debe revisarse la estrategia de almacenamiento y rotación de tokens.

## Estructura

- `backend/`: API Express y servidor Socket.IO.
- `database/`: esquema y datos iniciales de MySQL.
- `frontend/`: aplicación Vue 3 + Quasar.
- `openspec/`: propuesta, diseño y tareas del cambio.
