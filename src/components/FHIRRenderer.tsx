import React, { useState, useEffect } from 'react';
import { FHIRBundle } from '../types/fhir';
import { loadBundle, listBundles, getDataSourceInfo } from '../services/dataService';
import './FHIRRenderer.css';
import './NHCXWorkflow.css';
import {
  WorkflowActions,
  WorkflowTimeline,
  KeyInfoCard,
  AmountComparison,
  ServiceBreakdown,
  ClinicalSummary
} from './NHCXWorkflowComponents';
import { extractWorkflowContext } from '../utils/nhcxWorkflow';

interface FileInfo {
  name: string;
  title: string;
  description: string;
  type: 'request' | 'response';
  workflow: string;
  resourceCount?: number;
}

interface ResourceCardProps {
  resource: any; // Use any to handle all FHIR resource types
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [showAllServices, setShowAllServices] = useState(false);

  const toggleCategoryExpansion = (categoryIndex: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryIndex)) {
      newExpanded.delete(categoryIndex);
    } else {
      newExpanded.add(categoryIndex);
    }
    setExpandedCategories(newExpanded);
  };

  const getResourceIcon = (resourceType: string) => {
    const icons: Record<string, string> = {
      'Patient': '👤',
      'InsurancePlan': '🏥',
      'Coverage': '🛡️',
      'Claim': '📋',
      'ClaimResponse': '📝',
      'Eligibility': '✓',
      'EligibilityResponse': '✅',
      'CoverageEligibilityRequest': '❓',
      'CoverageEligibilityResponse': '✅',
      'Bundle': '📦',
      'Organization': '🏢',
      'Practitioner': '👨‍⚕️',
      'Condition': '🩺',
      'Procedure': '⚡',
      'Medication': '💊'
    };
    return icons[resourceType] || '📄';
  };

  const renderResourceDetails = () => {
    // Use any type to handle all possible FHIR resource properties
    const res = resource as any;
    
    // Special handling for InsurancePlan to show benefits and services
    if (res.resourceType === 'InsurancePlan') {
      return (
        <div className="resource-details">
          <p><strong>ID:</strong> {res.id || 'N/A'}</p>
          {res.name && <p><strong>Name:</strong> {res.name}</p>}
          {res.status && <p><strong>Status:</strong> {res.status}</p>}
          {res.type?.[0]?.coding?.[0]?.display && (
            <p><strong>Type:</strong> {res.type[0].coding[0].display}</p>
          )}
          {res.ownedBy?.display && (
            <p><strong>Owner:</strong> {res.ownedBy.display}</p>
          )}
          
          {/* Coverage Information */}
          {res.coverage && res.coverage.length > 0 && (
            <div className="coverage-section">
              <p><strong>Coverage Categories ({res.coverage.length}):</strong></p>
              <div className="coverage-list">
                {res.coverage.map((coverage: any, index: number) => {
                  const isExpanded = expandedCategories.has(index);
                  const hasMoreThanTwo = coverage.benefit && coverage.benefit.length > 2;
                  
                  return (
                    <div key={index} className="coverage-item">
                      <div className="coverage-info">
                        <span className="coverage-badge">
                          {coverage.type?.coding?.[0]?.display || `Category ${index + 1}`}
                        </span>
                        {coverage.benefit && (
                          <span className="benefit-count">
                            {coverage.benefit.length} services
                          </span>
                        )}
                      </div>
                      {/* Show sample benefits from this category */}
                      {coverage.benefit && coverage.benefit.length > 0 && (
                        <div className="category-benefits">
                          {(isExpanded ? coverage.benefit : coverage.benefit.slice(0, 2)).map((benefit: any, bIndex: number) => (
                            <div key={bIndex} className="mini-benefit">
                              <span className="mini-benefit-code">
                                {benefit.type?.coding?.[0]?.code}
                              </span>
                              <span className="mini-benefit-name">
                                {benefit.type?.coding?.[0]?.display?.split('(')[0]?.trim()}
                              </span>
                            </div>
                          ))}
                          {hasMoreThanTwo && (
                            <button 
                              className="expand-button"
                              onClick={() => toggleCategoryExpansion(index)}
                            >
                              {isExpanded ? 
                                `- Show less` : 
                                `+ Show ${coverage.benefit.length - 2} more services`
                              }
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Total Benefits Count */}
          {res.coverage && (
            <p><strong>Total Services:</strong> {
              res.coverage.reduce((total: number, coverage: any) => 
                total + (coverage.benefit?.length || 0), 0
              )
            }</p>
          )}
          
          {/* Sample Benefits */}
          {res.coverage && res.coverage[0]?.benefit && (
            <div className="benefits-section">
              <p><strong>Sample Services:</strong></p>
              <div className="benefits-list">
                {(showAllServices ? res.coverage[0].benefit : res.coverage[0].benefit.slice(0, 5)).map((benefit: any, index: number) => (
                  <div key={index} className="benefit-item">
                    <div className="benefit-info">
                      <span className="benefit-code">
                        {benefit.type?.coding?.[0]?.code}
                      </span>
                      <span className="benefit-name">
                        {benefit.type?.coding?.[0]?.display?.split('(')[0] || 'Service'}
                      </span>
                    </div>
                    {/* Show limit information if available */}
                    {benefit.limit && benefit.limit.length > 0 && (
                      <div className="benefit-limits">
                        {benefit.limit.slice(0, 2).map((limit: any, limitIndex: number) => (
                          <span key={limitIndex} className="limit-badge">
                            {limit.code?.coding?.[0]?.display}: {limit.value?.value} {limit.value?.unit}
                          </span>
                        ))}
                        {benefit.limit.length > 2 && (
                          <span className="more-limits">+{benefit.limit.length - 2} more</span>
                        )}
                      </div>
                    )}
                    {/* Show extensions if available */}
                    {benefit.extension && (
                      <div className="benefit-extensions">
                        {benefit.extension.slice(0, 2).map((ext: any, extIndex: number) => (
                          <span key={extIndex} className="extension-badge">
                            {ext.url?.split('/').pop()}: {ext.valueString || ext.valueBoolean || ext.valueInteger}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {res.coverage[0].benefit.length > 5 && (
                  <button 
                    className="expand-button main-expand"
                    onClick={() => setShowAllServices(!showAllServices)}
                  >
                    {showAllServices ? 
                      '- Show less services' : 
                      `+ Show all ${res.coverage[0].benefit.length} services in this category`
                    }
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }
    
    // Special handling for CoverageEligibilityRequest
    if (res.resourceType === 'CoverageEligibilityRequest') {
      return (
        <div className="resource-details">
          <p><strong>ID:</strong> {res.id || 'N/A'}</p>
          {res.status && <p><strong>Status:</strong> {res.status}</p>}
          {res.created && <p><strong>Created:</strong> {new Date(res.created).toLocaleDateString()}</p>}
          
          {/* Priority */}
          {res.priority?.coding?.[0] && (
            <p><strong>Priority:</strong> {res.priority.coding[0].display || res.priority.coding[0].code}</p>
          )}
          
          {/* Purpose */}
          {res.purpose && res.purpose.length > 0 && (
            <p><strong>Purpose:</strong> {res.purpose.join(', ')}</p>
          )}
          
          {/* Services Requested */}
          {res.item && res.item.length > 0 && (
            <div className="eligibility-services">
              <p><strong>Services Requested ({res.item.length}):</strong></p>
              <div className="services-list">
                {res.item.map((item: any, index: number) => (
                  <div key={index} className="service-item">
                    <span className="service-code">
                      {item.productOrService?.coding?.[0]?.code}
                    </span>
                    <span className="service-name">
                      {item.productOrService?.coding?.[0]?.display}
                    </span>
                    {item.category?.coding?.[0] && (
                      <span className="service-category">
                        Category: {item.category.coding[0].display}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Patient Reference */}
          {res.patient?.reference && (
            <p><strong>Patient Reference:</strong> {res.patient.reference.split('/').pop()}</p>
          )}
          
          {/* Provider Reference */}
          {res.provider?.reference && (
            <p><strong>Provider Reference:</strong> {res.provider.reference.split('/').pop()}</p>
          )}
          
          {/* Insurer Reference */}
          {res.insurer?.reference && (
            <p><strong>Insurer Reference:</strong> {res.insurer.reference.split('/').pop()}</p>
          )}
          
          {/* Insurance Information */}
          {res.insurance && res.insurance.length > 0 && (
            <div className="insurance-info">
              <p><strong>Insurance Coverage:</strong></p>
              {res.insurance.map((insurance: any, index: number) => (
                <div key={index} className="insurance-item">
                  {insurance.focal && <span className="focal-badge">Primary</span>}
                  {insurance.coverage?.reference && (
                    <span className="coverage-ref">
                      Coverage: {insurance.coverage.reference.split('/').pop()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    // Special handling for CoverageEligibilityResponse
    if (res.resourceType === 'CoverageEligibilityResponse') {
      return (
        <div className="resource-details">
          <p><strong>ID:</strong> {res.id || 'N/A'}</p>
          {res.status && <p><strong>Status:</strong> {res.status}</p>}
          {res.created && <p><strong>Created:</strong> {new Date(res.created).toLocaleDateString()}</p>}
          
          {/* Outcome */}
          {res.outcome && (
            <p><strong>Outcome:</strong> <span className={`outcome-badge ${res.outcome}`}>{res.outcome}</span></p>
          )}
          
          {/* Purpose */}
          {res.purpose && res.purpose.length > 0 && (
            <p><strong>Purpose:</strong> {res.purpose.join(', ')}</p>
          )}
          
          {/* Request Reference */}
          {res.request?.reference && (
            <p><strong>Original Request:</strong> {res.request.reference.split('/').pop()}</p>
          )}
          
          {/* Patient Reference */}
          {res.patient?.reference && (
            <p><strong>Patient Reference:</strong> {res.patient.reference.split('/').pop()}</p>
          )}
          
          {/* Requestor Reference */}
          {res.requestor?.reference && (
            <p><strong>Requestor Reference:</strong> {res.requestor.reference.split('/').pop()}</p>
          )}
          
          {/* Insurer Reference */}
          {res.insurer?.reference && (
            <p><strong>Insurer Reference:</strong> {res.insurer.reference.split('/').pop()}</p>
          )}
          
          {/* Insurance Coverage Details */}
          {res.insurance && res.insurance.length > 0 && (
            <div className="eligibility-insurance">
              <p><strong>Coverage Eligibility Details:</strong></p>
              {res.insurance.map((insurance: any, index: number) => (
                <div key={index} className="coverage-eligibility">
                  {insurance.coverage?.reference && (
                    <p><strong>Coverage:</strong> {insurance.coverage.reference.split('/').pop()}</p>
                  )}
                  
                  {/* Benefit Period */}
                  {insurance.benefitPeriod && (
                    <div className="benefit-period">
                      <p><strong>Benefit Period:</strong></p>
                      <span className="period-badge">
                        {new Date(insurance.benefitPeriod.start).toLocaleDateString()} - {new Date(insurance.benefitPeriod.end).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  
                  {/* Item Details */}
                  {insurance.item && insurance.item.length > 0 && (
                    <div className="eligibility-items">
                      <p><strong>Covered Services ({insurance.item.length}):</strong></p>
                      <div className="items-list">
                        {insurance.item.map((item: any, itemIndex: number) => (
                          <div key={itemIndex} className="eligibility-item">
                            {item.category?.coding?.[0] && (
                              <span className="item-category">
                                {item.category.coding[0].display}
                              </span>
                            )}
                            
                            {/* Benefits */}
                            {item.benefit && item.benefit.length > 0 && (
                              <div className="item-benefits">
                                {item.benefit.map((benefit: any, benefitIndex: number) => (
                                  <div key={benefitIndex} className="eligibility-benefit">
                                    {benefit.type?.coding?.[0] && (
                                      <span className="benefit-type">
                                        {benefit.type.coding[0].display}
                                      </span>
                                    )}
                                    
                                    {/* Allowed Amount */}
                                    {benefit.allowedMoney && (
                                      <span className="allowed-amount">
                                        Allowed: {benefit.allowedMoney.value} {benefit.allowedMoney.currency}
                                      </span>
                                    )}
                                    
                                    {/* Used Amount */}
                                    {benefit.usedMoney && (
                                      <span className="used-amount">
                                        Used: {benefit.usedMoney.value} {benefit.usedMoney.currency}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Authorization Required */}
                            {item.authorizationRequired !== undefined && (
                              <div className="auth-status">
                                <span className={`auth-badge ${item.authorizationRequired ? 'required' : 'not-required'}`}>
                                  Authorization {item.authorizationRequired ? 'Required' : 'Not Required'}
                                </span>
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
          
          {/* Errors */}
          {res.error && res.error.length > 0 && (
            <div className="eligibility-errors">
              <p><strong>Errors:</strong></p>
              {res.error.map((error: any, index: number) => (
                <div key={index} className="error-item">
                  <span className="error-code">{error.code?.coding?.[0]?.code}</span>
                  <span className="error-message">{error.code?.coding?.[0]?.display}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div className="resource-details">
        <p><strong>ID:</strong> {res.id || 'N/A'}</p>
        {res.status && <p><strong>Status:</strong> {res.status}</p>}
        {res.name && (
          <p><strong>Name:</strong> {
            typeof res.name === 'string' ? res.name : 
            res.name[0]?.given?.join(' ') + ' ' + res.name[0]?.family
          }</p>
        )}
        {res.type?.coding?.[0]?.display && (
          <p><strong>Type:</strong> {res.type.coding[0].display}</p>
        )}
        {res.outcome && <p><strong>Outcome:</strong> {res.outcome}</p>}
        {res.gender && <p><strong>Gender:</strong> {res.gender}</p>}
        {res.birthDate && <p><strong>Birth Date:</strong> {res.birthDate}</p>}
        {res.total && (
          <p><strong>Total:</strong> {
            res.total.value ? `${res.total.value} ${res.total.currency}` :
            res.total[0]?.amount ? `${res.total[0].amount.value} ${res.total[0].amount.currency}` :
            'N/A'
          }</p>
        )}
        {res.purpose && (
          <p><strong>Purpose:</strong> {Array.isArray(res.purpose) ? res.purpose.join(', ') : res.purpose}</p>
        )}
        {res.created && <p><strong>Created:</strong> {res.created}</p>}
        {res.period && (
          <p><strong>Period:</strong> {res.period.start} to {res.period.end}</p>
        )}
        {res.coverage && Array.isArray(res.coverage) && (
          <p><strong>Coverage Items:</strong> {res.coverage.length}</p>
        )}
        {res.use && <p><strong>Use:</strong> {res.use}</p>}
        {res.identifier && res.identifier[0]?.value && (
          <p><strong>Identifier:</strong> {res.identifier[0].value}</p>
        )}
      </div>
    );
  };

  return (
    <div className="resource-card">
      <div className="resource-header">
        <span className="resource-icon">{getResourceIcon(resource.resourceType)}</span>
        <div className="resource-title">
          <h3>{resource.resourceType}</h3>
          <span className="resource-id">{resource.id}</span>
        </div>
      </div>
      {renderResourceDetails()}
    </div>
  );
};

const FHIRRenderer: React.FC = () => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [bundleData, setBundleData] = useState<FHIRBundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [dataSourceInfo, setDataSourceInfo] = useState(getDataSourceInfo());

  const loadAvailableFiles = async () => {
    try {
      setLoading(true);
      const bundles = await listBundles();

      // Convert BundleListItem to FileInfo format
      const fileList: FileInfo[] = bundles.map(bundle => ({
        name: bundle.id || bundle.name,
        title: bundle.title,
        description: bundle.description,
        type: bundle.type,
        workflow: bundle.workflow,
        resourceCount: bundle.resourceCount
      }));

      setFiles(fileList);
      
      if (fileList.length > 0) {
        setSelectedFile(fileList[0].name);
      }
    } catch (err) {
      console.error('Error loading available files:', err);
      setError('Failed to load available bundles');
    } finally {
      setLoading(false);
    }
  };

  const loadBundleData = async (identifier: string) => {
    if (!identifier) return;

    setLoading(true);
    setError('');
    setBundleData(null);

    try {
      const data = await loadBundle(identifier);
      setBundleData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred loading the bundle');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Update data source info
    setDataSourceInfo(getDataSourceInfo());
    loadAvailableFiles();
  }, []);

  useEffect(() => {
    if (selectedFile) {
      loadBundleData(selectedFile);
    }
  }, [selectedFile]);

  const selectedFileInfo = files.find(f => f.name === selectedFile);

  return (
    <div className="fhir-bundle-viewer">
      <div className="viewer-sidebar">
        <div className="file-selector">
          <h2>Available FHIR Bundles</h2>
          <div className="data-source-info">
            <span className={`source-badge ${dataSourceInfo.type}`}>
              {dataSourceInfo.type === 'local' ? '📁' : '🌐'} {dataSourceInfo.type.toUpperCase()}
            </span>
            <small>{dataSourceInfo.source}</small>
          </div>
          <p className="file-count">{files.length} bundles found</p>

          <div className="file-list">
            {files.map((file) => (
              <div
                key={file.name}
                className={`file-item ${selectedFile === file.name ? 'selected' : ''}`}
                onClick={() => setSelectedFile(file.name)}
              >
                <div className="file-header">
                  <span className={`file-type-badge ${file.type}`}>
                    {file.type === 'request' ? '📤' : '📥'}
                  </span>
                  <div className="file-info">
                    <h3>{file.title}</h3>
                    <p className="file-description">{file.description}</p>
                  </div>
                </div>
                <div className="file-meta">
                  <span className="workflow-badge">{file.workflow}</span>
                  {file.resourceCount !== undefined && (
                    <span className="resource-count">{file.resourceCount} resources</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="viewer-content">
        {loading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading FHIR bundle...</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <p>❌ {error}</p>
          </div>
        )}

        {bundleData && selectedFileInfo && (
          <div className="bundle-content">
            <div className="bundle-header">
              <h1>{selectedFileInfo.title}</h1>
              <div className="bundle-meta">
                <span className={`type-badge ${selectedFileInfo.type}`}>
                  {selectedFileInfo.type}
                </span>
                <span className="workflow-badge">{selectedFileInfo.workflow}</span>
                <span className="resource-count">
                  {bundleData.entry?.length || 0} resources
                </span>
              </div>
              <p className="bundle-description">{selectedFileInfo.description}</p>
            </div>

            <div className="bundle-summary">
              <h3>Bundle Information</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="label">Bundle ID:</span>
                  <span className="value">{bundleData.id || 'N/A'}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Type:</span>
                  <span className="value">{bundleData.type}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Total Resources:</span>
                  <span className="value">{bundleData.entry?.length || 0}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Timestamp:</span>
                  <span className="value">{bundleData.timestamp || 'N/A'}</span>
                </div>
                
                {/* Insurance Plan specific summary */}
                {bundleData.entry?.some((entry: any) => entry.resource?.resourceType === 'InsurancePlan') && (
                  <>
                    <div className="summary-item">
                      <span className="label">Plan Owner:</span>
                      <span className="value">
                        {(bundleData.entry?.find((entry: any) => entry.resource?.resourceType === 'InsurancePlan')?.resource as any)?.ownedBy?.display || 'N/A'}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="label">Coverage Areas:</span>
                      <span className="value">
                        {(bundleData.entry?.find((entry: any) => entry.resource?.resourceType === 'InsurancePlan')?.resource as any)?.coverageArea?.length || 0}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="label">Total Services:</span>
                      <span className="value">
                        {(() => {
                          const plan = bundleData.entry?.find((entry: any) => entry.resource?.resourceType === 'InsurancePlan')?.resource as any;
                          return plan?.coverage?.reduce((total: number, coverage: any) => 
                            total + (coverage.benefit?.length || 0), 0
                          ) || 0;
                        })()}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="label">Service Categories:</span>
                      <span className="value">
                        {(bundleData.entry?.find((entry: any) => entry.resource?.resourceType === 'InsurancePlan')?.resource as any)?.coverage?.length || 0}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {bundleData.entry && bundleData.entry.length > 0 && (
              <div className="resources-section">
                {/* NHCX Workflow Components */}
                {(() => {
                  const mainResource = bundleData.entry[0].resource as any;
                  const context = extractWorkflowContext(bundleData);

                  // Determine workflow type
                  let workflowType: 'ELIGIBILITY' | 'PREAUTH' | 'CLAIM' | 'PLAN' | null = null;
                  let currentStage = '';

                  if (mainResource?.resourceType === 'CoverageEligibilityRequest' || mainResource?.resourceType === 'CoverageEligibilityResponse') {
                    workflowType = 'ELIGIBILITY';
                    currentStage = mainResource?.resourceType === 'CoverageEligibilityResponse' ? 'CE02' : 'CE01';
                  } else if (mainResource?.resourceType === 'Claim' || mainResource?.resourceType === 'ClaimResponse') {
                    const isPreAuth = mainResource?.type?.coding?.[0]?.code === 'preauthorization';
                    if (isPreAuth) {
                      workflowType = 'PREAUTH';
                      currentStage = mainResource?.resourceType === 'ClaimResponse' ? 'PA04' : 'PA01';
                    } else {
                      workflowType = 'CLAIM';
                      const outcome = mainResource?.outcome?.toLowerCase();
                      if (outcome === 'complete') currentStage = 'CL04';
                      else if (outcome === 'partial') currentStage = 'CL06';
                      else currentStage = 'CL01';
                    }
                  } else if (mainResource?.resourceType === 'InsurancePlan') {
                    workflowType = 'PLAN';
                    currentStage = 'IP02';
                  }

                  return (
                    <>
                      {workflowType && (
                        <WorkflowTimeline
                          workflowType={workflowType}
                          currentStage={currentStage}
                        />
                      )}

                      {/* Key Information Cards for main resource */}
                      {context && (
                        <div className="key-info-grid">
                          {context.patientId && (
                            <KeyInfoCard label="Patient ID" value={context.patientId} />
                          )}
                          {context.payerId && (
                            <KeyInfoCard label="Payer" value={context.payerId} />
                          )}
                          {context.status && (
                            <KeyInfoCard
                              label="Status"
                              value={context.status}
                              type="status"
                              statusColor={context.outcome === 'complete' ? 'approved' : 'processing'}
                            />
                          )}
                          {context.totalAmount && (
                            <KeyInfoCard
                              label="Amount"
                              value={context.totalAmount.value || 0}
                              type="amount"
                            />
                          )}
                        </div>
                      )}

                      {/* Clinical Summary for Claims */}
                      {(mainResource?.resourceType === 'Claim' || mainResource?.resourceType === 'ClaimResponse') && (
                        mainResource.diagnosis || mainResource.procedure
                      ) && (
                        <ClinicalSummary
                          diagnosis={mainResource.diagnosis?.[0]?.diagnosisCodeableConcept?.coding?.[0]?.display}
                          procedures={mainResource.procedure?.map((p: any) => p.procedureCodeableConcept?.coding?.[0]?.display)}
                          notes={mainResource.disposition}
                        />
                      )}

                      {/* Service Breakdown for Claims with items */}
                      {(mainResource?.resourceType === 'ClaimResponse' && mainResource.item?.length > 0) && (
                        <ServiceBreakdown
                          items={mainResource.item.slice(0, 10).map((item: any) => ({
                            service: item.productOrService?.coding?.[0]?.display || 'Service',
                            description: item.productOrService?.text,
                            requested: item.adjudication?.find((a: any) => a.category?.coding?.[0]?.code === 'submitted')?.amount?.value,
                            approved: item.adjudication?.find((a: any) => a.category?.coding?.[0]?.code === 'benefit')?.amount?.value,
                            quantity: item.quantity?.value,
                            status: (() => {
                              const submitted = item.adjudication?.find((a: any) => a.category?.coding?.[0]?.code === 'submitted')?.amount?.value || 0;
                              const benefit = item.adjudication?.find((a: any) => a.category?.coding?.[0]?.code === 'benefit')?.amount?.value || 0;
                              if (benefit === 0) return 'rejected';
                              if (benefit < submitted) return 'reduced';
                              return 'approved';
                            })()
                          }))}
                        />
                      )}

                      {/* Amount Comparison for approved claims */}
                      {mainResource?.resourceType === 'ClaimResponse' && mainResource.total && (
                        (() => {
                          const requested = mainResource.total.find((t: any) => t.category?.coding?.[0]?.code === 'submitted')?.amount?.value;
                          const approved = mainResource.total.find((t: any) => t.category?.coding?.[0]?.code === 'benefit')?.amount?.value;
                          return requested && approved ? (
                            <AmountComparison
                              requested={requested}
                              approved={approved}
                              label="Claim Settlement Summary"
                            />
                          ) : null;
                        })()
                      )}

                      {/* Next Actions */}
                      <WorkflowActions
                        resourceType={mainResource?.resourceType || ''}
                        status={mainResource?.status}
                        outcome={mainResource?.outcome}
                        onAction={(action) => {
                          console.log('Workflow action:', action);
                          alert(`Next Action: ${action.label}\n\nIn a full HMIS, this would navigate to: ${action.route || 'the next step'}`);
                        }}
                      />
                    </>
                  );
                })()}

                <h3>Resources ({bundleData.entry.length})</h3>
                <div className="resources-grid">
                  {bundleData.entry.map((entry, index) => (
                    <ResourceCard
                      key={entry.resource?.id || index}
                      resource={entry.resource!}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!bundleData && !loading && !error && (
          <div className="empty-state">
            <h2>Select a FHIR Bundle</h2>
            <p>Choose a bundle from the list to view its contents</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FHIRRenderer;
