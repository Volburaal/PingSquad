const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.static('public'));

app.get('/', (req, res) => {
  const version = "1.0.3";
  res.send(`Server is running v${version}`);
});

io.on('connection', (socket) => {
  console.log('A peer connected:', socket.id);
  socket.broadcast.emit('peerJoined', socket.id);

  // Handle chat messages
  socket.on('chatMessage', (msg) => {
    console.log(socket.id, " says: ", msg);
    const sk = socket.id;
    socket.broadcast.emit('chatMessage', { sk, msg });
  });

  // Handle file data
  socket.on('file-data', (payload) => {
    console.log(`Received file from ${socket.id}: ${payload.name}`);
    const sk = socket.id;
    socket.broadcast.emit('file-received', { sk, ...payload });
  });

  // Handle peer leaving
  socket.on('disconnect', () => {
    console.log('A peer disconnected:', socket.id);
    socket.broadcast.emit('peerLeft', socket.id);
  });

  // Handle peer name
  socket.on('peername', (peer) => {
    console.log(`Peername from ${socket.id}: ${peer}`);
    socket.broadcast.emit('nameplate', peer);
  });
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
server.listen(PORT, () => {
  console.log(`Server running on port http://${HOST}:${PORT}`);
});
