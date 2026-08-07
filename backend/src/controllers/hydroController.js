import * as hydroService from '../services/hydroService.js';

export const getHydroFeed = async (req, res, next) => {
  try {
    const feed = await hydroService.getHydroFeed();

    res.status(200).json({
      success: true,
      data: feed
    });
  } catch (error) {
    next(error);
  }
};
