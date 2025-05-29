const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
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
const users = {}; // { username: socket.id }
const socketToUser = {}; // { socket.id: username }

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
  console.log('🔌 Bağlandı:', socket.id);

  // Kullanıcı kaydı
  socket.on('register', (username) => {
    users[username] = socket.id;
    socketToUser[socket.id] = username;
    console.log(`${username} sisteme girdi.`);

    io.emit('userList', Object.keys(users)); // Tüm kullanıcılara listeyi gönder
  });

  // Mesaj gönderme
  socket.on('sendMessage', (data) => {
    const { from, to, message } = data;
    const toSocket = users[to];
    if (toSocket) {
      io.to(toSocket).emit('receiveMessage', { from, message });
      socket.emit('receiveMessage', { from, message }); // mesajı kendine de göster
    }
  });

  // Yazıyor bildirimi
  socket.on('typing', (to) => {
    const toSocket = users[to];
    if (toSocket) {
      io.to(toSocket).emit('showTyping', socketToUser[socket.id]);
    }
  });

  // 📞 Arama başlat
  socket.on('callUser', (data) => {
    const targetSocketId = users[data.toUsername];
    if (targetSocketId) {
      io.to(targetSocketId).emit('callIncoming', {
        from: socket.id,
        name: data.name,
        signal: data.signal,
      });
    }
  });

  // ✅ Arama kabul edildi
  socket.on('answerCall', (data) => {
    io.to(data.to).emit('callAccepted', data.signal);
  });

  // 🔁 Bağlantı koparsa
  socket.on('disconnect', () => {
    const username = socketToUser[socket.id];
    if (username) {
      delete users[username];
      delete socketToUser[socket.id];
      console.log(`${username} çıkış yaptı`);
      io.emit('userList', Object.keys(users));
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Sunucu ayakta: http://localhost:${PORT}`);
});
