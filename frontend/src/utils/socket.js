import { io } from 'socket.io-client';

const configuredApiUrl = import.meta.env.VITE_API_URL;
const socketUrl = configuredApiUrl
  ? configuredApiUrl.replace(/\/api\/?$/, '')
  : window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : window.location.origin;

export function createChatSocket() {
  return io(socketUrl, {
    autoConnect: false,
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });
}
