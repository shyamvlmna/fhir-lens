/**
 * NHCX API Service
 * Handles all NHCX workflow API calls for insurance claim management
 * Implements ABDM FHIR profiles for NHCX
 */

import { FHIRBundle } from '../types/fhir';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface NHCXConfig {
  baseUrl: string;
  timeout?: number;
}

export interface PatientDetails {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  date_of_birth: string; // YYYY-MM-DD
  abha_number?: string; // XX-XXXX-XXXX-XXXX
  mobile: string;
  email?: string;
}

export interface DoctorDetails {
  name: string;
  qualification: string;
  registration_number: string;
  specialty: string;
}

export interface DocumentAttachment {
  type: string;
  content_type: string;
  url: string;
  title: string;
  description?: string;
}

export interface ServiceBreakdown {
  service: string;
  description: string;
  days?: number;
  quantity?: number;
  rate?: number;
  unit_price?: number;
  amount: number;
  service_date?: string;
  category?: {
    coding: Array<{
      code: string;
      display: string;
    }>;
  };
}

export interface DiagnosisInfo {
  coding: Array<{
    system: string;
    code: string;
    display: string;
  }>;
  text: string;
}

export interface BankDetails {
  account_number: string;
  ifsc_code: string;
  bank_name: string;
  account_holder: string;
  branch: string;
}

// ============================================================================
// Request Payloads
// ============================================================================

export interface PolicySearchRequest {
  identifier_type: 'MobileNo' | 'AbhaNumber' | 'MemberId';
  identifier_value: string;
}

export interface CoverageEligibilityRequest {
  payer_id: string;
  member_id: string;
  patient_details: PatientDetails;
  item_codes: string[]; // SNOMED codes
  service_id: string; // OPD, IPD, Emergency
}

export interface PreAuthRequest {
  payer_id: string;
  member_id: string;
  provider_id: string;
  patient_details: PatientDetails;
  hospital_name: string;
  hospital_address: string;
  service_codes: string[];
  procedure_codes: string[];
  estimated_amount: number;
  planned_start_date: string; // ISO 8601
  planned_end_date: string; // ISO 8601
  diagnosis: DiagnosisInfo[];
  clinical_notes: string;
  documents: DocumentAttachment[];
  treating_doctor: DoctorDetails;
  service_breakdown: ServiceBreakdown[];
  priority: 'normal' | 'urgent' | 'emergency';
  remarks?: string;
}

export interface ClaimRequest {
  payer_id: string;
  member_id: string;
  provider_id: string;
  claim_type: 'reimbursement' | 'cashless';
  patient_details: PatientDetails;
  hospital_name: string;
  hospital_address: string;
  admission_date: string; // ISO 8601
  discharge_date: string; // ISO 8601
  claimed_amount: number;
  preauth_number?: string;
  diagnosis: DiagnosisInfo[];
  procedure_codes: string[];
  clinical_notes: string;
  itemized_billing: ServiceBreakdown[];
  documents: DocumentAttachment[];
  bank_details?: BankDetails; // Required for reimbursement
  remarks?: string;
}

export interface InsurancePlanRequest {
  payer_id: string;
  policy_id: string;
}

// ============================================================================
// Response Types
// ============================================================================

export interface PolicyInfo {
  sno: string;
  abha_number?: string;
  mobile_number?: string;
  member_id: string;
  payer_id: string;
  product_id: string;
  product_name: string;
  processing_id: string; // active, inactive, etc.
}

export interface PolicySearchResponse {
  policies: PolicyInfo[];
  count: number;
}

export interface AsyncRequestResponse {
  request_id: string;
  status: string; // request.initiated, request.queued, etc.
  workflow_id: string; // CE01, PA01, CL01, etc.
  message: string;
  estimated_response_time: string;
}

export interface WorkflowHistoryItem {
  workflow_id: string;
  status: string;
  timestamp: string;
  message: string;
}

export interface StatusResponse {
  request_id: string;
  request_type: string;
  current_status: string; // request.initiated, response.complete, response.error
  workflow_id: string;
  workflow_stage: string;
  created_at: string;
  updated_at: string;
  result?: any;
  history: WorkflowHistoryItem[];
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface CoverageEligibilityResult {
  status: string; // active, inactive
  outcome: string; // complete, error, partial
  disposition: string;
  inforce: boolean;
  service_coverage?: Array<{
    service: string;
    code: string;
    covered: boolean;
    benefit_amount?: number;
    copay?: number;
    notes?: string;
  }>;
}

export interface PreAuthResult {
  preauth_number: string;
  status: string; // active, cancelled
  outcome: string; // complete, error, partial
  disposition: string;
  approved_amount: number;
  requested_amount?: number;
  service_breakdown?: Array<{
    service: string;
    requested: number;
    approved: number;
    status: string;
  }>;
}

export interface ClaimResult {
  claim_number: string;
  status: string; // active, cancelled
  outcome: string; // complete, error, partial
  disposition: string;
  approved_amount: number;
  claimed_amount?: number;
  payment_status?: string; // pending, issued, completed
  payment_reference?: string;
  itemized_breakdown?: Array<{
    item: string;
    claimed: number;
    approved: number;
    deduction: number;
    reason?: string;
  }>;
}

export interface InsurancePlanResult {
  plan_id: string;
  plan_name: string;
  plan_type: string;
  status: string;
  sum_insured?: number;
  coverage_benefits?: Array<{
    category: string;
    benefit: string;
    limit: number;
    copay: number;
  }>;
}

// ============================================================================
// API Error Types
// ============================================================================

export class NHCXAPIError extends Error {
  constructor(
    public statusCode: number,
    public error: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'NHCXAPIError';
  }
}

// ============================================================================
// NHCX API Service Class
// ============================================================================

export class NHCXAPIService {
  private config: NHCXConfig;
  private pollingIntervals: Map<string, number> = new Map();

