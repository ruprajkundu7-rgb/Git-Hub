const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['billing', 'technical'], required: true },
  status: { type: String, enum: ['available', 'busy'], default: 'available' }
});

module.exports = mongoose.model('Agent', agentSchema);
