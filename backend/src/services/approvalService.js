import ResponseAction from '../models/ResponseAction.js';
import AuditLog from '../models/AuditLog.js';

export const getActions = async () => {
  try {
    return await ResponseAction.find().sort({ createdAt: -1 }).lean();
  } catch (error) {
    throw new Error(`Error fetching actions: ${error.message}`);
  }
};

export const approveAction = async (actionId, notes = '') => {
  try {
    const action = await ResponseAction.findByIdAndUpdate(
      actionId,
      { status: 'approved', ...(notes && { notes }) },
      { new: true }
    );

    if (!action) throw new Error('Action not found');

    // Create Audit Log
    await AuditLog.create({
      eventType: 'approval',
      message: `Action "${action.title}" was APPROVED.`,
      details: { actionId, notes }
    });

    return action;
  } catch (error) {
    throw new Error(`Error approving action: ${error.message}`);
  }
};

export const rejectAction = async (actionId, notes = '') => {
  try {
    const action = await ResponseAction.findByIdAndUpdate(
      actionId,
      { status: 'rejected', ...(notes && { notes }) },
      { new: true }
    );

    if (!action) throw new Error('Action not found');

    // Create Audit Log
    await AuditLog.create({
      eventType: 'approval',
      message: `Action "${action.title}" was REJECTED.`,
      details: { actionId, notes }
    });

    return action;
  } catch (error) {
    throw new Error(`Error rejecting action: ${error.message}`);
  }
};

export const editAction = async (actionId, updates) => {
  try {
    const action = await ResponseAction.findByIdAndUpdate(
      actionId,
      { $set: updates },
      { new: true }
    );

    if (!action) throw new Error('Action not found');

    // Create Audit Log
    await AuditLog.create({
      eventType: 'data_update',
      message: `Action "${action.title}" was manually EDITED.`,
      details: { actionId, updates }
    });

    return action;
  } catch (error) {
    throw new Error(`Error editing action: ${error.message}`);
  }
};
