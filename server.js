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

app.use(cors());
app.use(express.json());

connectDB();

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// === Kullanıcı adı tutulacak
const connectedUsers = {};

io.on('connection', (socket) => {
  console.log('🔌 Yeni kullanıcı bağlandı:', socket.id);

  // Kullanıcı adı kaydetme
  socket.on("registerUser", (username) => {
    connectedUsers[socket.id] = username;
    console.log(`👤 Kullanıcı adı kaydedildi: ${username}`);

    // Diğer kullanıcılara bildir
    socket.broadcast.emit("userConnected", username);
  });

  socket.on('sendMessage', (data) => {
    const { username, message } = data;
    console.log(`📩 Mesaj alındı [${username}]: ${message}`);

    io.emit('receiveMessage', {
      username,
      message
    });
  });

  socket.on("typing", () => {
    socket.broadcast.emit("showTyping");
  });

  socket.on('disconnect', () => {
    const user = connectedUsers[socket.id];
    console.log('❌ Kullanıcı ayrıldı:', socket.id, user);
    delete connectedUsers[socket.id];
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Sunucu ayakta, port: ${PORT}`);
});
