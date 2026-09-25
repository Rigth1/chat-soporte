require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createServer } = require("http");
const { Server } = require("socket.io");

const { execute } = require("./config/database");

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || "chat-soportee-dev-secret";

app.use(cors());
app.use(express.json());

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "chat-soportee-backend",
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "Email y password son requeridos." });
    }

    const [rows] = await execute(
      "SELECT id, name, email, password_hash, role FROM users WHERE email = ? LIMIT 1",
      [String(email).trim().toLowerCase()]
    );

    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: "Credenciales inválidas." });
    }

    const validPassword = await bcrypt.compare(String(password), user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ message: "Credenciales inválidas." });
    }

    const token = signToken(user);

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "No se pudo iniciar sesión.",
      detail: error.code || error.message,
    });
  }
});

io.use((socket, next) => {
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return next(new Error("Token requerido"));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded;
    return next();
  } catch (error) {
    return next(new Error("Token inválido"));
  }
});

io.on("connection", (socket) => {
  const userId = String(socket.user.id);
  socket.join(userId);

  socket.emit("connected", {
    user: {
      id: socket.user.id,
      name: socket.user.name,
      email: socket.user.email,
      role: socket.user.role,
    },
  });

  socket.on("message:history", async ({ withUserId } = {}) => {
    if (!withUserId) {
      socket.emit("message:error", { message: "Debe indicar el usuario con quien chatear." });
      return;
    }

    try {
      const [rows] = await execute(
        `SELECT m.id, m.sender_id, m.receiver_id, m.content, m.message_uuid, m.created_at
         FROM messages m
         WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
         ORDER BY m.created_at ASC`,
        [Number(socket.user.id), Number(withUserId), Number(withUserId), Number(socket.user.id)]
      );

      socket.emit("message:history", rows);
    } catch (error) {
      console.error("History error:", error);
      socket.emit("message:error", { message: "No se pudo cargar el historial." });
    }
  });

  socket.on("message:send", async (payload = {}) => {
    const { toUserId, content, message_uuid } = payload;

    if (!toUserId || !message_uuid || !String(content || "").trim()) {
      socket.emit("message:error", { message: "Mensaje, destinatario y UUID son requeridos." });
      return;
    }

    try {
      const [duplicateRows] = await execute(
        "SELECT id FROM messages WHERE message_uuid = ? LIMIT 1",
        [message_uuid]
      );

      if (duplicateRows.length > 0) {
        socket.emit("message:ack", {
          message_uuid,
          duplicate: true,
          status: "duplicate",
        });
        return;
      }

      const cleanContent = String(content).trim();
      const senderId = Number(socket.user.id);
      const receiverId = Number(toUserId);

      const [result] = await execute(
        "INSERT INTO messages (sender_id, receiver_id, content, message_uuid) VALUES (?, ?, ?, ?)",
        [senderId, receiverId, cleanContent, message_uuid]
      );

      const createdMessage = {
        id: result.insertId,
        sender_id: senderId,
        receiver_id: receiverId,
        content: cleanContent,
        message_uuid,
        created_at: new Date().toISOString(),
      };

      io.to(userId).emit("message:ack", {
        ...createdMessage,
        status: "sent",
      });

      io.to(String(receiverId)).emit("message:new", createdMessage);
      io.to(userId).emit("message:new", createdMessage);
    } catch (error) {
      console.error("Message send error:", error);
      socket.emit("message:error", { message: "No se pudo enviar el mensaje." });
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${userId}`);
  });
});

async function startServer() {
  try {
    await execute("SELECT 1");
    console.log("Database connection OK");

    server.listen(PORT, () => {
      console.log(`Chat backend listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed at startup:", error.message);
    console.error("Check DB_HOST, DB_USER, DB_PASSWORD, and MySQL availability.");
    process.exit(1);
  }
}

startServer();
