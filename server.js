const express = require('express');
var cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {cors:{origin:"*"}});

app.use(cors());
app.use(express.static('public'));

app.get('/', (req, res) => {
  const version = "1.0.0"; // replace with your version
  res.send(`Server is running v${version}`);
});

io.on('connection', (socket) => {
  console.log('A peer connected:', socket.id);
  socket.broadcast.emit('peerJoined', socket.id);

  socket.on('chatMessage', (msg) => {
    console.log(socket.id ," says: " , msg);
    socket.broadcast.emit('chatMessage', socket.id+msg);
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
