import express from 'express';
import { generatePlan } from '../controllers/plannerController.js';

const router = express.Router();

router.post('/generate', generatePlan);

export default router;
