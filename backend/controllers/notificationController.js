const mockStore = require('../database/mockStore');
const { sendSuccess, sendError } = require('../utils/responseHandler');

async function getNotifications(req, res) {
  try {
    const userId = req.user.id;
    const userNotifs = mockStore.notifications
      .filter(n => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return sendSuccess(res, userNotifs);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const notif = mockStore.notifications.find(n => n.notification_id === id);
    if (!notif) return sendError(res, 'Notification not found', 404);

    notif.is_read = true;
    return sendSuccess(res, notif, 'Notification marked as read');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

module.exports = {
  getNotifications,
  markAsRead
};
