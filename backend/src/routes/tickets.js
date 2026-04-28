const express = require('express');
const QueueService = require('../services/QueueService');

const router = express.Router();

router.get('/', async (req, res) => {
  res.json(await QueueService.getAllTickets());
});

router.post('/', async (req, res) => {
  const { type, priority } = req.body;
  if (!type || !['billing', 'technical'].includes(type)) {
    return res.status(400).json({ error: 'Invalid ticket type' });
  }
  const ticket = await QueueService.addTicket(type, priority || 1);
  res.status(201).json(ticket);
});

module.exports = router;
