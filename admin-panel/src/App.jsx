import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';

const SOCKET_URL = 'http://localhost:3000';

function App() {
  const [queue, setQueue] = useState([]);
  const [agents, setAgents] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('queue_updated', (data) => {
      setQueue(data);
    });

    newSocket.on('agent_updated', (data) => {
      setAgents(data);
    });

    return () => newSocket.close();
  }, []);

  const toggleAgentStatus = async (agentId, currentStatus) => {
    const newStatus = currentStatus === 'available' ? 'busy' : 'available';
    await fetch(`${SOCKET_URL}/agents/${agentId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
  };

  const assignTicket = async (agentId) => {
    const res = await fetch(`${SOCKET_URL}/agents/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId })
    });
    const data = await res.json();
    if (data.error) {
      alert(data.error);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Admin Dashboard - Support Queue</h1>
      </header>
      
      <main className="dashboard">
        <section className="queue-section">
          <h2>Live Ticket Queue ({queue.length})</h2>
          {queue.length === 0 ? (
            <p className="empty-state">No tickets in the queue</p>
          ) : (
            <div className="ticket-list">
              {queue.map((ticket, index) => (
                <div key={ticket.id} className="ticket-card">
                  <div className="ticket-header">
                    <span className="queue-position">#{index + 1}</span>
                    <span className={`ticket-type ${ticket.type}`}>{ticket.type.toUpperCase()}</span>
                  </div>
                  <div className="ticket-details">
                    <p><strong>Priority:</strong> {ticket.priority}</p>
                    <p><strong>Displaced:</strong> {ticket.displacementCount} times {ticket.displacementCount >= 3 && '(LOCKED)'}</p>
                    <p className="ticket-id">ID: {ticket.id}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="agents-section">
          <h2>Support Agents</h2>
          <div className="agent-list">
            {agents.map(agent => (
              <div key={agent.id} className={`agent-card ${agent.status}`}>
                <h3>{agent.name}</h3>
                <p>Type: {agent.type}</p>
                <p>Status: <strong>{agent.status.toUpperCase()}</strong></p>
                <div className="agent-actions">
                  <button 
                    onClick={() => toggleAgentStatus(agent.id, agent.status)}
                    className="toggle-btn"
                  >
                    Set {agent.status === 'available' ? 'Busy' : 'Available'}
                  </button>
                  <button 
                    onClick={() => assignTicket(agent.id)}
                    disabled={agent.status !== 'available' || queue.length === 0}
                    className="assign-btn"
                  >
                    Assign Ticket
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
