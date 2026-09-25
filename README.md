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

## Problema Clásico: Orden, Concurrencia y Entrega de Mensajes

- **¿Qué pasa si un mensaje llega duplicado por una reconexión?:** Se implementó una estrategia de **idempotencia basada en cliente con deduplicación por `message_uuid` (UUID v4)**. Si una inestabilidad de red provoca que el cliente reenvíe un mensaje, la base de datos (respaldada por una restricción `UNIQUE` en el campo del UUID) o el backend identifican el identificador único y descartan el reenvío, evitando registros duplicados.
- **¿Qué pasa si dos mensajes llegan casi al mismo tiempo y cómo se garantiza el orden?:** Para evitar desincronizaciones por diferencias en los relojes de los dispositivos de los usuarios, **el servidor actúa como la autoridad temporal absoluta**. Cuando los mensajes arriban al backend de forma concurrente, se persisten en MySQL asignándoles un identificador autoincremental (`id`) y un timestamp de creación (`created_at`). El historial se consulta y se renderiza aplicando un orden estricto por `created_at ASC, id ASC`, garantizando que ambos participantes vean exactamente la misma línea de tiempo cronológica.
- **¿Qué mecanismo de tiempo real usaste y por qué?**
   - **Solución:** **Socket.IO (sobre WebSockets)**.
   - **Por qué:** Se descartó el *polling* tradicional debido a su alto costo de procesamiento y latencia, y Server-Sent Events (SSE) por ser una tecnología estrictamente unidireccionales. Se seleccionó Socket.IO porque provee un canal bidireccional persistente de baja latencia, reconexión automática integrada, facilidades de gestión de eventos con ACKs y aislamiento de chats mediante salas.
- **¿Cómo desplegarías esto en producción (enfoque y escalabilidad)?**
   - **Infraestructura Core:** Los contenedores Docker del backend se desplegarían en un servicio administrado de contenedores (como AWS ECS, Google Cloud Run o un clúster de Kubernetes) expuestos detrás de un Balanceador de Carga (Application Load Balancer).
   - **Escalamiento horizontal de conexiones en tiempo real:** Como las conexiones de WebSockets mantienen un estado persistente (mantienen el socket abierto), escalar a múltiples instancias del servidor requiere solucionar el enrutamiento de eventos. Esto se resuelve implementando **Sticky Sessions** en el balanceador de carga y acoplando un adaptador de pub/sub como **Redis Adapter (`@socket.io/redis-adapter`)**, el cual permite sincronizar los eventos de Socket.IO de manera transparente entre todos los nodos o réplicas activas del backend en la nube.
---