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
const users = {}; // 🔄 Kullanıcı adı -> socket.id eşlemesi

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
  console.log('🔌 Bağlantı:', socket.id);

  // 💾 Kullanıcıyı kaydet
  socket.on("register", (username) => {
    users[username] = socket.id;
    console.log(`${username} kayıt oldu (${socket.id})`);
  });

  socket.on('sendMessage', (data) => {
    const { username, message } = data;
    io.emit('receiveMessage', { username, message });
  });

  socket.on('typing', () => {
    socket.broadcast.emit('showTyping');
  });

  // 📞 Arama başlat
  socket.on('callUser', (data) => {
    const targetSocketId = users[data.toUsername]; // 🔍 kullanıcı adına göre ID al
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
