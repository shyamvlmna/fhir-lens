import React, { useState } from 'react';
import { FHIRBundle, InsurancePlan, CodeableConcept, Extension, Period, Benefit } from '../types/fhir';
import './FHIRRenderer.css';

interface FHIRRendererProps {
  data: FHIRBundle;
}

const FHIRRenderer: React.FC<FHIRRendererProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllBenefits, setShowAllBenefits] = useState(false);

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderCodeableConcept = (concept?: CodeableConcept): string => {
    if (!concept?.coding?.length) return 'N/A';
    return concept.coding[0].display || concept.coding[0].code || 'N/A';
  };

  const renderPeriod = (period?: Period): JSX.Element => {
    if (!period) return <span>N/A</span>;
    
    return (
      <span className="period-inline">
        {formatDate(period.start)} - {formatDate(period.end)}
      </span>
    );
  };

  const getBenefitSummary = (benefits?: Benefit[]) => {
    if (!benefits?.length) return { count: 0, totalValue: 0 };
    
    const totalValue = benefits.reduce((sum, benefit) => {
      const limitValue = benefit.limit?.[0]?.value?.value || 0;
      return sum + limitValue;
    }, 0);
    
    return { count: benefits.length, totalValue };
  };

  const getFilteredBenefits = (benefits?: Benefit[]) => {
    if (!benefits) return [];
    
    let filtered = benefits;
    if (searchTerm) {
      filtered = benefits.filter(benefit => 
        renderCodeableConcept(benefit.type).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return showAllBenefits ? filtered : filtered.slice(0, 5);
  };

  const renderBenefitCard = (benefit: Benefit, index: number): JSX.Element => {
    const amount = benefit.limit?.[0]?.value?.value;
    const extensions = benefit.extension || [];
    const autoApprove = extensions.find(e => e.url === 'autoApproveYN')?.valueString === '1';
    
    return (
      <div key={index} className="benefit-card">
        <div className="benefit-title">
          {renderCodeableConcept(benefit.type)}
        </div>
        <div className="benefit-amount">
          ₹{amount?.toLocaleString('en-IN')}
        </div>
        {autoApprove && <span className="auto-approve">Auto Approve</span>}
      </div>
    );
  };

  const renderInsurancePlan = (plan: InsurancePlan): JSX.Element => {
    const allBenefits = plan.coverage?.[0]?.benefit || [];
    const { count, totalValue } = getBenefitSummary(allBenefits);
    const filteredBenefits = getFilteredBenefits(allBenefits);

    return (
      <div className="insurance-plan-compact">
        {/* Header Section */}
        <div className="plan-header-compact">
          <div className="plan-info">
            <h1>{plan.name || 'Insurance Plan'}</h1>
            <div className="plan-meta-compact">
              <span className={`status ${plan.status}`}>{plan.status?.toUpperCase()}</span>
              <span className="plan-details">
                {renderCodeableConcept(plan.type?.[0])} • {plan.administeredBy?.display}
              </span>
            </div>
            <div className="validity-compact">
              <strong>Valid:</strong> {renderPeriod(plan.period)}
            </div>
          </div>
          
          <div className="coverage-summary">
            <div className="summary-card">
              <div className="summary-number">{count}</div>
              <div className="summary-label">Procedures</div>
            </div>
            <div className="summary-card">
              <div className="summary-number">₹{totalValue.toLocaleString('en-IN')}</div>
              <div className="summary-label">Total Coverage</div>
            </div>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="controls-section">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search procedures..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button
            onClick={() => setShowAllBenefits(!showAllBenefits)}
            className="toggle-button"
          >
            {showAllBenefits ? `Show Less` : `Show All ${count} Procedures`}
          </button>
        </div>

        {/* Benefits Grid */}
        <div className="benefits-grid-compact">
          {filteredBenefits.map((benefit, index) => renderBenefitCard(benefit, index))}
        </div>

        {!showAllBenefits && filteredBenefits.length === 5 && allBenefits.length > 5 && (
          <div className="load-more">
            <button onClick={() => setShowAllBenefits(true)} className="load-more-button">
              Load {allBenefits.length - 5} more procedures
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fhir-renderer-compact">
      <div className="bundle-header-compact">
        <div className="bundle-title">
          <h2>PMJAY Health Insurance Plan</h2>
          <div className="bundle-id">Bundle: {data.id}</div>
        </div>
      </div>

      <div className="bundle-entries">
        {data.entry?.map((entry, index) => (
          <div key={index} className="bundle-entry">
            {entry.resource?.resourceType === 'InsurancePlan' && renderInsurancePlan(entry.resource)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FHIRRenderer;
