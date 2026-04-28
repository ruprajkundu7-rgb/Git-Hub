const express = require('express');
const QueueService = require('../services/QueueService');

const router = express.Router();

router.get('/', async (req, res) => {
  res.json(await QueueService.getAgents());
});

router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!['available', 'busy'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const agent = await QueueService.setAgentStatus(req.params.id, status);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  res.json(agent);
});

router.post('/assign', async (req, res) => {
  const { agentId } = req.body;
  const assignment = await QueueService.assignTicket(agentId);
  if (!assignment) {
    return res.status(400).json({ error: 'Cannot assign ticket (either no ticket matches, head blocked, or agent busy/not found)' });
  }
  res.json(assignment);
});

module.exports = router;
