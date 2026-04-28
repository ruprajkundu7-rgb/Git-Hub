const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  createdAt: { type: Number, default: Date.now },
  type: { type: String, enum: ['billing', 'technical'], required: true },
  priority: { type: Number, default: 1 },
  displacementCount: { type: Number, default: 0 },
  status: { type: String, enum: ['waiting', 'assigned', 'completed', 'removed'], default: 'waiting' },
  lastHeartbeat: { type: Number, default: Date.now },
  queueIndex: { type: Number, default: -1 } // Explicit ordering index for waiting tickets
});

module.exports = mongoose.model('Ticket', ticketSchema);
