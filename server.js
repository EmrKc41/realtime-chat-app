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

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const users = {};       // username -> socket.id
const sockets = {};     // socket.id -> username
const chatPairs = {};   // socket.id -> targetSocket.id

io.on('connection', (socket) => {
  console.log(`🔌 Yeni bağlantı: ${socket.id}`);

  // Kullanıcı kaydı
  socket.on('register', (username) => {
    users[username] = socket.id;
    sockets[socket.id] = username;
    console.log(`✅ Kayıt: ${username} -> ${socket.id}`);
    io.emit('userList', Object.keys(users)); // sohbet listesini güncelle
  });

  // Sohbet partneri belirle
  socket.on('setChatWith', (targetUsername) => {
    const partnerId = users[targetUsername];
    if (partnerId) {
      chatPairs[socket.id] = partnerId;
      console.log(`💬 ${sockets[socket.id]} artık ${targetUsername} ile sohbet ediyor.`);
    }
  });

  // Mesaj gönder
  socket.on('sendMessage', ({ username, message }) => {
    const partnerId = chatPairs[socket.id];
    if (partnerId) {
      io.to(partnerId).emit('receiveMessage', { username, message });
      socket.emit('receiveMessage', { username, message }); // kendi ekranına da yansıt
    }
  });

  // Yazıyor bildirimi
  socket.on('typing', () => {
    const partnerId = chatPairs[socket.id];
    if (partnerId) {
      io.to(partnerId).emit('showTyping');
    }
  });

  // Çağrı başlat
  socket.on('callUser', ({ signal }) => {
    const targetId = chatPairs[socket.id];
    if (targetId) {
      io.to(targetId).emit('callIncoming', {
        from: socket.id,
        name: sockets[socket.id],
        signal
      });
    }
  });

  // Çağrı kabul edildi
  socket.on('answerCall', ({ to, signal }) => {
    io.to(to).emit('callAccepted', signal);
  });

  // Bağlantı koparsa
  socket.on('disconnect', () => {
    const username = sockets[socket.id];
    if (username) {
      delete users[username];
    }
    delete sockets[socket.id];
    delete chatPairs[socket.id];
    io.emit('userList', Object.keys(users));
    console.log(`❌ ${username || socket.id} bağlantısı koptu`);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Sunucu ayakta: http://localhost:${PORT}`);
});
