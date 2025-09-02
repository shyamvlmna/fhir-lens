import React, { useState } from 'react';
import { 
  FHIRBundle, 
  FHIRResource, 
  CodeableConcept, 
  Period, 
  Money,
  HumanName,
  Address,
  ContactPoint,
  Identifier
} from '../types/fhir';
import './MultiResourceRenderer.css';

interface MultiResourceRendererProps {
  data: FHIRBundle;
}

const MultiResourceRenderer: React.FC<MultiResourceRendererProps> = ({ data }) => {
  const [selectedResourceType, setSelectedResourceType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN');
  };

  const renderCodeableConcept = (concept?: CodeableConcept): string => {
    if (!concept?.coding?.length) return 'N/A';
    return concept.coding[0].display || concept.coding[0].code || 'N/A';
  };

  const renderMoney = (money?: Money): string => {
    if (!money?.value) return 'N/A';
    return `₹${money.value.toLocaleString('en-IN')}`;
  };

  const renderPeriod = (period?: Period): string => {
    if (!period) return 'N/A';
    return `${formatDate(period.start)} - ${formatDate(period.end)}`;
  };

  const renderHumanName = (names?: HumanName[]): string => {
    if (!names?.length) return 'N/A';
    const name = names[0];
    return name.text || `${name.given?.join(' ') || ''} ${name.family || ''}`.trim() || 'N/A';
  };

  const renderAddress = (addresses?: Address[]): string => {
    if (!addresses?.length) return 'N/A';
    const addr = addresses[0];
    return addr.text || [addr.line?.join(', '), addr.city, addr.state, addr.postalCode].filter(Boolean).join(', ') || 'N/A';
  };

  const renderContactPoint = (contacts?: ContactPoint[]): string => {
    if (!contacts?.length) return 'N/A';
    return contacts.map(c => `${c.system}: ${c.value}`).join(', ');
  };

  const renderIdentifiers = (identifiers?: Identifier[]): string => {
    if (!identifiers?.length) return 'N/A';
    return identifiers.map(id => `${id.system?.split('/').pop()}: ${id.value}`).join(', ');
  };

  const getBundleInfo = () => {
    const resourceCounts: Record<string, number> = {};
    const purposes = new Set<string>();
    
    data.entry?.forEach(entry => {
      if (entry.resource) {
        const type = entry.resource.resourceType;
        resourceCounts[type] = (resourceCounts[type] || 0) + 1;
        
        // Extract purposes for eligibility and claims
        if (entry.resource.resourceType === 'CoverageEligibilityRequest' || 
            entry.resource.resourceType === 'CoverageEligibilityResponse') {
          entry.resource.purpose?.forEach(p => purposes.add(p));
        }
      }
    });

    return { resourceCounts, purposes: Array.from(purposes) };
  };

  const getFilteredResources = () => {
    if (!data.entry) return [];
    
    return data.entry.filter(entry => {
      if (!entry.resource) return false;
      
      const matchesType = selectedResourceType === 'all' || entry.resource.resourceType === selectedResourceType;
      const matchesSearch = !searchTerm || 
        JSON.stringify(entry.resource).toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesType && matchesSearch;
    });
  };

  const renderPatientCard = (resource: any) => (
    <div className="resource-card patient-card">
      <div className="resource-header">
        <h3>👤 Patient</h3>
        <span className="resource-id">{resource.id}</span>
      </div>
      <div className="resource-content">
        <div className="field-row">
          <strong>Name:</strong> {renderHumanName(resource.name)}
        </div>
        <div className="field-row">
          <strong>Gender:</strong> {resource.gender || 'N/A'}
        </div>
        <div className="field-row">
          <strong>Birth Date:</strong> {formatDate(resource.birthDate)}
        </div>
        <div className="field-row">
          <strong>Address:</strong> {renderAddress(resource.address)}
        </div>
        <div className="field-row">
          <strong>Contact:</strong> {renderContactPoint(resource.telecom)}
        </div>
        <div className="field-row">
          <strong>Identifiers:</strong> {renderIdentifiers(resource.identifier)}
        </div>
      </div>
    </div>
  );

  const renderPractitionerCard = (resource: any) => (
    <div className="resource-card practitioner-card">
      <div className="resource-header">
        <h3>👨‍⚕️ Practitioner</h3>
        <span className="resource-id">{resource.id}</span>
      </div>
      <div className="resource-content">
        <div className="field-row">
          <strong>Name:</strong> {renderHumanName(resource.name)}
        </div>
        <div className="field-row">
          <strong>Contact:</strong> {renderContactPoint(resource.telecom)}
        </div>
        <div className="field-row">
          <strong>Address:</strong> {renderAddress(resource.address)}
        </div>
        <div className="field-row">
          <strong>Identifiers:</strong> {renderIdentifiers(resource.identifier)}
        </div>
      </div>
    </div>
  );

  const renderOrganizationCard = (resource: any) => (
    <div className="resource-card organization-card">
      <div className="resource-header">
        <h3>🏥 Organization</h3>
        <span className="resource-id">{resource.id}</span>
      </div>
      <div className="resource-content">
        <div className="field-row">
          <strong>Name:</strong> {resource.name || 'N/A'}
        </div>
        <div className="field-row">
          <strong>Type:</strong> {resource.type?.map(renderCodeableConcept).join(', ') || 'N/A'}
        </div>
        <div className="field-row">
          <strong>Contact:</strong> {renderContactPoint(resource.telecom)}
        </div>
        <div className="field-row">
          <strong>Address:</strong> {renderAddress(resource.address)}
        </div>
        <div className="field-row">
          <strong>Identifiers:</strong> {renderIdentifiers(resource.identifier)}
        </div>
      </div>
    </div>
  );

  const renderClaimCard = (resource: any) => (
    <div className="resource-card claim-card">
      <div className="resource-header">
        <h3>📋 Claim</h3>
        <span className="resource-id">{resource.id}</span>
        <span className={`status-badge ${resource.status}`}>{resource.status}</span>
      </div>
      <div className="resource-content">
        <div className="field-row">
          <strong>Type:</strong> {renderCodeableConcept(resource.type)}
        </div>
        <div className="field-row">
          <strong>Use:</strong> {resource.use || 'N/A'}
        </div>
        <div className="field-row">
          <strong>Created:</strong> {formatDateTime(resource.created)}
        </div>
        <div className="field-row">
          <strong>Billable Period:</strong> {renderPeriod(resource.billablePeriod)}
        </div>
        <div className="field-row">
          <strong>Total:</strong> {renderMoney(resource.total)}
        </div>
        <div className="field-row">
          <strong>Priority:</strong> {renderCodeableConcept(resource.priority)}
        </div>
        {resource.diagnosis && resource.diagnosis.length > 0 && (
          <div className="field-row">
            <strong>Diagnoses:</strong>
            <div className="nested-items">
              {resource.diagnosis.map((diag: any, idx: number) => (
                <div key={idx} className="nested-item">
                  {renderCodeableConcept(diag.diagnosisCodeableConcept)}
                </div>
              ))}
            </div>
          </div>
        )}
        {resource.item && resource.item.length > 0 && (
          <div className="field-row">
            <strong>Items ({resource.item.length}):</strong>
            <div className="nested-items">
              {resource.item.slice(0, 3).map((item: any, idx: number) => (
                <div key={idx} className="nested-item">
                  {renderCodeableConcept(item.productOrService)} - {renderMoney(item.net)}
                </div>
              ))}
              {resource.item.length > 3 && (
                <div className="nested-item">... and {resource.item.length - 3} more</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderEligibilityRequestCard = (resource: any) => (
    <div className="resource-card eligibility-request-card">
      <div className="resource-header">
        <h3>🔍 Eligibility Request</h3>
        <span className="resource-id">{resource.id}</span>
        <span className={`status-badge ${resource.status}`}>{resource.status}</span>
      </div>
      <div className="resource-content">
        <div className="field-row">
          <strong>Purpose:</strong> {resource.purpose?.join(', ') || 'N/A'}
        </div>
        <div className="field-row">
          <strong>Priority:</strong> {renderCodeableConcept(resource.priority)}
        </div>
        <div className="field-row">
          <strong>Created:</strong> {formatDateTime(resource.created)}
        </div>
        <div className="field-row">
          <strong>Identifiers:</strong> {renderIdentifiers(resource.identifier)}
        </div>
        {resource.item && resource.item.length > 0 && (
          <div className="field-row">
            <strong>Items ({resource.item.length}):</strong>
            <div className="nested-items">
              {resource.item.slice(0, 3).map((item: any, idx: number) => (
                <div key={idx} className="nested-item">
                  {renderCodeableConcept(item.productOrService)}
                </div>
              ))}
              {resource.item.length > 3 && (
                <div className="nested-item">... and {resource.item.length - 3} more</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderEligibilityResponseCard = (resource: any) => (
    <div className="resource-card eligibility-response-card">
      <div className="resource-header">
        <h3>✅ Eligibility Response</h3>
        <span className="resource-id">{resource.id}</span>
        <span className={`status-badge ${resource.status}`}>{resource.status}</span>
      </div>
      <div className="resource-content">
        <div className="field-row">
          <strong>Purpose:</strong> {resource.purpose?.join(', ') || 'N/A'}
        </div>
        <div className="field-row">
          <strong>Outcome:</strong> {resource.outcome || 'N/A'}
        </div>
        <div className="field-row">
          <strong>Disposition:</strong> {resource.disposition || 'N/A'}
        </div>
        <div className="field-row">
          <strong>Created:</strong> {formatDateTime(resource.created)}
        </div>
        {resource.insurance && resource.insurance.length > 0 && (
          <div className="field-row">
            <strong>Insurance Coverage:</strong>
            <div className="nested-items">
              {resource.insurance.map((ins: any, idx: number) => (
                <div key={idx} className="nested-item">
                  <div>In Force: {ins.inforce ? 'Yes' : 'No'}</div>
                  {ins.item && ins.item.length > 0 && (
                    <div>Benefits: {ins.item.length} items</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderInsurancePlanCard = (resource: any) => (
    <div className="resource-card insurance-plan-card">
      <div className="resource-header">
        <h3>🛡️ Insurance Plan</h3>
        <span className="resource-id">{resource.id}</span>
        <span className={`status-badge ${resource.status}`}>{resource.status}</span>
      </div>
      <div className="resource-content">
        <div className="field-row">
          <strong>Name:</strong> {resource.name || 'N/A'}
        </div>
        <div className="field-row">
          <strong>Type:</strong> {resource.type?.map(renderCodeableConcept).join(', ') || 'N/A'}
        </div>
        <div className="field-row">
          <strong>Period:</strong> {renderPeriod(resource.period)}
        </div>
        <div className="field-row">
          <strong>Administered By:</strong> {resource.administeredBy?.display || 'N/A'}
        </div>
        {resource.coverage && resource.coverage.length > 0 && (
          <div className="field-row">
            <strong>Coverage:</strong>
            <div className="nested-items">
              {resource.coverage.map((cov: any, idx: number) => (
                <div key={idx} className="nested-item">
                  {renderCodeableConcept(cov.type)} 
                  {cov.benefit && ` (${cov.benefit.length} benefits)`}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderResourceCard = (entry: any, index: number) => {
    const resource = entry.resource;
    if (!resource) return null;

    const key = `${resource.resourceType}-${resource.id || index}`;

    switch (resource.resourceType) {
      case 'Patient':
        return <div key={key}>{renderPatientCard(resource)}</div>;
      case 'Practitioner':
        return <div key={key}>{renderPractitionerCard(resource)}</div>;
      case 'Organization':
        return <div key={key}>{renderOrganizationCard(resource)}</div>;
      case 'Claim':
        return <div key={key}>{renderClaimCard(resource)}</div>;
      case 'CoverageEligibilityRequest':
        return <div key={key}>{renderEligibilityRequestCard(resource)}</div>;
      case 'CoverageEligibilityResponse':
        return <div key={key}>{renderEligibilityResponseCard(resource)}</div>;
      case 'InsurancePlan':
        return <div key={key}>{renderInsurancePlanCard(resource)}</div>;
      default:
        return (
          <div key={key} className="resource-card unknown-card">
            <div className="resource-header">
              <h3>❓ {resource.resourceType}</h3>
              <span className="resource-id">{resource.id}</span>
            </div>
            <div className="resource-content">
              <div className="field-row">
                <strong>Resource Type:</strong> {resource.resourceType}
              </div>
              <div className="field-row">
                <strong>Raw Data:</strong>
                <pre className="json-preview">{JSON.stringify(resource, null, 2).substring(0, 200)}...</pre>
              </div>
            </div>
          </div>
        );
    }
  };

  const { resourceCounts, purposes } = getBundleInfo();
  const filteredResources = getFilteredResources();
  const resourceTypes = Object.keys(resourceCounts);

  return (
    <div className="multi-resource-renderer">
      {/* Header */}
      <div className="bundle-header">
        <div className="bundle-title">
          <h1>NHCX FHIR Bundle Viewer</h1>
          <div className="bundle-meta">
            <span>Bundle ID: {data.id}</span>
            <span>Type: {data.type}</span>
            <span>Timestamp: {formatDateTime(data.timestamp)}</span>
          </div>
        </div>
        
        <div className="bundle-summary">
          <div className="summary-stats">
            <div className="stat-item">
              <div className="stat-number">{data.entry?.length || 0}</div>
              <div className="stat-label">Total Resources</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{resourceTypes.length}</div>
              <div className="stat-label">Resource Types</div>
            </div>
            {purposes.length > 0 && (
              <div className="stat-item">
                <div className="stat-number">{purposes.length}</div>
                <div className="stat-label">Purposes</div>
              </div>
            )}
          </div>
          
          <div className="resource-breakdown">
            {Object.entries(resourceCounts).map(([type, count]) => (
              <div key={type} className="resource-type-count">
                <span className="count">{count}</span>
                <span className="type">{type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="controls-section">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-container">
          <select
            value={selectedResourceType}
            onChange={(e) => setSelectedResourceType(e.target.value)}
            className="resource-filter"
          >
            <option value="all">All Resources ({data.entry?.length || 0})</option>
            {resourceTypes.map(type => (
              <option key={type} value={type}>
                {type} ({resourceCounts[type]})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Resources Grid */}
      <div className="resources-grid">
        {filteredResources.length > 0 ? (
          filteredResources.map((entry, index) => renderResourceCard(entry, index))
        ) : (
          <div className="no-results">
            <h3>No resources found</h3>
            <p>Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiResourceRenderer;
