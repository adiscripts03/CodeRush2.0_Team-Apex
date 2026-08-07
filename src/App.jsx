import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ActivityLogProvider } from './lib/activityLogger';
import { AppProvider } from './state/AppContext';
import Navbar from './components/Navbar';
import CommandCentre from './pages/CommandCentre';
import CommandMap from './pages/CommandMap';
import ResponsePlanner from './pages/ResponsePlanner';
import ActivityLog from './pages/ActivityLog';
import AlertCentre from './pages/AlertCentre';
import SensorMap from './pages/SensorMap';

export default function App() {
  return (
    <ActivityLogProvider>
      <AppProvider>
        <Router>
          <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-cyan-500 selection:text-white">
            <Navbar />
            <div className="flex-1">
              <Routes>
                <Route path="/" element={<CommandCentre />} />
                <Route path="/map" element={<CommandMap />} />
                <Route path="/planner" element={<ResponsePlanner />} />
                <Route path="/activity" element={<ActivityLog />} />
                <Route path="/alerts" element={<AlertCentre />} />
                <Route path="/sensor-map" element={<SensorMap />} />
              </Routes>
            </div>
          </div>
        </Router>
      </AppProvider>
    </ActivityLogProvider>
  );
}
