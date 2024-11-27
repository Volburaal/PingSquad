const express = require('express');
var cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  const version = "1.0.2";
  // res.sendFile(path.join(__dirname, 'index.html')); //sends the static web page, not of much use
  res.send(`Server is running v${version}`);
});

io.on('connection', (socket) => {
  console.log('A peer connected:', socket.id);
  socket.broadcast.emit('peerJoined', socket.id);

  socket.on('chatMessage', (msg) => {
    console.log(socket.id, " says: ", msg);
    const sk = socket.id;
    socket.broadcast.emit('chatMessage', { sk, msg });
  });

  // Handling image data
  socket.on('image-data', (src) => {
    console.log(`Received image data from ${socket.id}`);
    const sk = socket.id;
    // Emit the image content along with the sender's socket ID to other peers
    socket.broadcast.emit('sentImg', { sk, src });
  });

  socket.on('disconnect', () => {
    console.log('A peer disconnected:', socket.id);
    socket.broadcast.emit('peerLeft', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
server.listen(PORT, () => {
  console.log(`Server running on port http://${HOST}:${PORT}`);
});
