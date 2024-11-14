const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// Create an Express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve the static files from the "public" folder
app.use(express.static('public'));

// When a client connects
io.on('connection', (socket) => {
  console.log('A peer connected:', socket.id);

  // Listen for chat messages and broadcast to all other peers
  socket.on('chatMessage', (msg) => {
    console.log(socket.id , msg);
    socket.broadcast.emit('chatMessage', msg);
  });

  // When a client disconnects
  socket.on('disconnect', () => {
    console.log('A peer disconnected:', socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
