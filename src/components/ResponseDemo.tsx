import React, { useState, useEffect } from 'react';
import SingleFHIRRenderer from './SingleFHIRRenderer';
import { FHIRBundle } from '../types/fhir';
import './ResponseDemo.css';

interface ResponseExample {
  id: string;
  title: string;
  description: string;
  filename: string;
  type: 'request' | 'response';
  workflow: string;
}

const ResponseDemo: React.FC = () => {
  const [selectedResponse, setSelectedResponse] = useState<string>('');
  const [fhirData, setFhirData] = useState<FHIRBundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [availableFiles, setAvailableFiles] = useState<ResponseExample[]>([]);

  // Dynamic file detection based on filename patterns
  const detectFileInfo = (filename: string): Omit<ResponseExample, 'id' | 'filename'> => {
    const lower = filename.toLowerCase();
    
    if (lower.includes('insurance') && lower.includes('plan')) {
      return {
        title: 'Insurance Plan Response',
        description: 'Insurance plan details with coverage and benefits',
        type: lower.includes('req') ? 'request' : 'response',
        workflow: 'Insurance Plan Discovery'
      };
    }
    
    if (lower.includes('eligibility')) {
      return {
        title: 'Eligibility Check ' + (lower.includes('resp') ? 'Response' : 'Request'),
        description: 'Coverage eligibility verification',
        type: lower.includes('resp') ? 'response' : 'request',
        workflow: 'Eligibility Verification'
      };
    }
    
    if (lower.includes('auth') || lower.includes('authorization')) {
      return {
        title: 'Authorization ' + (lower.includes('resp') ? 'Response' : 'Requirements'),
        description: 'Pre-authorization requirements and approval',
        type: lower.includes('resp') ? 'response' : 'request',
        workflow: 'Pre-Authorization'
      };
    }
    
    if (lower.includes('claim')) {
      if (lower.includes('status')) {
        return {
          title: 'Claim Status ' + (lower.includes('resp') ? 'Response' : 'Request'),
          description: 'Claim processing status inquiry',
          type: lower.includes('resp') ? 'response' : 'request',
          workflow: 'Claim Status'
        };
      }
      return {
        title: 'Claim ' + (lower.includes('resp') ? 'Response' : 'Request'),
        description: 'Medical claim submission and processing',
        type: lower.includes('resp') ? 'response' : 'request',
        workflow: 'Claim Processing'
      };
    }
    
    if (lower.includes('coverage')) {
      return {
        title: 'Coverage ' + (lower.includes('resp') ? 'Response' : 'Request'),
        description: 'Insurance coverage details',
        type: lower.includes('resp') ? 'response' : 'request',
        workflow: 'Coverage Inquiry'
      };
    }
    
    if (lower.includes('preauth')) {
      return {
        title: 'Pre-Authorization ' + (lower.includes('resp') ? 'Response' : 'Request'),
        description: 'Treatment pre-authorization',
        type: lower.includes('resp') ? 'response' : 'request',
        workflow: 'Pre-Authorization'
      };
    }
    
    // Default for unknown files
    return {
      title: filename.replace('.json', ''),
      description: 'FHIR resource bundle',
      type: lower.includes('resp') ? 'response' : 'request',
      workflow: 'NHCX Workflow'
    };
  };

  const loadAvailableFiles = async () => {
    try {
      const files: ResponseExample[] = [];
      
      // Try to load manifest first
      let fileNames: string[] = [];
      
      try {
        const manifestResponse = await fetch('/manifest.json');
        if (manifestResponse.ok) {
          const manifest = await manifestResponse.json();
          fileNames = manifest.files || [];
        }
      } catch (err) {
        console.log('No manifest found, trying common patterns...');
      }
      
      // If no manifest, try common patterns
      if (fileNames.length === 0) {
        const patterns = [
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
        ];
        
        for (const pattern of patterns) {
          try {
            const response = await fetch(`/${pattern}`);
            if (response.ok) {
              fileNames.push(pattern);
            }
          } catch (err) {
            // Silently ignore
          }
        }
      }
      
      // Create ResponseExample objects for found files
      fileNames.forEach((filename, index) => {
        const fileInfo = detectFileInfo(filename);
        files.push({
          id: `file-${index}`,
          filename,
          ...fileInfo
        });
      });
      
      // Add main fhir.json if available
      try {
        const response = await fetch('/fhir.json');
        if (response.ok) {
          files.push({
            id: 'fhir-main',
            title: 'Complete Insurance Plan',
            description: 'Full PMJAY Insurance Plan with comprehensive benefits',
            filename: 'fhir.json',
            type: 'response',
            workflow: 'Insurance Plan Discovery'
          });
        }
      } catch (err) {
        // Silently ignore
      }
      
      setAvailableFiles(files);
      
      if (files.length > 0) {
        setSelectedResponse(files[0].id);
      }
    } catch (err) {
      console.error('Error loading available files:', err);
    }
  };

  useEffect(() => {
    loadAvailableFiles();
  }, []);

  useEffect(() => {
    if (selectedResponse) {
      loadResponse(selectedResponse);
    }
  }, [selectedResponse]);

  const loadResponse = async (responseId: string) => {
    const example = availableFiles.find((ex: ResponseExample) => ex.id === responseId);
    if (!example) return;

    setLoading(true);
    setError('');

    try {
      const path = `/${example.filename}`;
      const response = await fetch(path);
      
      if (!response.ok) {
        throw new Error(`Failed to load ${example.filename}`);
      }

      const data = await response.json();
      setFhirData(data as FHIRBundle);
    } catch (err) {
      setError(`Failed to load response: ${err}`);
      console.error('Error loading response:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedExample = availableFiles.find((ex: ResponseExample) => ex.id === selectedResponse);

  return (
    <div className="response-demo">
      <div className="demo-header">
        <div className="header-content">
          <h1>NHCX Response Viewer</h1>
          <p>Individual FHIR response rendering for NHCX Gateway workflows</p>
        </div>
      </div>

      <div className="demo-controls">
        <div className="workflow-selector">
          <label htmlFor="response-select">Select NHCX Response:</label>
          <select
            id="response-select"
            value={selectedResponse}
            onChange={(e) => setSelectedResponse(e.target.value)}
            className="response-select"
          >
            {availableFiles.map((example: ResponseExample) => (
              <option key={example.id} value={example.id}>
                {example.title} ({example.type})
              </option>
            ))}
          </select>
        </div>

        {selectedExample && (
          <div className="workflow-info">
            <div className="workflow-badge">
              <span className="workflow-label">{selectedExample.workflow}</span>
              <span className={`type-badge ${selectedExample.type}`}>
                {selectedExample.type}
              </span>
            </div>
            <p className="workflow-description">{selectedExample.description}</p>
          </div>
        )}
      </div>

      <div className="response-container">
        {loading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading FHIR response...</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <h3>Error Loading Response</h3>
            <p>{error}</p>
            <button 
              onClick={() => selectedResponse && loadResponse(selectedResponse)}
              className="retry-button"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && fhirData && selectedExample && (
          <SingleFHIRRenderer 
            data={fhirData}
            title={selectedExample.title}
            showMetadata={true}
          />
        )}
      </div>

      <div className="usage-info">
        <h3>💡 Usage in Your Application</h3>
        <div className="code-example">
          <h4>Import and Use:</h4>
          <pre><code>{`import SingleFHIRRenderer from './components/SingleFHIRRenderer';

// After receiving response from NHCX Gateway
const handleInsurancePlanResponse = (fhirResponse) => {
  return (
    <SingleFHIRRenderer 
      data={fhirResponse}
      title="Insurance Plan Response"
      showMetadata={true}
    />
  );
};

// For eligibility check response
const handleEligibilityResponse = (fhirResponse) => {
  return (
    <SingleFHIRRenderer 
      data={fhirResponse}
      title="Coverage Eligibility Check"
      showMetadata={false}
    />
  );
};`}</code></pre>
        </div>

        <div className="workflow-examples">
          <h4>Common NHCX Workflows:</h4>
          <div className="workflow-grid">
            <div className="workflow-card">
              <h5>1. Insurance Plan Discovery</h5>
              <p>Request → <strong>Insurance Plan Response</strong></p>
              <code>SingleFHIRRenderer</code>
            </div>
            <div className="workflow-card">
              <h5>2. Eligibility Verification</h5>
              <p>Request → <strong>Eligibility Response</strong></p>
              <code>SingleFHIRRenderer</code>
            </div>
            <div className="workflow-card">
              <h5>3. Pre-Authorization</h5>
              <p>Request → <strong>Auth Requirements</strong></p>
              <code>SingleFHIRRenderer</code>
            </div>
            <div className="workflow-card">
              <h5>4. Claim Processing</h5>
              <p>Claim Request → <strong>Claim Response</strong></p>
              <code>SingleFHIRRenderer</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponseDemo;
