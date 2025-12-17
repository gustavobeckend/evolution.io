import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function connectSocket(url = ''): void {
  if (socket) return;
  const endpoint = url || (window as any).__SOCKET_URL__ || (window as any).__VITE_SOCKET_URL__ || 'http://localhost:4000';
  // Some hosting providers (proxies/load-balancers) block websocket upgrades.
  // Use polling as a more compatible fallback for now.
  socket = io(endpoint, { transports: ['polling'] });

  socket.on('connect', () => {
    console.log('connected to socket', socket?.id);
  });

  socket.on('disconnect', () => {
    console.log('socket disconnected');
  });
}

export function joinRoom(room: string, playerId: string) {
  if (!socket) return;
  socket.emit('join', { room, playerId });
}

export function leaveRoom(room: string, playerId: string) {
  if (!socket) return;
  socket.emit('leave', { room, playerId });
}

export function sendPlayerUpdate(payload: any) {
  if (!socket) return;
  socket.emit('player-update', payload);
}

export function onPlayerUpdate(cb: (data: any) => void) {
  if (!socket) return;
  socket.on('player-update', cb);
}

export function onPlayerJoined(cb: (data: any) => void) {
  if (!socket) return;
  socket.on('player-joined', cb);
}

export function onPlayerLeft(cb: (data: any) => void) {
  if (!socket) return;
  socket.on('player-left', cb);
}
