const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
connectDB();
const Message = require('./models/Message');

require('dotenv').config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;
const users = {};

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
  console.log('🔌 Bağlandı:', socket.id);

  socket.on("register", (username) => {
    users[username] = socket.id;
    console.log(`${username} kayıt oldu (${socket.id})`);
  });

  socket.on('sendMessage', async (data) => {
  io.emit('receiveMessage', data);

  try {
    const newMessage = new Message({
      from: data.username,
      to: "public", // genel oda veya ileride kullanıcıya özelse dinamik yapabilirsin
      message: data.message
    });
    await newMessage.save();
    console.log("💾 Mesaj kaydedildi:", data.message);
  } catch (err) {
    console.error("❌ Mesaj kaydedilemedi:", err.message);
  }
});

  socket.on('typing', () => {
    socket.broadcast.emit('showTyping');
  });

  socket.on('startCall', (data) => {
    const from = socket.id;
    const targetSocket = Object.values(users).find(id => id !== from);
    if (targetSocket) {
      io.to(targetSocket).emit('incomingCall', {
        from: from,
        name: data.name,
        signal: data.signal
      });
    }
  });

  socket.on('answerCall', (data) => {
    io.to(data.to).emit('callAccepted', data.signal);
  });

  socket.on('disconnect', () => {
    for (let key in users) {
      if (users[key] === socket.id) {
        delete users[key];
        console.log(`${key} çıkış yaptı`);
        break;
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Sunucu ayakta: ${PORT}`);
});
