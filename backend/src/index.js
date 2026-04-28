const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const QueueService = require('./services/QueueService');
const { setupSockets, broadcastState } = require('./sockets/socketHandler');

const ticketsRouter = require('./routes/tickets');
const agentsRouter = require('./routes/agents');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/tickets', ticketsRouter);
app.use('/agents', agentsRouter);

setupSockets(io);

// Background workers
setInterval(async () => {
  const prioritiesChanged = await QueueService.updatePriorities();
  if (prioritiesChanged) {
    await broadcastState(io);
  }
}, 10000);

setInterval(async () => {
  const ticketsRemoved = await QueueService.removeInactiveTickets();
  if (ticketsRemoved) {
    await broadcastState(io);
  }
}, 5000);

// Broadcast after REST actions
const originalAddTicket = QueueService.addTicket.bind(QueueService);
QueueService.addTicket = async (...args) => {
  const result = await originalAddTicket(...args);
  await broadcastState(io);
  return result;
};

const originalSetAgentStatus = QueueService.setAgentStatus.bind(QueueService);
QueueService.setAgentStatus = async (...args) => {
  const result = await originalSetAgentStatus(...args);
  await broadcastState(io);
  return result;
};

const originalAssignTicket = QueueService.assignTicket.bind(QueueService);
QueueService.assignTicket = async (...args) => {
  const result = await originalAssignTicket(...args);
  if (result) await broadcastState(io);
  return result;
};

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
