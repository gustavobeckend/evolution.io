import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

const PORT = process.env.PORT || 4000;

// Simple health
app.get('/health', (req, res) => res.json({ ok: true }));

// Rooms state (minimal)
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  socket.on('join', ({ room, playerId }) => {
    socket.join(room);
    socket.data.playerId = playerId;
    socket.data.room = room;
    console.log(`${playerId} joined ${room}`);
    // notify others
    socket.to(room).emit('player-joined', { playerId });
  });

  socket.on('leave', ({ room, playerId }) => {
    socket.leave(room);
    socket.to(room).emit('player-left', { playerId });
  });

  socket.on('player-update', (payload) => {
    const room = socket.data.room;
    if (room) {
      // relay to others in room
      socket.to(room).emit('player-update', payload);
    }
  });

  socket.on('disconnect', () => {
    const { playerId, room } = socket.data;
    if (room && playerId) socket.to(room).emit('player-left', { playerId });
    console.log('socket disconnected', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});
