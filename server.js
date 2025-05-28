const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');
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

// HTML dosyası servisi
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Socket.IO Bağlantıları
const users = new Map();

io.on('connection', (socket) => {
  console.log('Yeni bağlantı:', socket.id);

  socket.on('join', (username) => {
    users.set(socket.id, username);
    // Diğer kullanıcıya bağlandığını bildir
    socket.broadcast.emit('newUser', socket.id);
  });

  socket.on('sendMessage', (data) => {
    io.emit('receiveMessage', data);
  });

  socket.on('call', ({ to, offer }) => {
    io.to(to).emit('incomingCall', { from: socket.id, offer });
  });

  socket.on('answer', ({ to, answer }) => {
    io.to(to).emit('answer', { answer });
  });

  socket.on('iceCandidate', ({ to, candidate }) => {
    io.to(to).emit('iceCandidate', { candidate });
  });

  socket.on('callDeclined', ({ to }) => {
    io.to(to).emit('callDeclined');
  });

  socket.on('disconnect', () => {
    users.delete(socket.id);
    console.log('Kullanıcı ayrıldı:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Sunucu port ${PORT} üzerinde ayakta.`);
});
