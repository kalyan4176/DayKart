import { notificationEmitter } from '../utils/notificationEmitter.js';

// Map of active SSE client connections: userId (string) -> res (Express response object)
const activeClients = new Map();

export const addClient = (userId, res) => {
  if (activeClients.has(userId)) {
    try {
      activeClients.get(userId).end();
    } catch (e) {
      // safe ignore
    }
  }
  activeClients.set(userId, res);
};

export const removeClient = (userId) => {
  activeClients.delete(userId);
};

// Listen for new notifications and push them via SSE stream in real-time
notificationEmitter.on('notification:new', (notification) => {
  try {
    const recipientId = notification.recipient.toString();
    const clientRes = activeClients.get(recipientId);
    if (clientRes) {
      clientRes.write(`data: ${JSON.stringify(notification)}\n\n`);
    }
  } catch (error) {
    console.error('Error broadcasting SSE notification:', error);
  }
});
