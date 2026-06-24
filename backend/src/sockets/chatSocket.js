const jwt = require('jsonwebtoken');
const { createMessage, ensureGroupMember, parsePositiveInt } = require('../services/chat.service');

const getTokenFromSocket = (socket) => {
  const authToken = socket.handshake.auth?.token;

  if (typeof authToken === 'string' && authToken.trim()) {
    return authToken.trim();
  }

  const authorization = socket.handshake.headers?.authorization;
  if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
    return authorization.slice(7).trim();
  }

  return null;
};

const normalizeCallback = (callback) => (typeof callback === 'function' ? callback : () => {});

const configureChatSocket = (io) => {
  io.use((socket, next) => {
    const token = getTokenFromSocket(socket);

    if (!token) {
      return next(new Error('Authentification requise.'));
    }

    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      return next();
    } catch {
      return next(new Error('Token invalide.'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('join_group', async (payload, callback) => {
      const done = normalizeCallback(callback);

      try {
        const groupId = parsePositiveInt(payload?.groupId);

        if (groupId === null) {
          throw new Error('ID du groupe invalide.');
        }

        await ensureGroupMember({ groupId, userId: socket.user.id });
        socket.join(`group:${groupId}`);

        done({ ok: true });
      } catch (error) {
        done({ ok: false, message: error.message || 'Impossible de rejoindre le chat.' });
      }
    });

    socket.on('send_message', async (payload, callback) => {
      const done = normalizeCallback(callback);

      try {
        const message = await createMessage({
          groupId: payload?.groupId,
          userId: socket.user.id,
          text: payload?.text,
        });

        io.to(`group:${message.groupId}`).emit('receive_message', message);
        done({ ok: true, message });
      } catch (error) {
        done({ ok: false, message: error.message || "Impossible d'envoyer le message." });
      }
    });
  });
};

module.exports = configureChatSocket;
