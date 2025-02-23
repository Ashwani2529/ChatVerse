const http = require('http');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const port = process.env.PORT;
const socketIO = require('socket.io');
const axios = require('axios');
const app = express();
app.use(cors());
const users = [{}];

app.get("/", (req, res) => {
  res.send(`Backend is running on ${port}`);
});

const server = http.createServer(app);
const io = socketIO(server);

io.on("connection", (socket) => {
  socket.on('joined', ({ user }) => {
    users[socket.id] = user;
    socket.broadcast.emit('userJoined', { user: "Ashwani: ", message: ` ${users[socket.id]} joined the Chat` });
    socket.emit('welcome', { user: "Ashwani ", message: `Welcome to the ChatVerse, ${users[socket.id]}` });
  });

  socket.on('message', async ({ message, id }) => {
    try {
        // Send the message to the Python model server for classification
        const response = await axios.post('https://hate-speech-model-latest.onrender.com/predict', { text: message });
        const prediction = response.data.prediction;
        // Check the prediction value and send a warning if toxic
        if (prediction === "Toxic") {
            // Send an announcement to the chat warning the user
            io.emit('sendMessage', {
                user: 'System',
                message: `Warning to ${users[id]}: Please be respectful!`,
                id: 'system',
            });
        } else {
            // If the message is non-toxic, send it as usual
            io.emit('sendMessage', {
                user: users[id],
                message: message,
                id,
            });
        }
    } catch (error) {
        console.error('Error classifying message:', error);
        io.emit('sendMessage', {
            user: users[id],
            message: message,
            id,
            prediction: 'Error classifying message'
        });
    }
});


  socket.on('disconnect', () => {
    socket.broadcast.emit('leave', { user: "Ashwani", message: `${users[socket.id]} left` });
  });
});

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
