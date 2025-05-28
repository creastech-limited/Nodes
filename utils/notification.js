const Notification = require('../Models/notification');
// This utility function sends a notification to a user
exports.sendNotification = async (userId,title, message, type = 'info') => {
  try {
    const notification = new Notification({
      userId,
      title,
      message,
      type
    });

    await notification.save();

    console.log(`Notification sent to ${userId}: ${message}`);
  } catch (error) {
    console.error('Error sending notification:', error.message);
  }
};