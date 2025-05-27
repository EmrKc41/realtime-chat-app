const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB bağlantısı
connectDB();

// API Rotaları
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// ✅ SADECE bu yeterli
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// WebSocket bağlantısı
io.on('connection', (socket) => {
  console.log('🔌 Yeni kullanıcı bağlandı:', socket.id);

  socket.on('sendMessage', (data) => {
    const { username, message } = data;
    console.log(`📩 Mesaj alındı [${username}]: ${message}`);

    io.emit('receiveMessage', {
      username,
      message
    });
  });

  socket.on('disconnect', () => {
    console.log('❌ Kullanıcı ayrıldı:', socket.id);
  });
});

// Sunucuyu başlat
server.listen(PORT, () => {
  console.log(`🚀 Sunucu ayakta, port: ${PORT}`);
});
