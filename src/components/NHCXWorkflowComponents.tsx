/**
 * NHCX Workflow Components
 * Reusable components for displaying NHCX workflow information
 */

import React from 'react';

// ============================================================================
// WorkflowActions Component
// ============================================================================

export interface WorkflowActionsProps {
  resourceType?: string;
  status?: string;
  outcome?: string;
  onAction?: (action: { label: string; icon?: string; route?: string }) => void;
  actions?: Array<{
    label: string;
    icon?: string;
    onClick?: () => void;
  }>;
}

export const WorkflowActions: React.FC<WorkflowActionsProps> = ({
  resourceType,
  status,
  outcome,
  onAction,
  actions = []
}) => {
  // Generate actions based on resource type if not provided
  const generatedActions = actions.length > 0 ? actions : (() => {
    const acts: Array<{ label: string; icon?: string; route?: string }> = [];

    if (resourceType === 'CoverageEligibilityResponse' && status === 'active') {
      acts.push({ label: 'Submit Pre-Authorization', icon: '📋', route: '/preauth' });
    }

    if (resourceType === 'ClaimResponse' && outcome === 'complete') {
      acts.push({ label: 'View Settlement', icon: '💰', route: '/settlement' });
    }

    return acts;
  })();

  if (generatedActions.length === 0) return null;

  return (
    <div className="workflow-actions">
      {generatedActions.map((action, idx) => (
        <button
          key={idx}
          onClick={() => {
            if ('onClick' in action && action.onClick) {
              action.onClick();
            } else if (onAction) {
              onAction(action);
            }
          }}
          className="action-button"
        >
          {action.icon && <span className="action-icon">{action.icon}</span>}
          {action.label}
        </button>
      ))}
    </div>
  );
};

// ============================================================================
// WorkflowTimeline Component
// ============================================================================

export interface WorkflowTimelineProps {
  workflowType?: 'ELIGIBILITY' | 'PREAUTH' | 'CLAIM' | 'PLAN';
  currentStage?: string;
  events?: Array<{
    id: string;
    label: string;
    timestamp: string;
    status: string;
    message?: string;
  }>;
}

