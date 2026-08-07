import express from 'express';
import { getHydroFeed } from '../controllers/hydroController.js';

const router = express.Router();

router.get('/', getHydroFeed);

export default router;
