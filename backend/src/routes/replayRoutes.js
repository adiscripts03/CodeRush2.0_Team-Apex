import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// Get directory name since __dirname is not available in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.get('/frame/:id', (req, res, next) => {
  try {
    const frameId = req.params.id;
    const framePath = path.join(__dirname, '..', 'simulation', `frame${frameId}.json`);

    if (!fs.existsSync(framePath)) {
      return res.status(404).json({
        success: false,
        message: `Simulation frame ${frameId} not found.`
      });
    }

    const frameData = fs.readFileSync(framePath, 'utf8');
    const parsedData = JSON.parse(frameData);

    // Missing Data Simulation for Frame 3
    if (frameId === '3') {
      parsedData.satellite = null;
      parsedData.reason = "Cloud Cover";
      parsedData.confidence = 68; // Based on prompt, confidence is 68
      parsedData.fallbackSources = [
        "River Sensors",
        "Rainfall",
        "Historical Data"
      ];
      
      // Log the event in Audit Logs
      import('../models/AuditLog.js').then(({ default: AuditLog }) => {
        AuditLog.create({
          eventType: 'observation',
          message: 'Satellite data loss detected. Switched to fallback sources.',
          details: { frameId: '3', reason: 'Cloud Cover' }
        }).catch(err => console.error('Failed to log audit:', err));
      });
    }

    // Broadcast the update via Socket.IO
    import('../sockets/socketManager.js').then(({ emitReplayFrameUpdated }) => {
      emitReplayFrameUpdated({ frameId, timestamp: parsedData.timestamp, hasDataGap: frameId === '3' });
    });

    res.status(200).json({
      success: true,
      data: parsedData
    });
  } catch (error) {
    next(error);
  }
});

export default router;
