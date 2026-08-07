import HydroStation from '../models/HydroStation.js';

export const getHydroFeed = async () => {
  try {
    const stations = await HydroStation.find().sort({ lastReadingAt: -1 }).lean();
    
    // Map database models to the specific response structure requested
    const feed = stations.map(station => {
      // Derive a danger level (0 to 3) based on the textual status
      let dangerLevel = 0;
      switch (station.status) {
        case 'Orange Alert': dangerLevel = 1; break;
        case 'Red Alert': dangerLevel = 2; break;
        case 'Overflowing': dangerLevel = 3; break;
        default: dangerLevel = 0;
      }

      return {
        stationName: station.name,
        river: station.locationName || 'Unknown River',
        waterLevel: station.capacityPercent,
        dangerLevel: dangerLevel,
        status: station.status,
        timestamp: station.lastReadingAt
      };
    });

    return feed;
  } catch (error) {
    throw new Error(`Error fetching hydro feed: ${error.message}`);
  }
};
