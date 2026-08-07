import * as plannerService from '../services/plannerService.js';

export const generatePlan = async (req, res, next) => {
  try {
    const result = await plannerService.generateAIPlan();

    res.status(201).json({
      success: true,
      message: 'AI Response Plan generated successfully',
      data: result.plan,
      actionId: result.dbRecord._id
    });
  } catch (error) {
    next(error);
  }
};
