const http = require('http');
const express = require('express');
const cors = require('cors');
const port = process.env.PORT;
const socketIO = require('socket.io');
const app = express();
app.use(cors());
const users = [{}];
app.get("/", (req, res) => {
  res.send(`Backend is running on ${port}`);
})

const server = http.createServer(app);
const io = socketIO(server);

io.on("connection", (socket) => { // Pass the socket object as a parameter
  socket.on('joined', ({ user }) => {
    users[socket.id] = user;
    socket.broadcast.emit('userJoined', { user: "Ashwani: ", message: ` ${users[socket.id]} joined the Chat` });
    socket.emit('welcome', { user: "Ashwani ", message: `Welcome to the ChatVerse ,${users[socket.id]} ` })
  })

  socket.on('message', ({ message, id }) => {
    io.emit('sendMessage', { user: users[id], message, id });
  })

  socket.on('userDisconnect', () => {
    socket.broadcast.emit('leavef', { user: "Ashwani", message: `${users[socket.id]} left` });
  })
});

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
