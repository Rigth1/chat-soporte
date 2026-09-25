# Diseño Técnico y Justificación (Trade-offs)

## 1. Mecanismo de Tiempo Real: WebSockets (Socket.io)
- **Decisión:** Se eligió **Socket.io** sobre Server-Sent Events (SSE) o Polling.
- **Justificación:** El chat requiere comunicación bidireccional y en tiempo real con baja latencia. WebSockets mantiene una conexión persistente sobre TCP, permitiendo que tanto el cliente como el agente envíen y reciban eventos instantáneamente sin la sobrecarga de cabeceras HTTP repetitivas del polling.

## 2. Garantía de Orden de los Mensajes
- **Decisión:** Ordenamiento cronológico basado en el `timestamp` asignado por el servidor al momento de recibir e insertar el mensaje en MySQL, complementado por la secuencia autoincrementable de la base de datos (`id`).
- **Justificación:** Aunque el cliente puede enviar un timestamp local, confiar en el reloj del servidor evita discrepancias de tiempo entre diferentes dispositivos de los usuarios y garantiza un flujo visual idéntico para ambos participantes.

## 3. Desconexiones y Deduplicación (Reconexiones)
- **Decisión:** Uso de un identificador único generado en el cliente (`message_uuid` de tipo UUID v4) por cada mensaje y persistencia obligatoria en MySQL con restricción `UNIQUE`.
- **Justificación:** Si un cliente pierde conexión a mitad del envío y se reconecta, el sistema puede reintentar enviar el paquete. El backend valida si el `message_uuid` ya existe en la base de datos; si ya existe, lo ignora (evitando duplicados) y devuelve un ACK de confirmación. Al consultar el historial desde MySQL al reconectar, el usuario recupera toda la conversación sin pérdidas.

## 4. Contrato de Comunicación (API y WebSockets)
- **HTTP REST - Autenticación:**
  - `POST /api/login`: Valida credenciales del usuario y retorna un token JWT junto con los datos del usuario y su rol (`customer` o `agent`).
- **Eventos de WebSockets (Socket.io):**
  - `message:send`: El cliente emite `{ toUserId, content, message_uuid }`.
  - `message:new`: El servidor emite al destinatario el mensaje guardado con `created_at`, `id` y `message_uuid`.
  - `message:ack`: Confirmación enviada al emisor indicando que el mensaje fue procesado, guardado o detectado como duplicado.
  - `message:history`: El cliente solicita el historial con `{ withUserId }` y recibe una lista ordenada cronológicamente.
  - `message:error`: El servidor comunica errores de validación o persistencia.

## 5. Arquitectura de Contenedores y Despliegue (Docker)
- **Decisión:** Contenerizar tanto la base de datos (MySQL 8.0) como el backend (Node.js + WebSockets) utilizando Docker y Docker Compose.
- **Justificación:** Garantiza la portabilidad del entorno de desarrollo y pruebas, evitando el problema clásico de "en mi máquina sí funciona". 
- **Configuración Clave:**
  - **Healthcheck en MySQL:** Se implementó un control de salud (`mysqladmin ping`) para asegurar que el backend espere de forma segura a que la base de datos acepte conexiones antes de arrancar (`condition: service_healthy`), evitando fallos de red por tiempos de inicio.
  - **Volúmenes persistentes:** El volumen `mysql_data` asegura que los datos no se pierdan al apagar los contenedores.
  - **Variables de Entorno:** Se inyectan de forma dinámica a través del entorno de Docker Compose para separar la configuración del código fuente.