import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Logo } from './components/Logo';
import CreateRoom from './pages/CreateRoom';
import RoomLobby from './pages/RoomLobby';
import Survey from './pages/Survey';
import PlanSelection from './pages/PlanSelection';
import TripLobby from './pages/TripLobby';
import TripReport from './pages/TripReport';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-4xl mx-auto p-4"
      >
        <Routes location={location}>
          <Route path="/" element={<CreateRoom />} />
          <Route path="/room/:roomId" element={<RoomLobby />} />
          <Route path="/room/:roomId/survey/:memberId" element={<Survey />} />
          <Route path="/room/:roomId/plans" element={<PlanSelection />} />
          <Route path="/trip/:tripId" element={<TripLobby />} />
          <Route path="/trip/:tripId/report" element={<TripReport />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo size="md" showText={false} />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                  Ody'sai
                </h1>
                <p className="text-xs text-slate-500 font-medium">AI Travel Companion</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              <a href="#" className="hover:text-primary-600 transition-colors">About</a>
              <a href="#" className="hover:text-primary-600 transition-colors">Features</a>
              <a href="#" className="hover:text-primary-600 transition-colors">Contact</a>
            </nav>
          </div>
        </header>

        <main className="flex-1 flex flex-col">
          <AnimatedRoutes />
        </main>

        <footer className="py-8 text-center text-slate-400 text-sm">
          <p>© 2024 Ody'sai. All rights reserved.</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
