import React from 'react';
import FHIRBundleViewer from './components/FHIRBundleViewer';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="app">
      <div className="app-nav">
        <div className="nav-content">
          <h1>NHCX FHIR Bundle Viewer</h1>
          <p className="subtitle">Select and explore FHIR bundles in a user-friendly format</p>
        </div>
      </div>

      <div className="app-content">
        <FHIRBundleViewer />
      </div>
    </div>
  );
};

export default App;
