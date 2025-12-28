import React from 'react';
import Scoreboard from './components/Scoreboard/Scoreboard';
import RefPanel from './components/RefPanel/RefPanel';

function App() {
  // Determine which window to render based on URL search params
  const params = new URLSearchParams(window.location.search);
  const windowType = params.get('window') || 'scoreboard';

  return windowType === 'refpanel' ? <RefPanel /> : <Scoreboard />;
}

export default App;

