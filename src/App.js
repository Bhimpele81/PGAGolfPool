import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Dashboard from './pages/Dashboard';
import TournamentEntry from './pages/TournamentEntry';
import History from './pages/History';
import Rules from './pages/Rules';
import DraftPicks from './pages/DraftPicks';

function App() {
  return (
    <Router>
      <nav className="navbar">
        <h1>⛳ PGA Golf Pool</h1>
        <Link to="/">Dashboard</Link>
        <Link to="/draft">Draft Picks</Link>
        <Link to="/entry">Tournament Entry</Link>
        <Link to="/history">History</Link>
        <Link to="/rules">Rules</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/draft" element={<DraftPicks />} />
        <Route path="/entry" element={<TournamentEntry />} />
        <Route path="/history" element={<History />} />
        <Route path="/rules" element={<Rules />} />
      </Routes>
    </Router>
  );
}

export default App;