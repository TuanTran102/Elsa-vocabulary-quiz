import http from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import app from './app.js';
import { pubClient, subClient } from './config/redis.js';
import dotenv from 'dotenv';

dotenv.config();

const port = process.env.PORT || 3000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.adapter(createAdapter(pubClient, subClient));

io.on('connection', (socket) => {
  console.log('a user connected', socket.id);
  
  socket.on('disconnect', () => {
    console.log('user disconnected', socket.id);
  });
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

export { server, io };
