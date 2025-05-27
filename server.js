const express = require('express');
const cors = require('cors');
const http = require('http');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const io = require('socket.io')(server, {
  cors: {
    origin: '*', // Geliştirme sürecinde açık bırakıldı
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB bağlantısı
connectDB();

// Rotalar
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// WebSocket bağlantısı
io.on('connection', (socket) => {
  console.log('🔌 Yeni kullanıcı bağlandı:', socket.id);

  socket.on('sendMessage', (data) => {
    const { username, message } = data;
    console.log(`📩 Mesaj alındı [${username}]: ${message}`);

    // Tüm kullanıcılara mesajı gönder
    io.emit('receiveMessage', {
      username,
      message
    });
  });

  socket.on('disconnect', () => {
    console.log('❌ Kullanıcı ayrıldı:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Sunucu ayakta, port: ${PORT}`);
});
/* Sunucuyu IP üzerinden herkese açık çalıştır
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Sunucu ayakta: http://192.168.1.169:${PORT}`);
});*/
