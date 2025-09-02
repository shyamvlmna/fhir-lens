import React from 'react';
import { 
  FHIRBundle, 
  CodeableConcept, 
  Period, 
  Money,
  HumanName,
  Address,
  ContactPoint,
  Identifier
} from '../types/fhir';
import './SingleFHIRRenderer.css';

interface SingleFHIRRendererProps {
  data: FHIRBundle;
  title?: string;
  showMetadata?: boolean;
}

const SingleFHIRRenderer: React.FC<SingleFHIRRendererProps> = ({ 
  data, 
  title,
  showMetadata = true 
}) => {
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

  const getResourceTypeInfo = (resourceType: string) => {
    const typeMap: Record<string, { icon: string; color: string; label: string }> = {
      'InsurancePlan': { icon: '🛡️', color: '#ec4899', label: 'Insurance Plan' },
      'CoverageEligibilityRequest': { icon: '🔍', color: '#06b6d4', label: 'Eligibility Request' },
      'CoverageEligibilityResponse': { icon: '✅', color: '#84cc16', label: 'Eligibility Response' },
      'Claim': { icon: '📋', color: '#f59e0b', label: 'Claim' },
      'ClaimResponse': { icon: '📄', color: '#10b981', label: 'Claim Response' },
      'Patient': { icon: '👤', color: '#3b82f6', label: 'Patient' },
      'Practitioner': { icon: '👨‍⚕️', color: '#10b981', label: 'Practitioner' },
      'Organization': { icon: '🏥', color: '#8b5cf6', label: 'Organization' },
      'Coverage': { icon: '🛡️', color: '#f97316', label: 'Coverage' }
    };
    return typeMap[resourceType] || { icon: '📄', color: '#6b7280', label: resourceType };
  };

  const getBundleTypeInfo = () => {
    if (!data.entry?.length) return { icon: '📄', color: '#6b7280', label: 'Empty Bundle' };
    
    const mainResource = data.entry[0].resource;
    if (!mainResource) return { icon: '📄', color: '#6b7280', label: 'Unknown Bundle' };
    
    return getResourceTypeInfo(mainResource.resourceType);
  };

  const renderInsurancePlanResponse = (resource: any) => (
    <div className="resource-details">
      <div className="detail-section">
        <h3>Plan Information</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <label>Plan Name</label>
            <span>{resource.name || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <label>Status</label>
            <span className={`status-badge ${resource.status}`}>{resource.status?.toUpperCase()}</span>
          </div>
          <div className="detail-item">
            <label>Type</label>
            <span>{resource.type?.map(renderCodeableConcept).join(', ') || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <label>Validity Period</label>
            <span>{renderPeriod(resource.period)}</span>
          </div>
          <div className="detail-item">
            <label>Administered By</label>
            <span>{resource.administeredBy?.display || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <label>Owned By</label>
            <span>{resource.ownedBy?.display || 'N/A'}</span>
          </div>
        </div>
      </div>

      {resource.coverage && resource.coverage.length > 0 && (
        <div className="detail-section">
          <h3>Coverage Summary</h3>
          {resource.coverage.map((coverage: any, idx: number) => (
            <div key={idx} className="coverage-summary">
              <div className="coverage-header">
                <h4>{renderCodeableConcept(coverage.type)}</h4>
                {coverage.benefit && (
                  <span className="benefit-count">{coverage.benefit.length} benefits</span>
                )}
              </div>
              {coverage.benefit && coverage.benefit.length > 0 && (
                <div className="benefits-preview">
                  <h5>Top Benefits</h5>
                  <div className="benefits-grid">
                    {coverage.benefit.slice(0, 6).map((benefit: any, benefitIdx: number) => (
                      <div key={benefitIdx} className="benefit-preview">
                        <div className="benefit-name">{renderCodeableConcept(benefit.type)}</div>
                        <div className="benefit-amount">
                          {benefit.limit?.[0]?.value?.value ? renderMoney(benefit.limit[0].value) : 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                  {coverage.benefit.length > 6 && (
                    <div className="more-benefits">
                      + {coverage.benefit.length - 6} more benefits
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderEligibilityResponse = (resource: any) => (
    <div className="resource-details">
      <div className="detail-section">
        <h3>Response Information</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <label>Status</label>
            <span className={`status-badge ${resource.status}`}>{resource.status?.toUpperCase()}</span>
          </div>
          <div className="detail-item">
            <label>Purpose</label>
            <span>{resource.purpose?.join(', ') || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <label>Outcome</label>
            <span className={`outcome ${resource.outcome?.toLowerCase()}`}>{resource.outcome || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <label>Created</label>
            <span>{formatDateTime(resource.created)}</span>
          </div>
          <div className="detail-item">
            <label>Disposition</label>
            <span>{resource.disposition || 'N/A'}</span>
          </div>
        </div>
      </div>

      {resource.insurance && resource.insurance.length > 0 && (
        <div className="detail-section">
          <h3>Coverage Details</h3>
          {resource.insurance.map((insurance: any, idx: number) => (
            <div key={idx} className="insurance-details">
              <div className="insurance-header">
                <h4>Coverage {idx + 1}</h4>
                <span className={`coverage-status ${insurance.inforce ? 'active' : 'inactive'}`}>
                  {insurance.inforce ? 'In Force' : 'Not In Force'}
                </span>
              </div>
              
              {insurance.item && insurance.item.length > 0 && (
                <div className="eligibility-items">
                  <h5>Covered Items ({insurance.item.length})</h5>
                  <div className="items-grid">
                    {insurance.item.map((item: any, itemIdx: number) => (
                      <div key={itemIdx} className="eligibility-item">
                        <div className="item-header">
                          <span className="item-name">{renderCodeableConcept(item.productOrService)}</span>
                          <span className={`item-status ${item.excluded ? 'excluded' : 'covered'}`}>
                            {item.excluded ? 'Excluded' : 'Covered'}
                          </span>
                        </div>
                        {item.benefit && item.benefit.length > 0 && (
                          <div className="item-benefits">
                            {item.benefit.map((benefit: any, benefitIdx: number) => (
                              <div key={benefitIdx} className="benefit-detail">
                                <span className="benefit-type">{renderCodeableConcept(benefit.type)}</span>
                                <span className="benefit-value">
                                  {benefit.allowedMoney ? renderMoney(benefit.allowedMoney) : 'N/A'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderClaimResponse = (resource: any) => (
    <div className="resource-details">
      <div className="detail-section">
        <h3>Claim Information</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <label>Status</label>
            <span className={`status-badge ${resource.status}`}>{resource.status?.toUpperCase()}</span>
          </div>
          <div className="detail-item">
            <label>Type</label>
            <span>{renderCodeableConcept(resource.type)}</span>
          </div>
          <div className="detail-item">
            <label>Use</label>
            <span>{resource.use || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <label>Created</label>
            <span>{formatDateTime(resource.created)}</span>
          </div>
          <div className="detail-item">
            <label>Priority</label>
            <span>{renderCodeableConcept(resource.priority)}</span>
          </div>
          <div className="detail-item">
            <label>Total Amount</label>
            <span className="amount-highlight">{renderMoney(resource.total)}</span>
          </div>
        </div>
      </div>

      {resource.diagnosis && resource.diagnosis.length > 0 && (
        <div className="detail-section">
          <h3>Diagnoses ({resource.diagnosis.length})</h3>
          <div className="diagnoses-list">
            {resource.diagnosis.map((diag: any, idx: number) => (
              <div key={idx} className="diagnosis-item">
                <span className="sequence">#{diag.sequence}</span>
                <span className="diagnosis-code">{renderCodeableConcept(diag.diagnosisCodeableConcept)}</span>
                {diag.type && (
                  <span className="diagnosis-type">{diag.type.map(renderCodeableConcept).join(', ')}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {resource.item && resource.item.length > 0 && (
        <div className="detail-section">
          <h3>Claim Items ({resource.item.length})</h3>
          <div className="items-table">
            <div className="table-header">
              <span>Service/Product</span>
              <span>Quantity</span>
              <span>Unit Price</span>
              <span>Net Amount</span>
            </div>
            {resource.item.slice(0, 5).map((item: any, idx: number) => (
              <div key={idx} className="table-row">
                <span className="service-name">{renderCodeableConcept(item.productOrService)}</span>
                <span>{item.quantity?.value || 'N/A'}</span>
                <span>{renderMoney(item.unitPrice)}</span>
                <span className="net-amount">{renderMoney(item.net)}</span>
              </div>
            ))}
            {resource.item.length > 5 && (
              <div className="more-items">
                + {resource.item.length - 5} more items
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderGenericResource = (resource: any) => (
    <div className="resource-details">
      <div className="detail-section">
        <h3>Resource Information</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <label>Resource Type</label>
            <span>{resource.resourceType}</span>
          </div>
          <div className="detail-item">
            <label>ID</label>
            <span>{resource.id || 'N/A'}</span>
          </div>
          {resource.status && (
            <div className="detail-item">
              <label>Status</label>
              <span className={`status-badge ${resource.status}`}>{resource.status?.toUpperCase()}</span>
            </div>
          )}
          {resource.name && (
            <div className="detail-item">
              <label>Name</label>
              <span>{typeof resource.name === 'string' ? resource.name : renderHumanName(resource.name)}</span>
            </div>
          )}
          {resource.identifier && (
            <div className="detail-item">
              <label>Identifiers</label>
              <span>{renderIdentifiers(resource.identifier)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderMainResource = () => {
    if (!data.entry?.length) return <div className="no-resource">No resource data found</div>;
    
    const mainResource = data.entry[0].resource;
    if (!mainResource) return <div className="no-resource">Invalid resource data</div>;

    switch (mainResource.resourceType) {
      case 'InsurancePlan':
        return renderInsurancePlanResponse(mainResource);
      case 'CoverageEligibilityResponse':
        return renderEligibilityResponse(mainResource);
      case 'Claim':
      case 'ClaimResponse':
        return renderClaimResponse(mainResource);
      default:
        return renderGenericResource(mainResource);
    }
  };

  const bundleInfo = getBundleTypeInfo();
  const mainResource = data.entry?.[0]?.resource;

  return (
    <div className="single-fhir-renderer">
      <div className="response-header" style={{ borderLeftColor: bundleInfo.color }}>
        <div className="header-content">
          <div className="resource-icon" style={{ backgroundColor: bundleInfo.color }}>
            {bundleInfo.icon}
          </div>
          <div className="header-text">
            <h1>{title || `${bundleInfo.label} Response`}</h1>
            <div className="header-meta">
              <span>Resource ID: {mainResource?.id || 'N/A'}</span>
              <span>•</span>
              <span>Timestamp: {formatDateTime(data.timestamp)}</span>
            </div>
          </div>
        </div>
        
        {showMetadata && (
          <div className="bundle-metadata">
            <div className="meta-item">
              <label>Bundle ID</label>
              <span>{data.id}</span>
            </div>
            <div className="meta-item">
              <label>Type</label>
              <span>{data.type}</span>
            </div>
            <div className="meta-item">
              <label>Resources</label>
              <span>{data.entry?.length || 0}</span>
            </div>
          </div>
        )}
      </div>

      <div className="response-content">
        {renderMainResource()}
        
        {data.entry && data.entry.length > 1 && (
          <div className="detail-section">
            <h3>Supporting Resources ({data.entry.length - 1})</h3>
            <div className="supporting-resources">
              {data.entry.slice(1).map((entry, idx) => {
                const resource = entry.resource;
                if (!resource) return null;
                
                const typeInfo = getResourceTypeInfo(resource.resourceType);
                return (
                  <div key={idx} className="supporting-resource">
                    <div className="support-icon" style={{ backgroundColor: typeInfo.color }}>
                      {typeInfo.icon}
                    </div>
                    <div className="support-info">
                      <div className="support-type">{typeInfo.label}</div>
                      <div className="support-id">{resource.id}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SingleFHIRRenderer;
