import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useActivityLog } from '../lib/activityLogger';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { logEvent } = useActivityLog();

  // Timeline state
  const [timelineData, setTimelineData] = useState(null);
  const [currentKeyframeIndex, setCurrentKeyframeIndex] = useState(0);
  const [isPlayingTimeline, setIsPlayingTimeline] = useState(false);

  // Layer visibility state
  const [layerVisibility, setLayerVisibility] = useState({
    hospitals: true,
    shelters: true,
    roads: true,
    rivers: true,
    flood: true,
  });

  // Loaded GeoJSON datasets
  const [geoData, setGeoData] = useState({
    hospitals: null,
    shelters: null,
    roads: null,
    rivers: null,
    floodPolygon: null,
    shelterCapacities: null,
    sensors: null,
    isLoading: true,
    error: null,
  });

  // Response planning state
  const [recommendedActions, setRecommendedActions] = useState([]);
  const [actionStates, setActionStates] = useState({}); // id -> { status: 'pending'|'approved'|'rejected', notes: string }
  
  // Sent alerts state
  const [sentAlerts, setSentAlerts] = useState([]);

  // Fetch initial event timeline and static datasets
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [
          timelineRes,
          hospitalsRes,
          sheltersRes,
          roadsRes,
          riversRes,
          capacitiesRes,
          sensorsRes,
          seismicRes
        ] = await Promise.all([
          fetch('/data/event_timeline.json'),
          fetch('/data/hospitals.geojson'),
          fetch('/data/shelters.geojson'),
          fetch('/data/roads.geojson'),
          fetch('/data/rivers.geojson'),
          fetch('/data/shelters_capacity.json'),
          fetch('/data/sensor_log.json'),
          fetch('/data/seismic_events.json')
        ]);

        const timeline = await timelineRes.json();
        const hospitals = await hospitalsRes.json();
        const shelters = await sheltersRes.json();
        const roads = await roadsRes.json();
        const rivers = await riversRes.json();
        const capacities = await capacitiesRes.json();
        const sensors = await sensorsRes.json();
        const seismic = await seismicRes.json();

        setTimelineData(timeline);

        // Load initial keyframe flood polygon
        const initialKeyframe = timeline.keyframes[0];
        const floodRes = await fetch(`/data/${initialKeyframe.hazard_polygon_file}`);
        const floodGeojson = await floodRes.json();

        setGeoData({
          hospitals,
          shelters,
          roads,
          rivers,
          floodPolygon: floodGeojson,
          shelterCapacities: capacities,
          sensors,
          seismic,
          isLoading: false,
          error: null,
        });

      } catch (err) {
        console.error('Error loading geojson data:', err);
        setGeoData(prev => ({ ...prev, isLoading: false, error: err.message }));
      }
    }

    loadInitialData();
  }, []);

  // Handle keyframe change
  const setKeyframeIndex = useCallback(async (index) => {
    if (!timelineData || !timelineData.keyframes[index]) return;
    const keyframe = timelineData.keyframes[index];
    setCurrentKeyframeIndex(index);

    try {
      const floodRes = await fetch(`/data/${keyframe.hazard_polygon_file}`);
      const floodGeojson = await floodRes.json();
      setGeoData(prev => ({ ...prev, floodPolygon: floodGeojson }));

      // Log event
      logEvent({
        type: 'observation',
        message: `Scrubbed timeline to ${keyframe.label || keyframe.timestamp}. Confidence: ${(keyframe.confidence * 100).toFixed(0)}%${keyframe.data_gap ? ' (Data Gap Warning)' : ''}`,
        timestamp: new Date().toISOString(),
        details: { keyframe }
      });
    } catch (err) {
      console.error('Failed to load keyframe hazard polygon:', err);
    }
  }, [timelineData, logEvent]);

  // Toggle layer visibility
  const toggleLayer = useCallback((layerKey) => {
    setLayerVisibility(prev => ({
      ...prev,
      [layerKey]: !prev[layerKey]
    }));
  }, []);

  // Action state handlers (Approve, Edit, Reject)
  const updateActionStatus = useCallback((actionId, newStatus, customNotes = '') => {
    setActionStates(prev => {
      const updated = {
        ...prev,
        [actionId]: {
          status: newStatus, // 'approved' | 'rejected' | 'pending'
          notes: customNotes || prev[actionId]?.notes || '',
          updatedAt: new Date().toISOString()
        }
      };
      return updated;
    });

    const actionObj = recommendedActions.find(a => a.id === actionId);
    const actionTitle = actionObj ? actionObj.title : `Action #${actionId}`;

    logEvent({
      type: newStatus === 'approved' ? 'approval' : 'plan',
      message: `Action "${actionTitle}" was marked as ${newStatus.toUpperCase()}${customNotes ? ` (Notes: ${customNotes})` : ''}.`,
      timestamp: new Date().toISOString()
    });
  }, [recommendedActions, logEvent]);

  // Add sent alert
  const recordSentAlert = useCallback((alertRecord) => {
    setSentAlerts(prev => [alertRecord, ...prev]);
    logEvent({
      type: 'alert',
      message: `Emergency Alert sent to ${alertRecord.recipientEmail}: "${alertRecord.subject}"`,
      timestamp: new Date().toISOString(),
      details: alertRecord
    });
  }, [logEvent]);

  const value = {
    timelineData,
    currentKeyframeIndex,
    currentKeyframe: timelineData?.keyframes?.[currentKeyframeIndex] || null,
    setKeyframeIndex,
    isPlayingTimeline,
    setIsPlayingTimeline,
    layerVisibility,
    toggleLayer,
    geoData,
    recommendedActions,
    setRecommendedActions,
    actionStates,
    updateActionStatus,
    sentAlerts,
    recordSentAlert,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
