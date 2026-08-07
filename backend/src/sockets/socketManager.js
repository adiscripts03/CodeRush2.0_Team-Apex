let ioInstance = null;

export const initSockets = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] New client connected: ${socket.id}`);

    // Listener: Client scrubs the timeline, broadcast to all other connected clients
    socket.on('update_replay_frame', (frameId) => {
      console.log(`[Socket.IO] Client ${socket.id} updated replay frame to ${frameId}`);
      // Broadcast to everyone else
      socket.broadcast.emit('replay_frame_updated', { frameId });
    });

    // Listener: Client explicitly requests a hydro feed broadcast
    socket.on('trigger_hydro_update', (data) => {
      console.log(`[Socket.IO] Client ${socket.id} triggered hydro feed update`);
      io.emit('hydro_feed_updated', data);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });
};

// Emitters that can be called from Express controllers/services

export const emitNewResponsePlan = (planData) => {
  if (ioInstance) {
    ioInstance.emit('new_response_plan', planData);
  }
};

export const emitApprovalStatusChanged = (actionId, status, notes) => {
  if (ioInstance) {
    ioInstance.emit('approval_status_changed', { actionId, status, notes });
  }
};

export const emitAlertSent = (alertData) => {
  if (ioInstance) {
    ioInstance.emit('alert_sent', alertData);
  }
};

export const emitHydroFeedUpdated = (feedData) => {
  if (ioInstance) {
    ioInstance.emit('hydro_feed_updated', feedData);
  }
};

export const emitReplayFrameUpdated = (frameData) => {
  if (ioInstance) {
    ioInstance.emit('replay_frame_updated', frameData);
  }
};
