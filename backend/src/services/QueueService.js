const { v4: uuidv4 } = require('uuid');

class QueueService {
  constructor() {
    this.tickets = [];
    this.agents = [
      { id: 'a1', name: 'Rupraj (Billing)', type: 'billing', status: 'available' },
      { id: 'a2', name: 'Abhipriyo (Billing)', type: 'billing', status: 'available' },
      { id: 'a3', name: 'Kiran (Tech)', type: 'technical', status: 'available' },
      { id: 'a4', name: 'Pritam (Tech)', type: 'technical', status: 'available' },
    ];
  }

  async addTicket(type, initialPriority = 1) {
    const ticket = {
      id: uuidv4(),
      createdAt: Date.now(),
      type,
      priority: initialPriority,
      displacementCount: 0,
      status: 'waiting',
      lastHeartbeat: Date.now()
    };
    
    this.insertTicketWithDisplacement(ticket);
    return ticket;
  }

  insertTicketWithDisplacement(newTicket) {
    let targetIndex = this.tickets.length;
    for (let i = 0; i < this.tickets.length; i++) {
      const t = this.tickets[i];
      if (t.status !== 'waiting') continue;

      if (newTicket.priority > t.priority) {
        if (t.displacementCount < 3) {
          targetIndex = i;
          break;
        }
      }
    }

    this.tickets.splice(targetIndex, 0, newTicket);

    for (let i = targetIndex + 1; i < this.tickets.length; i++) {
      if (this.tickets[i].priority < newTicket.priority && this.tickets[i].displacementCount < 3) {
        this.tickets[i].displacementCount++;
      }
    }
    this.reorderQueue();
  }

  reorderQueue() {
    const waiting = this.tickets.filter(t => t.status === 'waiting');
    const others = this.tickets.filter(t => t.status !== 'waiting');

    let swapped;
    do {
      swapped = false;
      for (let i = 0; i < waiting.length - 1; i++) {
        const current = waiting[i];
        const next = waiting[i + 1];

        if (next.priority > current.priority) {
          if (current.displacementCount < 3) {
            waiting[i] = next;
            waiting[i + 1] = current;
            current.displacementCount++;
            swapped = true;
          }
        }
      }
    } while (swapped);

    this.tickets = [...waiting, ...others];
  }

  async updatePriorities() {
    let changed = false;
    this.tickets.forEach(t => {
      if (t.status === 'waiting') {
        t.priority += 1;
        changed = true;
      }
    });
    if (changed) this.reorderQueue();
    return changed;
  }

  async handleHeartbeat(ticketId) {
    const ticket = this.tickets.find(t => t.id === ticketId);
    if (ticket) {
      ticket.lastHeartbeat = Date.now();
      return true;
    }
    return false;
  }

  async removeInactiveTickets() {
    const now = Date.now();
    const TIMEOUT = 15000;
    const initialLength = this.tickets.length;
    this.tickets = this.tickets.filter(t => {
      if (t.status === 'waiting' && (now - t.lastHeartbeat > TIMEOUT)) return false;
      return true;
    });
    return this.tickets.length !== initialLength;
  }

  async getQueue() {
    return this.tickets.filter(t => t.status === 'waiting');
  }

  async getAllTickets() {
    return this.tickets;
  }

  async getAgents() {
    return this.agents;
  }

  async setAgentStatus(agentId, status) {
    const agent = this.agents.find(a => a.id === agentId);
    if (agent) {
      agent.status = status;
      return agent;
    }
    return null;
  }

  async assignTicket(agentId) {
    const agent = this.agents.find(a => a.id === agentId);
    if (!agent || agent.status !== 'available') return null;

    const waitingTickets = this.tickets.filter(t => t.status === 'waiting');
    const topTicket = waitingTickets[0];
    if (!topTicket || topTicket.type !== agent.type) return null;

    topTicket.status = 'assigned';
    agent.status = 'busy';
    return { ticket: topTicket, agent };
  }
}

module.exports = new QueueService();
