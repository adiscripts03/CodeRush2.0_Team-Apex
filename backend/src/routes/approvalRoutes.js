import express from 'express';
import {
  getActions,
  approveAction,
  rejectAction,
  editAction
} from '../controllers/approvalController.js';

const router = express.Router();

router.get('/', getActions);
router.post('/:id/approve', approveAction);
router.post('/:id/reject', rejectAction);
router.put('/:id/edit', editAction);

export default router;