  constructor(config: NHCXConfig) {
    this.config = {
      ...config,
      timeout: config.timeout || 30000,
      baseUrl: config.baseUrl.endsWith('/') ? config.baseUrl.slice(0, -1) : config.baseUrl
    };
  }

  // ============================================================================
  // Core HTTP Methods
  // ============================================================================

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: 'Unknown error', message: response.statusText };
        }

        throw new NHCXAPIError(
          response.status,
          errorData.error || 'API Error',
          errorData.message || response.statusText,
          errorData.details
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof NHCXAPIError) {
        throw error;
      }

      if ((error as Error).name === 'AbortError') {
        throw new NHCXAPIError(408, 'Timeout', 'Request timeout');
      }

      throw new NHCXAPIError(
        500,
        'NetworkError',
        (error as Error).message || 'Network request failed'
      );
    }
  }

  // ============================================================================
  // Flow 1: Policy Search
  // ============================================================================

  async searchPolicies(request: PolicySearchRequest): Promise<PolicySearchResponse> {
    return this.request<PolicySearchResponse>(
      '/api/v1/nhcx/policies/search',
      'POST',
      request
    );
  }

  // ============================================================================
  // Flow 2: Coverage Eligibility Check
  // ============================================================================

  async submitCoverageEligibility(
    request: CoverageEligibilityRequest
  ): Promise<AsyncRequestResponse> {
    return this.request<AsyncRequestResponse>(
      '/api/v1/nhcx/coverage-eligibility/check',
      'POST',
      request
    );
  }

  async getCoverageEligibilityStatus(
    requestId: string
  ): Promise<StatusResponse> {
    return this.request<StatusResponse>(
      `/api/v1/nhcx/status/${requestId}`,
      'GET'
    );
  }

  async getCoverageEligibilityResult(
    requestId: string
  ): Promise<CoverageEligibilityResult> {
    return this.request<CoverageEligibilityResult>(
      `/api/v1/nhcx/coverage-eligibility/${requestId}`,
      'GET'
    );
  }

  // ============================================================================
  // Flow 3: Pre-Authorization
  // ============================================================================

  async submitPreAuth(request: PreAuthRequest): Promise<AsyncRequestResponse> {
    return this.request<AsyncRequestResponse>(
      '/api/v1/nhcx/preauth/submit',
      'POST',
      request
    );
  }

  async getPreAuthStatus(requestId: string): Promise<StatusResponse> {
    return this.request<StatusResponse>(
      `/api/v1/nhcx/status/${requestId}`,
      'GET'
    );
  }

  async getPreAuthResult(requestId: string): Promise<PreAuthResult> {
    return this.request<PreAuthResult>(
      `/api/v1/nhcx/preauth/${requestId}`,
      'GET'
    );
  }

  // ============================================================================
  // Flow 4: Claim Submission
  // ============================================================================

  async submitClaim(request: ClaimRequest): Promise<AsyncRequestResponse> {
    return this.request<AsyncRequestResponse>(
      '/api/v1/nhcx/claim/submit',
      'POST',
      request
    );
  }

  async getClaimStatus(requestId: string): Promise<StatusResponse> {
    return this.request<StatusResponse>(
      `/api/v1/nhcx/status/${requestId}`,
      'GET'
    );
  }

  async getClaimResult(requestId: string): Promise<ClaimResult> {
    return this.request<ClaimResult>(
      `/api/v1/nhcx/claim/${requestId}`,
      'GET'
    );
  }

  // ============================================================================
  // Flow 5: Insurance Plan Details
  // ============================================================================

  async requestInsurancePlan(
    request: InsurancePlanRequest
  ): Promise<AsyncRequestResponse> {
    return this.request<AsyncRequestResponse>(
      '/api/v1/nhcx/insurance-plan/request',
      'POST',
      request
    );
  }

  async getInsurancePlanStatus(requestId: string): Promise<StatusResponse> {
    return this.request<StatusResponse>(
      `/api/v1/nhcx/status/${requestId}`,
      'GET'
    );
  }

  async getInsurancePlanResult(requestId: string): Promise<InsurancePlanResult> {
    return this.request<InsurancePlanResult>(
      `/api/v1/nhcx/insurance-plan/${requestId}`,
      'GET'
    );
  }

  // ============================================================================
  // Flow 6: Unified Status Dashboard
  // ============================================================================

  async getAllRequests(params?: {
    status?: string;
    type?: string;
    limit?: number;
    offset?: number;
    payer_id?: string;
    patient_name?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<{
    requests: StatusResponse[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }

    return this.request(
      `/api/v1/nhcx/requests?${queryParams.toString()}`,
      'GET'
    );
  }

  // ============================================================================
  // FHIR Bundle Retrieval
  // ============================================================================

  async getFHIRBundle(requestId: string): Promise<FHIRBundle> {
    return this.request<FHIRBundle>(
      `/api/v1/nhcx/fhir/bundle/${requestId}`,
      'GET'
    );
  }

  // ============================================================================
  // Polling Helper Methods
  // ============================================================================

  /**
   * Start polling for status updates
   * @param requestId - The request ID to poll
   * @param callback - Callback function called on each status update
   * @param interval - Poll interval in milliseconds (default: 30000)
   * @param maxAttempts - Maximum number of poll attempts (default: 120)
   */
  startPolling(
    requestId: string,
    callback: (status: StatusResponse, attempts: number) => void,
    interval: number = 30000,
    maxAttempts: number = 120
  ): void {
    let attempts = 0;

    const poll = async () => {
      attempts++;

      try {
        const status = await this.request<StatusResponse>(
          `/api/v1/nhcx/status/${requestId}`,
          'GET'
        );

        callback(status, attempts);

        // Stop polling if complete or error
        if (
          status.current_status === 'response.complete' ||
          status.current_status === 'response.error' ||
          attempts >= maxAttempts
        ) {
          this.stopPolling(requestId);
        }
      } catch (error) {
        console.error('Polling error:', error);
        // Continue polling on error unless max attempts reached
        if (attempts >= maxAttempts) {
          this.stopPolling(requestId);
        }
      }
    };

    // Initial poll
    poll();

    // Set up interval
    const intervalId = setInterval(poll, interval);
    this.pollingIntervals.set(requestId, intervalId);
  }

  /**
   * Stop polling for a specific request
   */
  stopPolling(requestId: string): void {
    const intervalId = this.pollingIntervals.get(requestId);
    if (intervalId) {
      clearInterval(intervalId);
      this.pollingIntervals.delete(requestId);
    }
  }

  /**
   * Stop all active polling
   */
  stopAllPolling(): void {
    this.pollingIntervals.forEach((intervalId) => clearInterval(intervalId));
    this.pollingIntervals.clear();
  }

  /**
   * Wait for request to complete (Promise-based polling)
   * @param requestId - The request ID to wait for
   * @param interval - Poll interval in milliseconds (default: 30000)
   * @param maxAttempts - Maximum number of poll attempts (default: 120)
   * @returns Promise that resolves with final status
   */
  async waitForCompletion(
    requestId: string,
    interval: number = 30000,
    maxAttempts: number = 120
  ): Promise<StatusResponse> {
    return new Promise((resolve, reject) => {
      let attempts = 0;

      const poll = async () => {
        attempts++;

        try {
          const status = await this.request<StatusResponse>(
            `/api/v1/nhcx/status/${requestId}`,
            'GET'
          );

          if (status.current_status === 'response.complete') {
            clearInterval(intervalId);
            resolve(status);
          } else if (status.current_status === 'response.error') {
            clearInterval(intervalId);
            reject(
              new NHCXAPIError(
                500,
                'RequestError',
                status.error?.message || 'Request failed',
                status.error?.details
              )
            );
          } else if (attempts >= maxAttempts) {
            clearInterval(intervalId);
            reject(
              new NHCXAPIError(
                408,
                'Timeout',
                'Request timed out waiting for completion'
              )
            );
          }
        } catch (error) {
          clearInterval(intervalId);
          reject(error);
        }
      };

      const intervalId = setInterval(poll, interval);
      poll(); // Initial poll
    });
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let nhcxApiInstance: NHCXAPIService | null = null;

export const initializeNHCXAPI = (config: NHCXConfig): NHCXAPIService => {
  nhcxApiInstance = new NHCXAPIService(config);
  return nhcxApiInstance;
};

export const getNHCXAPI = (): NHCXAPIService => {
  if (!nhcxApiInstance) {
    throw new Error('NHCX API not initialized. Call initializeNHCXAPI() first or configure VITE_NHCX_API_BASE_URL.');
  }
  return nhcxApiInstance;
};

export const isNHCXAPIInitialized = (): boolean => {
  return nhcxApiInstance !== null;
};

// ============================================================================
// Export default instance getter
// ============================================================================

export default {
  initialize: initializeNHCXAPI,
  getInstance: getNHCXAPI,
  isInitialized: isNHCXAPIInitialized
};
