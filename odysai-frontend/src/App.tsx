import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CreateRoom from './pages/CreateRoom';
import RoomLobby from './pages/RoomLobby';
import Survey from './pages/Survey';
import PlanSelection from './pages/PlanSelection';
import TripLobby from './pages/TripLobby';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="app-header">
          <h1>Ody'sai</h1>
          <p>AI와 함께 그려가는 여행</p>
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<CreateRoom />} />
            <Route path="/room/:roomId" element={<RoomLobby />} />
            <Route path="/room/:roomId/survey/:memberId" element={<Survey />} />
            <Route path="/room/:roomId/plans" element={<PlanSelection />} />
            <Route path="/trip/:tripId" element={<TripLobby />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
