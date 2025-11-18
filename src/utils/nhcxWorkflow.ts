// NHCX Workflow Steps and States
export const NHCX_WORKFLOWS = {
  // Coverage Eligibility Check
  ELIGIBILITY: {
    CE01: { label: 'Request Initiated', status: 'initiated', next: 'CE02' },
    CE02: { label: 'Response Received', status: 'complete', next: null }
  },

  // Pre-Authorization
  PREAUTH: {
    PA01: { label: 'Pre-Auth Submitted', status: 'initiated', next: 'PA02' },
    PA02: { label: 'Information Requested', status: 'info_required', next: 'PA03' },
    PA03: { label: 'Information Submitted', status: 'processing', next: 'PA04' },
    PA04: { label: 'Approved', status: 'approved', next: null },
    PA05: { label: 'Rejected', status: 'rejected', next: null },
    PA06: { label: 'Partially Approved', status: 'partial', next: null }
  },

  // Claim Processing
  CLAIM: {
    CL01: { label: 'Claim Submitted', status: 'initiated', next: 'CL02' },
    CL02: { label: 'Information Requested', status: 'info_required', next: 'CL03' },
    CL03: { label: 'Information Submitted', status: 'processing', next: 'CL04' },
    CL04: { label: 'Approved', status: 'approved', next: 'CL07' },
    CL05: { label: 'Rejected', status: 'rejected', next: null },
    CL06: { label: 'Partially Approved', status: 'partial', next: 'CL07' },
    CL07: { label: 'Payment Notice Issued', status: 'payment', next: null }
  },

  // Insurance Plan
  PLAN: {
    IP01: { label: 'Plan Request Initiated', status: 'initiated', next: 'IP02' },
    IP02: { label: 'Plan Details Received', status: 'complete', next: null }
  }
};

export const WORKFLOW_STATUS_COLORS = {
  initiated: { bg: '#EFF6FF', text: '#1E40AF', icon: '⏳' },
  processing: { bg: '#FEF3C7', text: '#92400E', icon: '🔄' },
  info_required: { bg: '#FEF3C7', text: '#B45309', icon: '⚠️' },
  approved: { bg: '#D1FAE5', text: '#065F46', icon: '✅' },
  partial: { bg: '#FED7AA', text: '#9A3412', icon: '⚠️' },
  rejected: { bg: '#FEE2E2', text: '#991B1B', icon: '❌' },
  payment: { bg: '#E0E7FF', text: '#3730A3', icon: '💰' },
  complete: { bg: '#D1FAE5', text: '#065F46', icon: '✓' }
};

export interface NextAction {
  label: string;
  icon: string;
  route?: string;
  handler?: () => void;
}

export interface WorkflowContext {
  workflowType: string;
  mainResource: any;
  bundle: any;
  patientId?: string;
  payerId?: string;
  status?: string;
  outcome?: string;
  totalAmount?: any;
}

/**
 * Get workflow stage information
 */
export const getWorkflowStage = (workflowId: string): {
  label: string;
  status: string;
  next: string | null;
} | null => {
  // Determine workflow type from ID prefix
  if (workflowId.startsWith('CE')) {
    return NHCX_WORKFLOWS.ELIGIBILITY[workflowId as keyof typeof NHCX_WORKFLOWS.ELIGIBILITY] || null;
  } else if (workflowId.startsWith('PA')) {
    return NHCX_WORKFLOWS.PREAUTH[workflowId as keyof typeof NHCX_WORKFLOWS.PREAUTH] || null;
  } else if (workflowId.startsWith('CL')) {
    return NHCX_WORKFLOWS.CLAIM[workflowId as keyof typeof NHCX_WORKFLOWS.CLAIM] || null;
  } else if (workflowId.startsWith('IP')) {
    return NHCX_WORKFLOWS.PLAN[workflowId as keyof typeof NHCX_WORKFLOWS.PLAN] || null;
  }
  return null;
};

/**
 * Get color scheme for workflow status
 */
export const getStatusColor = (status: string) => {
  return WORKFLOW_STATUS_COLORS[status as keyof typeof WORKFLOW_STATUS_COLORS] ||
         { bg: '#F3F4F6', text: '#374151', icon: '•' };
};

/**
 * Format currency in Indian format
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Format ABHA number with dashes
 */
export const formatABHA = (abha: string): string => {
  const cleaned = abha.replace(/\D/g, '');
  if (cleaned.length !== 14) return abha;
  return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6, 10)}-${cleaned.slice(10, 14)}`;
};

/**
 * Validate ABHA number format
 */
export const isValidABHA = (abha: string): boolean => {
  const pattern = /^\d{2}-?\d{4}-?\d{4}-?\d{4}$/;
  return pattern.test(abha);
};

/**
 * Format mobile number
 */
export const formatMobile = (mobile: string): string => {
  const cleaned = mobile.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 5)}${cleaned.slice(5)}`;
  }
  return mobile;
};

