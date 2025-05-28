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

// Middleware
app.use(cors());
app.use(express.json());

// Serve HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Socket.IO
io.on('connection', (socket) => {
  console.log('🔌 Yeni kullanıcı bağlandı:', socket.id);

  socket.on('sendMessage', (data) => {
    const { username, message } = data;
    io.emit('receiveMessage', { username, message });
  });

  socket.on('typing', () => {
    socket.broadcast.emit('showTyping');
  });

  socket.on('callUser', (data) => {
    io.to(data.to).emit('callIncoming', {
      from: socket.id,
      name: data.name,
      signal: data.signal,
    });
  });

  socket.on('answerCall', (data) => {
    io.to(data.to).emit('callAccepted', data.signal);
  });

  socket.on('disconnect', () => {
    console.log('❌ Kullanıcı ayrıldı:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Sunucu ayakta, port: ${PORT}`);
});
