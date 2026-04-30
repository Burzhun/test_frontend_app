import React, { useState } from 'react';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import './App.css';

export default function App() {
  const [refreshToken, setRefreshToken] = useState(0);
  const triggerRefresh = () => setRefreshToken((t) => t + 1);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Item Selector</h1>
      </header>
      <div className="panels">
        <LeftPanel onSelect={triggerRefresh} />
        <RightPanel refreshToken={refreshToken} onDeselect={triggerRefresh} />
      </div>
    </div>
  );
}
