
const emitTaskEvent = (req, tenantId, eventName, task) => {
  try {
    const io = req.app.get("io");

    if (!io) {
      console.error("Socket.IO instance not found");
      return;
    }

    io.to(`tenant:${tenantId}`).emit(eventName, {
      success: true,
      task
    });
  } catch (error) {
    console.error("Task Socket Event Error:", error.message);
  }
};

module.exports = emitTaskEvent;
