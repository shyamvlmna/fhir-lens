import React from 'react';
import FHIRRenderer from './components/FHIRRenderer';
import { initNHCXService } from './config/nhcxConfig';
import './App.css';

const App: React.FC = () => {
  // Initialize NHCX API service on app startup
  React.useEffect(() => {
    try {
      initNHCXService();
    } catch (error) {
      console.warn('NHCX API initialization skipped:', error);
    }
  }, []);

  return (
    <div className="app">
      <div className="app-nav">
        <div className="nav-content">
          <h1>NHCX FHIR Bundle Viewer</h1>
          <p className="subtitle">Select and explore FHIR bundles in a user-friendly format</p>
        </div>
      </div>

      <div className="app-content">
        <FHIRRenderer />
      </div>
    </div>
  );
};

export default App;
