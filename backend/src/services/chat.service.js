const prisma = require('../lib/prisma');

const MAX_MESSAGE_LENGTH = 500;
const DEFAULT_MESSAGES_LIMIT = 80;

const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const parsePositiveInt = (value) => {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return parseInt(value, 10);
  }

  return null;
};

const normalizeMessageText = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.replace(/\s+/g, ' ').trim();
};

const serializeMessage = (message) => ({
  id: message.id,
  text: message.text,
  createdAt: message.createdAt,
  groupId: message.groupId,
  user: {
    id: message.user.id,
    name: message.user.name,
    avatar: message.user.avatar,
  },
});

const ensureGroupMember = async ({ groupId, userId }) => {
  const member = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
    select: { id: true, role: true },
  });

  if (!member) {
    throw createHttpError(403, 'Acces refuse. Vous ne faites pas partie de ce groupe.');
  }

  return member;
};

const ensureChatWidgetAccess = async ({ widgetId, userId }) => {
  const normalizedWidgetId = parsePositiveInt(widgetId);

  if (normalizedWidgetId === null) {
    throw createHttpError(400, 'ID du widget invalide.');
  }

  const widget = await prisma.widget.findUnique({
    where: { id: normalizedWidgetId },
    select: {
      id: true,
      groupId: true,
      type: true,
    },
  });

  if (!widget) {
    throw createHttpError(404, 'Widget introuvable.');
  }

  if (widget.type !== 'CHAT') {
    throw createHttpError(400, 'Ce widget ne contient pas de chat.');
  }

  await ensureGroupMember({ groupId: widget.groupId, userId });

  return widget;
};

const listMessagesForChatWidget = async ({ widgetId, userId, limit = DEFAULT_MESSAGES_LIMIT }) => {
  const widget = await ensureChatWidgetAccess({ widgetId, userId });
  const safeLimit = Math.min(Math.max(parsePositiveInt(limit) || DEFAULT_MESSAGES_LIMIT, 1), 150);

  const messages = await prisma.message.findMany({
    where: { groupId: widget.groupId },
    orderBy: { createdAt: 'desc' },
    take: safeLimit,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });

  return messages.reverse().map(serializeMessage);
};

const createMessage = async ({ groupId, userId, text }) => {
  const normalizedGroupId = parsePositiveInt(groupId);

  if (normalizedGroupId === null) {
    throw createHttpError(400, 'ID du groupe invalide.');
  }

  const normalizedText = normalizeMessageText(text);

  if (!normalizedText) {
    throw createHttpError(400, 'Le message ne peut pas etre vide.');
  }

  if (normalizedText.length > MAX_MESSAGE_LENGTH) {
    throw createHttpError(400, `Le message ne peut pas depasser ${MAX_MESSAGE_LENGTH} caracteres.`);
  }

  await ensureGroupMember({ groupId: normalizedGroupId, userId });

  const message = await prisma.message.create({
    data: {
      text: normalizedText,
      userId,
      groupId: normalizedGroupId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });

  return serializeMessage(message);
};

module.exports = {
  createMessage,
  ensureGroupMember,
  listMessagesForChatWidget,
  parsePositiveInt,
};
