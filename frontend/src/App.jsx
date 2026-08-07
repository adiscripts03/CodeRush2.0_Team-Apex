import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ActivityLogProvider } from './lib/activityLogger';
import { AppProvider, useApp } from './state/AppContext';
import Navbar from './components/Navbar';
import CommandCentre from './pages/CommandCentre';
import CommandMap from './pages/CommandMap';
import NewStuffApp from './newstuff/App';
import ResponsePlanner from './pages/ResponsePlanner';
import ActivityLog from './pages/ActivityLog';
import AlertCentre from './pages/AlertCentre';
import SensorMap from './pages/SensorMap';
import SeismicMap from './pages/SeismicMap';
import EvaluationReport from './pages/EvaluationReport';

function MainLayout() {
  const { isSidebarExpanded } = useApp();
  const location = useLocation();

  if (location.pathname === '/' || location.pathname === '/map') {
    return (
      <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
        <Routes>
          <Route path="/" element={<NewStuffApp initialView="landing" />} />
          <Route path="/map" element={<CommandMap />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-row selection:bg-cyan-500 selection:text-white">
      <Navbar />
      <main className={`flex-1 min-h-screen overflow-x-hidden transition-all duration-300 ${isSidebarExpanded ? 'ml-64' : 'ml-16'}`}>
        <Routes>
          <Route path="/" element={<CommandCentre />} />
          <Route path="/map" element={<CommandMap />} />
          <Route path="/planner" element={<ResponsePlanner />} />
          <Route path="/activity" element={<ActivityLog />} />
          <Route path="/alerts" element={<AlertCentre />} />
          <Route path="/sensor-map" element={<SensorMap />} />
          <Route path="/seismic" element={<SeismicMap />} />
          <Route path="/evaluation" element={<EvaluationReport />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ActivityLogProvider>
      <AppProvider>
        <Router>
          <MainLayout />
        </Router>
      </AppProvider>
    </ActivityLogProvider>
  );
}
