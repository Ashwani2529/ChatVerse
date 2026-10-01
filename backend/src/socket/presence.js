// Tracks who is currently connected, per room. A member can hold several
// sockets at once (multiple tabs or devices) and only counts as one person.
const rooms = new Map(); // roomId -> Map<memberId, { name, sockets: Set<string> }>

const addSocket = (roomId, memberId, name, socketId) => {
  if (!rooms.has(roomId)) rooms.set(roomId, new Map());
  const members = rooms.get(roomId);

  const existing = members.get(memberId);

  if (existing) {
    existing.sockets.add(socketId);
    existing.name = name;
    return { isFirstSocket: false };
  }

  members.set(memberId, { name, sockets: new Set([socketId]) });
  return { isFirstSocket: true };
};

const removeSocket = (roomId, memberId, socketId) => {
  const members = rooms.get(roomId);
  if (!members) return { isLastSocket: false };

  const entry = members.get(memberId);
  if (!entry) return { isLastSocket: false };

  entry.sockets.delete(socketId);

  if (entry.sockets.size > 0) {
    return { isLastSocket: false };
  }

  members.delete(memberId);
  if (members.size === 0) rooms.delete(roomId);

  return { isLastSocket: true };
};

const listRoom = (roomId) => {
  const members = rooms.get(roomId);
  if (!members) return [];

  return Array.from(members.entries())
    .map(([memberId, entry]) => ({ memberId, name: entry.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

const totalConnections = () => {
  let total = 0;
  rooms.forEach((members) => {
    members.forEach((entry) => {
      total += entry.sockets.size;
    });
  });
  return total;
};

module.exports = { addSocket, removeSocket, listRoom, totalConnections };
