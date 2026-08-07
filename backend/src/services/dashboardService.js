import Hospital from '../models/Hospital.js';
import Shelter from '../models/Shelter.js';
import RoadSegment from '../models/RoadSegment.js';
import ResponseAction from '../models/ResponseAction.js';
import Alert from '../models/Alert.js';

export const getDashboardStats = async () => {
  try {
    // Run all database queries in parallel for performance
    const [
      hospitalCount,
      shelterCount,
      roadsSubmergedCount,
      pendingApprovalsCount,
      alertsCount
    ] = await Promise.all([
      Hospital.countDocuments(),
      Shelter.countDocuments(),
      RoadSegment.countDocuments({ status: 'submerged' }),
      ResponseAction.countDocuments({ status: 'pending' }),
      Alert.countDocuments()
    ]);

    // For Flood Area and Population Affected, we use simulation data 
    // as it aligns with the 2018 Kerala Flood context. 
    // In a full production system, Flood Area would be calculated via Turf.js 
    // using the latest FloodPolygon geometry.
    const floodAreaHectares = 45000; 
    const populationAffected = 500000;

    return {
      floodArea: floodAreaHectares,
      populationAffected,
      roadsSubmerged: roadsSubmergedCount,
      hospitals: hospitalCount,
      shelters: shelterCount,
      pendingApprovals: pendingApprovalsCount,
      alerts: alertsCount
    };
  } catch (error) {
    throw new Error(`Error fetching dashboard stats: ${error.message}`);
  }
};
