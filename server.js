const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

let peerMap = new Map();

app.use(cors());
app.use(express.static('public'));

app.get('/', (req, res) => {
  const version = "1.0.6";
  res.send(`Server is running v${version}`);
});

io.on('connection', (socket) => {
  const peerName = socket.handshake.query.name;
  console.log(`${peerName} (${socket.id}) has connected.`);
  socket.broadcast.emit('peerJoined', peerName);
  peerMap.set(socket.id, peerName);
  io.emit('mapUpdate', Array.from(peerMap.entries()));
  console.log(peerMap);
  
  socket.on('disconnecting', (name) => {
    console.log('A peer disconnected:', socket.id);
    const peerName = peerMap.get(socket.id);
    peerMap.delete(socket.id);
    io.emit('mapUpdate', Array.from(peerMap.entries()));
    socket.broadcast.emit('peerLeft', peerName);
  });

  socket.on('chatMessage', (msg) => {
    console.log(socket.id, " says: ", msg);
    socket.broadcast.emit('chatMessage', { id: socket.id, msg });
  });
  socket.on('file-data', (payload) => {
    console.log(`Received file from ${socket.id}: ${payload.name}`);
    socket.broadcast.emit('file-received', { id: socket.id, ...payload });
  });
  // Handle file chunks
  socket.on('file-chunk', (payload) => {
    console.log('Server received file chunk:', payload);
    socket.broadcast.emit('file-chunk', { id: socket.id, ...payload });
  });
  // Handle file transfer completion
  socket.on('file-complete', ({ name, size }) => {
    console.log(`File transfer complete: ${name} (${size} bytes)`);
    socket.broadcast.emit('file-complete', { id: socket.id, name });
  });

  socket.on('peername', (peer) => {
    console.log(`Peername from ${socket.id}: ${peer.Peername}`);
    socket.broadcast.emit('nameplate', peer);
  });
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
server.listen(PORT, () => {
  console.log(`Server running on port http://${HOST}:${PORT}`);
});