export const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({
  workflowType,
  currentStage,
  events = []
}) => {
  // Generate timeline based on workflow type if events not provided
  if (events.length === 0 && workflowType && currentStage) {
    // Display workflow stage information
    return (
      <div className="workflow-timeline">
        <h3>Workflow Progress</h3>
        <div className="timeline-stage">
          <div className="stage-badge">{workflowType}</div>
          <div className="stage-info">
            <strong>Current Stage:</strong> {currentStage}
          </div>
        </div>
      </div>
    );
  }

  if (events.length === 0) return null;

  return (
    <div className="workflow-timeline">
      <h3>Timeline</h3>
      {events.map((event, idx) => (
        <div key={event.id || idx} className="timeline-event">
          <div className="timeline-marker" />
          <div className="timeline-content">
            <strong>{event.label}</strong>
            <p className="timeline-message">{event.message}</p>
            <small className="timeline-timestamp">{event.timestamp}</small>
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// KeyInfoCard Component
// ============================================================================

export interface KeyInfoCardProps {
  title?: string;
  label?: string;
  value?: string | number;
  type?: string;
  statusColor?: string;
  highlight?: boolean;
  items?: Array<{
    label: string;
    value: string | number;
    highlight?: boolean;
  }>;
}

export const KeyInfoCard: React.FC<KeyInfoCardProps> = ({
  title,
  label,
  value,
  type,
  statusColor,
  highlight,
  items = []
}) => {
  // Single value display
  if (label && value !== undefined) {
    return (
      <div className={`key-info-card single ${highlight ? 'highlight' : ''}`}>
        <label>{label}</label>
        <strong className={type === 'status' ? `status-${statusColor}` : ''}>
          {type === 'amount' && typeof value === 'number'
            ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)
            : value}
        </strong>
      </div>
    );
  }

  // Multiple items display
  if (items.length === 0) return null;

  return (
    <div className="key-info-card">
      {title && <h3>{title}</h3>}
      <div className="info-grid">
        {items.map((item, idx) => (
          <div key={idx} className={`info-item ${item.highlight ? 'highlight' : ''}`}>
            <label>{item.label}</label>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// AmountComparison Component
// ============================================================================

export interface AmountComparisonProps {
  requested?: number;
  approved?: number;
  claimed?: number;
  paid?: number;
  currency?: string;
  label?: string;
}

export const AmountComparison: React.FC<AmountComparisonProps> = ({
  requested,
  approved,
  claimed,
  paid,
  currency = 'INR',
  label
}) => {
  const formatAmount = (amount?: number) => {
    if (amount === undefined || amount === null) return null;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="amount-comparison">
      {label && <h3>{label}</h3>}
      {!label && <h3>Amount Details</h3>}
      <div className="amount-grid">
        {requested !== undefined && (
          <div className="amount-item">
            <label>Requested</label>
            <strong className="amount-requested">{formatAmount(requested)}</strong>
          </div>
        )}
        {claimed !== undefined && (
          <div className="amount-item">
            <label>Claimed</label>
            <strong className="amount-claimed">{formatAmount(claimed)}</strong>
          </div>
        )}
        {approved !== undefined && (
          <div className="amount-item">
            <label>Approved</label>
            <strong className="amount-approved">{formatAmount(approved)}</strong>
          </div>
        )}
        {paid !== undefined && (
          <div className="amount-item">
            <label>Paid</label>
            <strong className="amount-paid">{formatAmount(paid)}</strong>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// ServiceBreakdown Component
// ============================================================================

export interface ServiceBreakdownProps {
  services?: Array<{
    name?: string;
    service?: string;
    description?: string;
    quantity?: number;
    rate?: number;
    amount?: number;
    requested?: number;
    approved?: number;
    status?: string;
  }>;
  items?: Array<{
    service?: string;
    description?: string;
    quantity?: number;
    rate?: number;
    amount?: number;
    requested?: number;
    approved?: number;
    status?: string;
  }>;
}

export const ServiceBreakdown: React.FC<ServiceBreakdownProps> = ({ services = [], items = [] }) => {
  // Use items if provided, otherwise use services
  const displayItems = items.length > 0 ? items : services;

  if (displayItems.length === 0) return null;

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const total = displayItems.reduce((sum, s) => sum + (s.amount || s.requested || 0), 0);
  const totalApproved = displayItems.reduce((sum, s) => sum + (s.approved || 0), 0);

  return (
    <div className="service-breakdown">
      <h3>Service Breakdown</h3>
      <table className="service-table">
        <thead>
          <tr>
            <th>Service</th>
            <th>Description</th>
            <th>Qty</th>
            {displayItems.some(s => s.requested !== undefined) && <th>Requested</th>}
            {displayItems.some(s => s.approved !== undefined) && <th>Approved</th>}
            {displayItems.some(s => s.status) && <th>Status</th>}
          </tr>
        </thead>
        <tbody>
          {displayItems.map((item, idx) => (
            <tr key={idx}>
              <td>{item.service || item.name || 'Service'}</td>
              <td>{item.description || '-'}</td>
              <td>{item.quantity || '-'}</td>
              {displayItems.some(s => s.requested !== undefined) && (
                <td>{formatCurrency(item.requested || item.amount)}</td>
              )}
              {displayItems.some(s => s.approved !== undefined) && (
                <td>{formatCurrency(item.approved)}</td>
              )}
              {displayItems.some(s => s.status) && (
                <td>
                  {item.status && (
                    <span className={`status-badge status-${item.status.toLowerCase()}`}>
                      {item.status}
                    </span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3}><strong>Total</strong></td>
            {displayItems.some(s => s.requested !== undefined) && (
              <td><strong>{formatCurrency(total)}</strong></td>
            )}
            {displayItems.some(s => s.approved !== undefined) && (
              <td><strong>{formatCurrency(totalApproved)}</strong></td>
            )}
            {displayItems.some(s => s.status) && <td></td>}
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

// ============================================================================
// ClinicalSummary Component
// ============================================================================

export interface ClinicalSummaryProps {
  diagnosis?: Array<{
    code: string;
    display: string;
    system?: string;
  }> | string;
  procedures?: Array<{
    code: string;
    display: string;
    date?: string;
  }> | string[];
  notes?: string;
  documents?: Array<{
    title: string;
    type: string;
    url?: string;
  }>;
}

export const ClinicalSummary: React.FC<ClinicalSummaryProps> = ({
  diagnosis = [],
  procedures = [],
  notes,
  documents = []
}) => {
  // Normalize diagnosis to array format
  const diagnosisList = typeof diagnosis === 'string'
    ? [{ code: '', display: diagnosis, system: '' }]
    : Array.isArray(diagnosis) ? diagnosis : [];

  // Normalize procedures to array format
  const proceduresList = Array.isArray(procedures) && typeof procedures[0] === 'string'
    ? procedures.map(p => ({ code: '', display: p as string, date: '' }))
    : Array.isArray(procedures) ? procedures as Array<{ code: string; display: string; date?: string }> : [];

  const hasContent = diagnosisList.length > 0 || proceduresList.length > 0 || notes || documents.length > 0;

  if (!hasContent) return null;

  return (
    <div className="clinical-summary">
      <h3>Clinical Summary</h3>

      {diagnosisList.length > 0 && (
        <div className="clinical-section">
          <h4>Diagnosis</h4>
          <ul>
            {diagnosisList.map((d, idx) => (
              <li key={idx}>
                <strong>{d.display}</strong>
                {d.code && <span className="code-badge">{d.code}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {proceduresList.length > 0 && (
        <div className="clinical-section">
          <h4>Procedures</h4>
          <ul>
            {proceduresList.map((p, idx) => (
              <li key={idx}>
                <strong>{p.display}</strong>
                {p.code && <span className="code-badge">{p.code}</span>}
                {p.date && <span className="procedure-date">{p.date}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {notes && (
        <div className="clinical-section">
          <h4>Clinical Notes</h4>
          <p className="clinical-notes">{notes}</p>
        </div>
      )}

      {documents.length > 0 && (
        <div className="clinical-section">
          <h4>Supporting Documents</h4>
          <ul className="document-list">
            {documents.map((doc, idx) => (
              <li key={idx}>
                <span className="document-icon">📄</span>
                {doc.url ? (
                  <a href={doc.url} target="_blank" rel="noopener noreferrer">
                    {doc.title}
                  </a>
                ) : (
                  <span>{doc.title}</span>
                )}
                <span className="document-type">{doc.type}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Export all components
export default {
  WorkflowActions,
  WorkflowTimeline,
  KeyInfoCard,
  AmountComparison,
  ServiceBreakdown,
  ClinicalSummary
};
