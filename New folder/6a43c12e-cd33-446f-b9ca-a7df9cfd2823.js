const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let players = {};
let countdown = 10;

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);
  players[socket.id] = { choice: null };
  io.emit('playerCount', Object.keys(players).length);

  socket.on('chooseColor', (color) => {
    if (players[socket.id]) {
      players[socket.id].choice = color;
      io.emit('update', `A player chose a color. Total players: ${Object.keys(players).length}`);
    }
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('playerCount', Object.keys(players).length);
    console.log(`Player disconnected: ${socket.id}`);
  });
});

// Continuous timer loop
setInterval(() => {
  countdown--;
  io.emit('timerUpdate', countdown);
  if (countdown <= 0) {
    endRound();
    countdown = 10; // Reset timer
  }
}, 1000);

function endRound() {
  const choices = { Red: 0, Blue: 0, Green: 0 };
  for (const id in players) {
    const choice = players[id].choice;
    if (choice) choices[choice]++;
  }

  let minCount = Object.keys(players).length + 1;
  let winningColors = [];
  for (const color in choices) {
    if (choices[color] > 0 && choices[color] < minCount) {
      minCount = choices[color];
      winningColors = [color];
    } else if (choices[color] === minCount) {
      winningColors.push(color);
    }
  }

  const result = {
    choices,
    winners: winningColors,
    minCount: minCount > Object.keys(players).length ? 0 : minCount
  };
  io.emit('gameResult', result);
  // Reset player choices for next round
  for (const id in players) {
    players[id].choice = null;
  }
}

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});