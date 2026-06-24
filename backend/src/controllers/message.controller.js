const { listMessagesForChatWidget } = require('../services/chat.service');

exports.getMessagesByWidget = async (req, res) => {
  try {
    const messages = await listMessagesForChatWidget({
      widgetId: req.params.widgetId,
      userId: req.user.id,
      limit: req.query.limit,
    });

    res.status(200).json({ messages });
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({
      message: error.status ? error.message : 'Erreur serveur.',
    });
  }
};
