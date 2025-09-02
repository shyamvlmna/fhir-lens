import React, { useState, useEffect } from 'react';
import { FHIRBundle } from '../types/fhir';
import MultiResourceRenderer from './MultiResourceRenderer';
import './FHIRFileLoader.css';

interface FHIRFile {
  name: string;
  data: FHIRBundle;
}

const FHIRFileLoader: React.FC = () => {
  const [fhirFiles, setFhirFiles] = useState<FHIRFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadSampleFiles();
  }, []);

  const loadSampleFiles = async () => {
    setLoading(true);
    try {
      // Try to fetch a directory listing or use a known pattern
      const loadedFiles: FHIRFile[] = [];
      
      // First, try to load a manifest file if it exists
      let fileNames: string[] = [];
      
      try {
        const manifestResponse = await fetch('/manifest.json');
        if (manifestResponse.ok) {
          const manifest = await manifestResponse.json();
          fileNames = manifest.files || [];
        }
      } catch (err) {
        console.log('No manifest.json found, trying common patterns...');
      }
      
      // If no manifest, try common NHCX file patterns
      if (fileNames.length === 0) {
        const commonPatterns = [
          'authRequirementsReq.json',
          'authRequirementsResp.json',
          'claimReq.json',
          'claimResp.json',
          'claimStatusReq.json',
          'claimStatusResp.json',
          'eligibilityCheckReq.json',
          'eligibilityCheckResp.json',
          'insurancePlanReq.json',
          'insurancePlanResp.json',
          'preAuthReq.json',
          'preAuthResp.json',
          'coverageReq.json',
          'coverageResp.json',
          // Add any additional patterns you might use
        ];
        
        // Try each pattern and add successful ones
        for (const pattern of commonPatterns) {
          try {
            const response = await fetch(`/${pattern}`);
            if (response.ok) {
              fileNames.push(pattern);
            }
          } catch (err) {
            // Silently ignore missing files
          }
        }
      }

      // Load all found files
      for (const fileName of fileNames) {
        try {
          const response = await fetch(`/${fileName}`);
          if (response.ok) {
            const data = await response.json();
            loadedFiles.push({
              name: fileName,
              data: data as FHIRBundle
            });
          }
        } catch (err) {
          console.warn(`Failed to load ${fileName}:`, err);
        }
      }

      // Also try to load the main fhir.json file
      try {
        const response = await fetch('/fhir.json');
        if (response.ok) {
          const data = await response.json();
          loadedFiles.push({
            name: 'fhir.json (Insurance Plan)',
            data: data as FHIRBundle
          });
        }
      } catch (err) {
        console.warn('Failed to load fhir.json:', err);
      }

      setFhirFiles(loadedFiles);
      if (loadedFiles.length > 0) {
        setSelectedFile(loadedFiles[0].name);
      }
    } catch (err) {
      setError('Failed to load FHIR files');
      console.error('Error loading files:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          const newFile: FHIRFile = {
            name: file.name,
            data: data as FHIRBundle
          };
          setFhirFiles(prev => [...prev, newFile]);
          setSelectedFile(newFile.name);
        } catch (err) {
          setError('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    }
  };

  const getFileTypeLabel = (fileName: string): string => {
    if (fileName.includes('claim')) return 'Claim';
    if (fileName.includes('eligibility')) return 'Eligibility';
    if (fileName.includes('auth')) return 'Authorization';
    if (fileName.includes('insurance')) return 'Insurance Plan';
    if (fileName.includes('fhir.json')) return 'Insurance Plan';
    return 'FHIR Bundle';
  };

  const getFileTypeIcon = (fileName: string): string => {
    if (fileName.includes('claim')) return '📋';
    if (fileName.includes('eligibility')) return '🔍';
    if (fileName.includes('auth')) return '🔐';
    if (fileName.includes('insurance')) return '🛡️';
    if (fileName.includes('fhir.json')) return '🛡️';
    return '📄';
  };

  const selectedFileData = fhirFiles.find(f => f.name === selectedFile);

  if (loading) {
    return (
      <div className="fhir-loader">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <h2>Loading FHIR Files...</h2>
          <p>Please wait while we load the sample FHIR resources.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fhir-loader">
        <div className="error-state">
          <h2>Error Loading Files</h2>
          <p>{error}</p>
          <button onClick={loadSampleFiles} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fhir-loader">
      {/* File Selection Header */}
      <div className="file-selector-header">
        <div className="header-content">
          <h1>NHCX FHIR Resource Viewer</h1>
          <p>View and analyze various NHCX FHIR resource types</p>
        </div>
        
        <div className="file-controls">
          <div className="file-dropdown">
            <select
              value={selectedFile}
              onChange={(e) => setSelectedFile(e.target.value)}
              className="file-select"
            >
              <option value="">Select a FHIR file...</option>
              {fhirFiles.map(file => (
                <option key={file.name} value={file.name}>
                  {getFileTypeIcon(file.name)} {file.name} ({getFileTypeLabel(file.name)})
                </option>
              ))}
            </select>
          </div>
          
          <div className="upload-section">
            <label htmlFor="file-upload" className="upload-button">
              📁 Upload FHIR File
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="file-input"
            />
          </div>
        </div>
      </div>

      {/* File Summary */}
      {fhirFiles.length > 0 && (
        <div className="files-summary">
          <h3>Available Files ({fhirFiles.length})</h3>
          <div className="files-grid">
            {fhirFiles.map(file => (
              <div
                key={file.name}
                className={`file-card ${selectedFile === file.name ? 'selected' : ''}`}
                onClick={() => setSelectedFile(file.name)}
              >
                <div className="file-icon">{getFileTypeIcon(file.name)}</div>
                <div className="file-info">
                  <div className="file-name">{file.name}</div>
                  <div className="file-type">{getFileTypeLabel(file.name)}</div>
                  <div className="file-resources">
                    {file.data.entry?.length || 0} resources
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Render Selected File */}
      {selectedFileData ? (
        <div className="selected-file-content">
          <MultiResourceRenderer data={selectedFileData.data} />
        </div>
      ) : fhirFiles.length === 0 ? (
        <div className="empty-state">
          <h2>No FHIR Files Found</h2>
          <p>Upload a FHIR JSON file to get started, or check that the resources folder contains the sample files.</p>
        </div>
      ) : (
        <div className="empty-state">
          <h2>Select a File</h2>
          <p>Choose a FHIR file from the dropdown above to view its contents.</p>
        </div>
      )}
    </div>
  );
};

export default FHIRFileLoader;
