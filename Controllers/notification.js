const Notification = require('../Models/notification');
const regUser = require('../Models/registeration');

// Get all notifications for a user
exports.getNotifications = async (req, res) => {
  const userId = req.user.id;

  try {
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};