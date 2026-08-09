import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ActivityLogProvider } from './lib/activityLogger';
import { AppProvider, useApp } from './state/AppContext';
import { WalletProvider, useWallet } from './lib/walletContext';
import Navbar from './components/Navbar';
import PaymentModal from './components/PaymentModal';
import CommandCentre from './pages/CommandCentre';
import CommandMap from './pages/CommandMap';
import NewStuffApp from './newstuff/App';
import ResponsePlanner from './pages/ResponsePlanner';
import ActivityLog from './pages/ActivityLog';
import AlertCentre from './pages/AlertCentre';
import SensorMap from './pages/SensorMap';
import SeismicMap from './pages/SeismicMap';
import EvaluationReport from './pages/EvaluationReport';
import { createWalletClient, custom } from 'viem';
import { baseSepolia, base } from 'viem/chains';

/**
 * Bridge component to expose the wallet client globally for x402Client.js
 * (The x402 client callbacks need access to the wallet client, but they run
 * outside React's component tree. This bridge syncs the React state to a
 * global reference that x402Client.js can access.)
 */
function WalletBridge() {
  const { address, walletClient } = useWallet();

  useEffect(() => {
    if (walletClient) {
      window._x402WalletClient = walletClient;
    } else if (address && window.ethereum) {
      // Create a wallet client if the context hasn't provided one yet
      const targetChainId = import.meta.env.VITE_X402_NETWORK === 'eip155:8453' ? 8453 : 84532;
      const chain = targetChainId === 8453 ? base : baseSepolia;
      const client = createWalletClient({
        account: address,
        chain,
        transport: custom(window.ethereum),
      });
      window._x402WalletClient = client;
    } else {
      window._x402WalletClient = null;
    }
  }, [address, walletClient]);

  return null;
}

function MainLayout() {
  const { isSidebarExpanded } = useApp();
  const location = useLocation();

  if (location.pathname === '/' || location.pathname === '/map') {
    return (
      <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
        <Routes>
          <Route path="/" element={<NewStuffApp initialView="landing" />} />
          <Route path="/map" element={<NewStuffApp initialView="public" />} />
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
    <WalletProvider>
      <ActivityLogProvider>
        <AppProvider>
          <Router>
            <WalletBridge />
            <PaymentModal />
            <MainLayout />
          </Router>
        </AppProvider>
      </ActivityLogProvider>
    </WalletProvider>
  );
}