/**
 * Mask sensitive information
 */
export const maskSensitiveData = {
  mobile: (mobile: string): string => {
    const cleaned = mobile.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 5)}***${cleaned.slice(8)}`;
    }
    return mobile;
  },

  accountNumber: (account: string): string => {
    if (account.length > 4) {
      return `XXXX${account.slice(-4)}`;
    }
    return account;
  },

  abha: (abha: string): string => {
    const cleaned = abha.replace(/\D/g, '');
    if (cleaned.length === 14) {
      return `${cleaned.slice(0, 2)}-****-****-${cleaned.slice(10, 14)}`;
    }
    return abha;
  }
};

/**
 * Get elapsed time from timestamp
 */
export const getElapsedTime = (timestamp: string): string => {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now.getTime() - past.getTime();

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
};

/**
 * Format date in Indian format
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

/**
 * Format date and time
 */
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Calculate days between dates
 */
export const getDaysBetween = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Validate date format
 */
export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

/**
 * Get request type label
 */
export const getRequestTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    coverage_eligibility: 'Coverage Eligibility',
    preauth: 'Pre-Authorization',
    claim: 'Claim',
    insurance_plan: 'Insurance Plan'
  };
  return labels[type] || type;
};

/**
 * Get workflow type from request ID
 */
export const getWorkflowType = (requestId: string): string => {
  if (requestId.startsWith('ce-')) return 'coverage_eligibility';
  if (requestId.startsWith('pa-')) return 'preauth';
  if (requestId.startsWith('cl-')) return 'claim';
  if (requestId.startsWith('ip-')) return 'insurance_plan';
  return 'unknown';
};

/**
 * Generate suggested next actions based on workflow state
 */
export const getNextActions = (workflowId: string, status: string): NextAction[] => {
  const actions: NextAction[] = [];

  // Coverage Eligibility -> Pre-Auth
  if (workflowId === 'CE02' && status === 'complete') {
    actions.push({
      label: 'Submit Pre-Auth',
      icon: '📋',
      route: '/preauth/new'
    });
  }

  // Pre-Auth Approved -> Submit Claim
  if ((workflowId === 'PA04' || workflowId === 'PA06') && status === 'approved') {
    actions.push({
      label: 'Submit Claim',
      icon: '💰',
      route: '/claim/new'
    });
  }

  // Information Required -> Submit Documents
  if (workflowId === 'PA02' || workflowId === 'CL02') {
    actions.push({
      label: 'Submit Documents',
      icon: '📎',
      route: '/documents/upload'
    });
  }

  // Always available
  actions.push({
    label: 'View FHIR Bundle',
    icon: '📄'
  });

  return actions;
};

/**
 * Estimate progress percentage
 */
export const getProgressPercentage = (workflowId: string): number => {
  const progressMap: Record<string, number> = {
    // Eligibility
    CE01: 50,
    CE02: 100,

    // Pre-Auth
    PA01: 20,
    PA02: 40,
    PA03: 60,
    PA04: 100,
    PA05: 100,
    PA06: 100,

    // Claim
    CL01: 15,
    CL02: 30,
    CL03: 50,
    CL04: 85,
    CL05: 100,
    CL06: 85,
    CL07: 100,

    // Plan
    IP01: 50,
    IP02: 100
  };

  return progressMap[workflowId] || 0;
};

/**
 * Validate patient details
 */
export const validatePatientDetails = (patient: {
  name?: string;
  age?: number;
  gender?: string;
  date_of_birth?: string;
  mobile?: string;
  abha_number?: string;
}): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!patient.name || patient.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }

  if (!patient.age || patient.age < 0 || patient.age > 150) {
    errors.push('Valid age is required');
  }

  if (!patient.gender || !['male', 'female', 'other'].includes(patient.gender)) {
    errors.push('Valid gender is required');
  }

  if (patient.mobile && !/^\d{10}$/.test(patient.mobile.replace(/\D/g, ''))) {
    errors.push('Mobile number must be 10 digits');
  }

  if (patient.abha_number && !isValidABHA(patient.abha_number)) {
    errors.push('Invalid ABHA number format (XX-XXXX-XXXX-XXXX)');
  }

  if (patient.date_of_birth && !isValidDate(patient.date_of_birth)) {
    errors.push('Invalid date of birth');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Calculate total amount from service breakdown
 */
export const calculateTotalAmount = (services: Array<{ amount: number }>): number => {
  return services.reduce((total, service) => total + (service.amount || 0), 0);
};

/**
 * Format service breakdown for display
 */
export const formatServiceBreakdown = (services: Array<{
  service: string;
  description?: string;
  days?: number;
  quantity?: number;
  rate?: number;
  amount: number;
}>): string => {
  return services
    .map(s => `${s.service}: ${formatCurrency(s.amount)}`)
    .join(', ');
};

/**
 * Get status badge color class
 */
export const getStatusBadgeClass = (status: string): string => {
  const statusMap: Record<string, string> = {
    'request.initiated': 'bg-blue-100 text-blue-800',
    'request.queued': 'bg-yellow-100 text-yellow-800',
    'response.complete': 'bg-green-100 text-green-800',
    'response.error': 'bg-red-100 text-red-800',
    'active': 'bg-green-100 text-green-800',
    'approved': 'bg-green-100 text-green-800',
    'rejected': 'bg-red-100 text-red-800',
    'partial': 'bg-orange-100 text-orange-800',
    'pending': 'bg-yellow-100 text-yellow-800',
    'processing': 'bg-blue-100 text-blue-800',
    'complete': 'bg-green-100 text-green-800',
    'error': 'bg-red-100 text-red-800'
  };

  return statusMap[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Parse error message for display
 */
export const formatErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  if (error.error) return error.error;
  return 'An unexpected error occurred';
};

/**
 * Create download filename
 */
export const createDownloadFilename = (type: string, requestId: string): string => {
  const date = new Date().toISOString().split('T')[0];
  return `nhcx-${type}-${requestId}-${date}.json`;
};

/**
 * Export data as JSON file
 */
export const downloadAsJSON = (data: any, filename: string): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Copy to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
};

/**
 * Get payer display name from ID
 */
export const getPayerDisplayName = (payerId: string): string => {
  const payerMap: Record<string, string> = {
    'star-health@hcx': 'Star Health Insurance',
    'icici-lombard@hcx': 'ICICI Lombard',
    'hdfc-ergo@hcx': 'HDFC ERGO',
    'max-bupa@hcx': 'Max Bupa'
  };
  return payerMap[payerId] || payerId;
};

/**
 * Validate IFSC code format
 */
export const isValidIFSC = (ifsc: string): boolean => {
  const pattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  return pattern.test(ifsc);
};

/**
 * Get service code display name
 */
export const getServiceCodeDisplay = (code: string): string => {
  const codeMap: Record<string, string> = {
    '80146002': 'Appendectomy',
    '428191000124101': 'Medical Consultation',
    '232717009': 'Coronary Artery Bypass'
  };
  return codeMap[code] || code;
};

/**
 * Get diagnosis code display name
 */
export const getDiagnosisCodeDisplay = (code: string): string => {
  const codeMap: Record<string, string> = {
    '13645005': 'COPD - Chronic Obstructive Pulmonary Disease',
    '38341003': 'Hypertension',
    '44054006': 'Diabetes Type 2'
  };
  return codeMap[code] || code;
};

/**
 * Extract workflow context from a FHIR bundle
 * Used by FHIRRenderer to display workflow-specific information
 */
export const extractWorkflowContext = (bundle: any): WorkflowContext => {
  // Extract workflow-related metadata from the bundle
  const mainResource = bundle?.entry?.[0]?.resource;
  const resourceType = mainResource?.resourceType;

  // Extract patient ID
  const patientId = mainResource?.patient?.reference?.split('/').pop() ||
                   mainResource?.patient?.identifier?.[0]?.value;

  // Extract payer/insurer ID
  const payerId = mainResource?.insurer?.display ||
                 mainResource?.insurer?.reference?.split('/').pop() ||
                 mainResource?.provider?.display;

  // Extract status
  const status = mainResource?.status;

  // Extract outcome (for responses)
  const outcome = mainResource?.outcome;

  // Extract total amount
  let totalAmount = null;
  if (mainResource?.total) {
    if (Array.isArray(mainResource.total)) {
      const submittedTotal = mainResource.total.find((t: any) =>
        t.category?.coding?.[0]?.code === 'submitted' ||
        t.category?.coding?.[0]?.code === 'benefit'
      );
      totalAmount = submittedTotal?.amount;
    } else if (mainResource.total.value) {
      totalAmount = mainResource.total;
    }
  }

  return {
    workflowType: resourceType || 'unknown',
    mainResource: mainResource,
    bundle: bundle,
    patientId,
    payerId,
    status,
    outcome,
    totalAmount
  };
};
