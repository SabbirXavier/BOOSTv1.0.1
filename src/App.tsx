import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import TipPage from './pages/TipPage';
import OverlayPage from './pages/OverlayPage';
import Navbar from './components/layout/Navbar';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-orange-500/30 selection:text-orange-200">
        <Toaster position="top-right" theme="dark" closeButton />
        <Routes>
          {/* Overlay routes don't show Navbar */}
          <Route path="/overlay/:widgetId" element={<OverlayPage />} />
          
          <Route path="*" element={
            <>
              <Navbar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/t/:username" element={<TipPage />} />
              </Routes>
            </>
          } />
        </Routes>
      </div>
    </Router>
  );
}
