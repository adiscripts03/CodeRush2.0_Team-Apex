import * as approvalService from '../services/approvalService.js';

export const getActions = async (req, res, next) => {
  try {
    const actions = await approvalService.getActions();
    res.status(200).json({ success: true, data: actions });
  } catch (error) {
    next(error);
  }
};

export const approveAction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const action = await approvalService.approveAction(id, notes);
    res.status(200).json({ success: true, data: action });
  } catch (error) {
    next(error);
  }
};

export const rejectAction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const action = await approvalService.rejectAction(id, notes);
    res.status(200).json({ success: true, data: action });
  } catch (error) {
    next(error);
  }
};

export const editAction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const action = await approvalService.editAction(id, updates);
    res.status(200).json({ success: true, data: action });
  } catch (error) {
    next(error);
  }
};
