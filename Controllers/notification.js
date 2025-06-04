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
//read a notification
exports.readNotification = async (req, res) => {
  const { notificationId } = req.params;

  try {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    ); 
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json(notification);
  }
  catch (error) {
    res.status(500).json({ error: error.message });
  }
}