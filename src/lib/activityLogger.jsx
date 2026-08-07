import React, { createContext, useContext, useReducer, useCallback } from 'react';

// Activity Log Context
const ActivityLogContext = createContext(null);

const INITIAL_LOGS = [
  {
    id: 'log-init-1',
    type: 'observation',
    message: 'Flood simulation historical replay session initialized. Region: Alappuzha & Kottayam.',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'log-init-2',
    type: 'observation',
    message: 'Loaded satellite flood extent keyframe for 14 Aug 2018 (28,737 ha).',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  }
];

function logReducer(state, action) {
  switch (action.type) {
    case 'ADD_LOG':
      return [
        {
          id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          type: action.payload.type || 'observation', // 'observation' | 'plan' | 'approval' | 'alert'
          message: action.payload.message,
          timestamp: action.payload.timestamp || new Date().toISOString(),
          details: action.payload.details || null,
        },
        ...state,
      ];
    case 'CLEAR_LOGS':
      return [];
    default:
      return state;
  }
}

export function ActivityLogProvider({ children }) {
  const [logs, dispatch] = useReducer(logReducer, INITIAL_LOGS);

  const logEvent = useCallback(({ type = 'observation', message, timestamp, details }) => {
    dispatch({
      type: 'ADD_LOG',
      payload: { type, message, timestamp, details },
    });
  }, []);

  const clearLogs = useCallback(() => {
    dispatch({ type: 'CLEAR_LOGS' });
  }, []);

  return (
    <ActivityLogContext.Provider value={{ logs, logEvent, clearLogs }}>
      {children}
    </ActivityLogContext.Provider>
  );
}

export function useActivityLog() {
  const context = useContext(ActivityLogContext);
  if (!context) {
    throw new Error('useActivityLog must be used within an ActivityLogProvider');
  }
  return context;
}
