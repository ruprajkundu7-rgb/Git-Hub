const QueueService = require('../services/QueueService');

async function setupSockets(io) {
  io.on('connection', async (socket) => {
    console.log('Client connected:', socket.id);

    // Send initial state
    socket.emit('queue_updated', await QueueService.getQueue());
    socket.emit('agent_updated', await QueueService.getAgents());

    // Listen for heartbeats
    socket.on('heartbeat', async (data) => {
      const { ticketId } = data;
      if (ticketId) {
        await QueueService.handleHeartbeat(ticketId);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}

async function broadcastState(io) {
  io.emit('queue_updated', await QueueService.getQueue());
  io.emit('agent_updated', await QueueService.getAgents());
}

module.exports = { setupSockets, broadcastState };
