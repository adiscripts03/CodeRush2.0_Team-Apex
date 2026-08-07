import * as turf from '@turf/turf';

/**
 * Calculates the spatial Intersection over Union (IoU) between two polygons/multipolygons.
 * @param {Feature<Polygon|MultiPolygon>} predicted 
 * @param {Feature<Polygon|MultiPolygon>} groundTruth 
 * @returns {number} IoU score between 0.0 and 1.0
 */
export function calculateSpatialIoU(predicted, groundTruth) {
  if (!predicted || !groundTruth) return 0;
  
  try {
    const intersection = turf.intersect(turf.featureCollection([predicted, groundTruth]));
    const union = turf.union(turf.featureCollection([predicted, groundTruth]));
    
    if (!intersection || !union) return 0;
    
    const intersectionArea = turf.area(intersection);
    const unionArea = turf.area(union);
    
    if (unionArea === 0) return 0;
    return intersectionArea / unionArea;
  } catch (error) {
    console.error('Error calculating IoU:', error);
    return 0;
  }
}

/**
 * Evaluates the full timeline of predicted hazard keyframes against the ground truth.
 * @param {Object} timelineData - The event timeline JSON
 * @param {Object} groundTruthGeojson - The ground truth flood polygon (e.g. Aug 17 peak)
 * @param {Object} predictedGeojsonMap - A map of filename -> GeoJSON to use for each keyframe
 * @returns {Object} Evaluation metrics
 */
export function evaluatePostEvent(timelineData, groundTruthGeojson, predictedGeojsonMap) {
  if (!timelineData || !timelineData.keyframes || !groundTruthGeojson) {
    return {
      iouScores: [],
      averageIoU: 0,
      detectionLeadTimeHours: 0,
      calibration: [],
      falseAlarmRate: 0,
      resourceFeasibility: 0
    };
  }

  // 1. Combine ground truth into single feature
  let groundTruthFeature = null;
  try {
    const valid = groundTruthGeojson.features.filter(f => f.geometry);
    groundTruthFeature = valid.length === 1 ? valid[0] : turf.combine(turf.featureCollection(valid)).features[0];
  } catch(e) {
    groundTruthFeature = groundTruthGeojson.features[0];
  }

  const iouScores = [];
  const calibrationBins = {
    'High Confidence (>0.8)': { count: 0, sumIoU: 0 },
    'Medium Confidence (0.5-0.8)': { count: 0, sumIoU: 0 },
    'Low Confidence (<0.5)': { count: 0, sumIoU: 0 }
  };

  let firstHighConfidenceTime = null;
  const peakTime = new Date('2018-08-17T00:00:00Z').getTime(); // Based on peak keyframe
  let falseAlarms = 0;

  timelineData.keyframes.forEach(kf => {
    const predictedData = predictedGeojsonMap[kf.hazard_polygon_file];
    let iou = 0;
    
    if (predictedData) {
      try {
        const valid = predictedData.features.filter(f => f.geometry);
        const predictedFeature = valid.length === 1 ? valid[0] : turf.combine(turf.featureCollection(valid)).features[0];
        iou = calculateSpatialIoU(predictedFeature, groundTruthFeature);
      } catch (e) {
        // Fallback or error
      }
    }

    iouScores.push({
      label: kf.label,
      timestamp: kf.timestamp,
      iou: iou,
      confidence: kf.confidence
    });

    // Calibration
    if (kf.confidence > 0.8) {
      calibrationBins['High Confidence (>0.8)'].count++;
      calibrationBins['High Confidence (>0.8)'].sumIoU += iou;
    } else if (kf.confidence >= 0.5) {
      calibrationBins['Medium Confidence (0.5-0.8)'].count++;
      calibrationBins['Medium Confidence (0.5-0.8)'].sumIoU += iou;
    } else {
      calibrationBins['Low Confidence (<0.5)'].count++;
      calibrationBins['Low Confidence (<0.5)'].sumIoU += iou;
    }

    // False Alarms: High confidence but low IoU against ground truth
    if (kf.confidence > 0.8 && iou < 0.3) {
      falseAlarms++;
    }

    // Detection Lead Time (when did we first cross 80% confidence?)
    if (kf.confidence >= 0.8 && !firstHighConfidenceTime) {
      firstHighConfidenceTime = new Date(kf.timestamp).getTime();
    }
  });

  // Calculate Calibration Averages
  const calibration = Object.keys(calibrationBins).map(key => ({
    bin: key,
    avgIoU: calibrationBins[key].count > 0 ? (calibrationBins[key].sumIoU / calibrationBins[key].count) : 0
  }));

  let detectionLeadTimeHours = 0;
  if (firstHighConfidenceTime && firstHighConfidenceTime < peakTime) {
    detectionLeadTimeHours = (peakTime - firstHighConfidenceTime) / (1000 * 60 * 60);
  }

  const falseAlarmRate = iouScores.length > 0 ? (falseAlarms / iouScores.length) : 0;

  // Mock resource feasibility (normally this would simulate the plans against actual capacity limits)
  // We assume 85% of generated plans were structurally feasible based on final road network.
  const resourceFeasibility = 0.85;

  return {
    iouScores,
    averageIoU: iouScores.length > 0 ? iouScores.reduce((acc, val) => acc + val.iou, 0) / iouScores.length : 0,
    detectionLeadTimeHours,
    calibration,
    falseAlarmRate,
    resourceFeasibility
  };
}
