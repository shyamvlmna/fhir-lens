/**
 * Unified Data Service
 * Handles loading FHIR bundles from either local files or API
 * based on configuration
 */

import { FHIRBundle } from '../types/fhir';
import { dataSourceConfig } from '../config/dataSourceConfig';

export interface BundleMetadata {
  title: string;
  description: string;
  type: 'request' | 'response';
  workflow: string;
  resourceCount?: number;
}

export interface BundleListItem extends BundleMetadata {
  id: string;
  name: string;
}

/**
 * Detect bundle metadata from FHIR bundle content
 */
export const detectBundleMetadata = (bundle: FHIRBundle): BundleMetadata => {
  const profile = bundle.meta?.profile?.[0] || '';
  const mainResource = bundle.entry?.[0]?.resource;
  const mainResourceType = mainResource?.resourceType as string | undefined;
  const mainResourceProfile = (mainResource as any)?.meta?.profile?.[0] || '';

  const isResponse = mainResourceType?.includes('Response') ||
                    profile.includes('Response') ||
                    mainResourceProfile.includes('Response');

  // Insurance Plan Detection
  if (mainResourceType === 'InsurancePlan' ||
      profile.includes('InsurancePlan') ||
      mainResourceProfile.includes('InsurancePlan')) {
    return {
      title: 'Insurance Plan',
      description: 'Insurance plan details with coverage and benefits',
      type: 'response',
      workflow: 'Insurance Plan Discovery',
      resourceCount: bundle.entry?.length || 0
    };
  }

  // Coverage Eligibility Detection
  if (mainResourceType === 'CoverageEligibilityRequest' ||
      profile.includes('CoverageEligibilityRequest') ||
      mainResourceProfile.includes('CoverageEligibilityRequest')) {
    return {
      title: 'Eligibility Check Request',
      description: 'Coverage eligibility verification request',
      type: 'request',
      workflow: 'Eligibility Verification',
      resourceCount: bundle.entry?.length || 0
    };
  }

  if (mainResourceType === 'CoverageEligibilityResponse' ||
      profile.includes('CoverageEligibilityResponse') ||
      mainResourceProfile.includes('CoverageEligibilityResponse')) {
    return {
      title: 'Eligibility Check Response',
      description: 'Coverage eligibility verification response',
      type: 'response',
      workflow: 'Eligibility Verification',
      resourceCount: bundle.entry?.length || 0
    };
  }

  // Claim Detection
  if (mainResourceType === 'Claim' ||
      (profile.includes('Claim') && !profile.includes('Response'))) {
    return {
      title: 'Claim Request',
      description: 'Medical claim submission',
      type: 'request',
      workflow: 'Claim Processing',
      resourceCount: bundle.entry?.length || 0
    };
  }

  if (mainResourceType === 'ClaimResponse' ||
      profile.includes('ClaimResponse')) {
    return {
      title: 'Claim Response',
      description: 'Medical claim processing response',
      type: 'response',
      workflow: 'Claim Processing',
      resourceCount: bundle.entry?.length || 0
    };
  }

  // Pre-Authorization Detection
  if (profile.includes('PreAuth') ||
      mainResourceProfile.includes('PreAuth') ||
      (mainResource as any)?.type?.coding?.[0]?.code === 'preauthorization') {
    return {
      title: isResponse ? 'Pre-Authorization Response' : 'Pre-Authorization Request',
      description: 'Pre-authorization requirements and approval',
      type: isResponse ? 'response' : 'request',
      workflow: 'Pre-Authorization',
      resourceCount: bundle.entry?.length || 0
    };
  }

  // Coverage Detection
  if (mainResourceType === 'Coverage') {
    return {
      title: 'Coverage Information',
      description: 'Insurance coverage details',
      type: isResponse ? 'response' : 'request',
      workflow: 'Coverage Information',
      resourceCount: bundle.entry?.length || 0
    };
  }

  // Task/Communication Detection
  if (mainResourceType === 'Task' || mainResourceType === 'Communication') {
    return {
      title: 'Claim Status Check',
      description: 'Claim processing status inquiry',
      type: isResponse ? 'response' : 'request',
      workflow: 'Claim Status',
      resourceCount: bundle.entry?.length || 0
    };
  }

  // Generic fallback
  return {
    title: mainResourceType || 'FHIR Bundle',
    description: `${mainResourceType || 'FHIR'} resource bundle`,
    type: isResponse ? 'response' : 'request',
    workflow: 'NHCX Workflow',
    resourceCount: bundle.entry?.length || 0
  };
};

/**
 * Load bundle from local file system
 */
const loadBundleFromLocal = async (identifier: string): Promise<FHIRBundle> => {
  const resourcePath = dataSourceConfig.getLocalResourcePath();

  // Try both with resource path and without
  let response = await fetch(`${resourcePath}/${identifier}`);
  if (!response.ok) {
    response = await fetch(`/${identifier}`);
  }

  if (!response.ok) {
    throw new Error(`Failed to load bundle: ${identifier}`);
  }

  const data = await response.json() as FHIRBundle;
  return data;
};

/**
 * Load bundle from API
 */
const loadBundleFromApi = async (identifier: string): Promise<FHIRBundle> => {
  const baseUrl = dataSourceConfig.getApiBaseUrl();
  const timeout = dataSourceConfig.getApiTimeout();

  if (!baseUrl) {
    throw new Error('API base URL not configured');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Assume API endpoint is {baseUrl}/bundles/{identifier}
    const response = await fetch(`${baseUrl}/abdm/nhcx/v1/bundle/${identifier}`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/fhir+json',
        'Content-Type': 'application/fhir+json'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as FHIRBundle;
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('API request timed out');
    }
    throw error;
  }
};

/**
 * List available bundles from local file system
 */
const listBundlesFromLocal = async (): Promise<BundleListItem[]> => {
  const resourcePath = dataSourceConfig.getLocalResourcePath();
  const fileList: BundleListItem[] = [];

  // Common NHCX file patterns
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
    'coverageResp.json'
  ];

  // Test each pattern to see if the file exists
  for (const filename of patterns) {
    try {
      let response = await fetch(`${resourcePath}/${filename}`);
      if (!response.ok) {
        response = await fetch(`/${filename}`);
      }

      if (response.ok) {
        const data = await response.json() as FHIRBundle;
        const metadata = detectBundleMetadata(data);
        fileList.push({
          id: filename,
          name: filename,
          ...metadata
        });
      }
    } catch (err) {
      // File doesn't exist or isn't valid JSON, skip it
    }
  }

  return fileList;
};

/**
 * List available bundles from API
 */
const listBundlesFromApi = async (): Promise<BundleListItem[]> => {
  const baseUrl = dataSourceConfig.getApiBaseUrl();
  const timeout = dataSourceConfig.getApiTimeout();

  if (!baseUrl) {
    throw new Error('API base URL not configured');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Assume API endpoint is {baseUrl}/bundles for listing
    const response = await fetch(`${baseUrl}/bundles`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Expect response format: { bundles: [{ id, name, title, description, type, workflow }] }
    if (Array.isArray(data)) {
      return data as BundleListItem[];
    } else if (data.bundles && Array.isArray(data.bundles)) {
      return data.bundles as BundleListItem[];
    } else {
      throw new Error('Invalid API response format');
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('API request timed out');
    }
    throw error;
  }
};

/**
 * Load a FHIR bundle by identifier
 * Automatically uses configured data source (local or API)
 */
export const loadBundle = async (identifier: string): Promise<FHIRBundle> => {
  const sourceType = dataSourceConfig.getType();

  console.log(`📦 Loading bundle "${identifier}" from ${sourceType.toUpperCase()} source...`);

  try {
    if (sourceType === 'local') {
      return await loadBundleFromLocal(identifier);
    } else {
      return await loadBundleFromApi(identifier);
    }
  } catch (error) {
    console.error(`❌ Failed to load bundle from ${sourceType}:`, error);
    throw error;
  }
};

/**
 * List available FHIR bundles
 * Automatically uses configured data source (local or API)
 */
export const listBundles = async (): Promise<BundleListItem[]> => {
  const sourceType = dataSourceConfig.getType();

  console.log(`📋 Listing bundles from ${sourceType.toUpperCase()} source...`);

  try {
    let bundles: BundleListItem[];

    if (sourceType === 'local') {
      bundles = await listBundlesFromLocal();
    } else {
      bundles = await listBundlesFromApi();
    }

    // Sort bundles by workflow and type
    bundles.sort((a, b) => {
      if (a.workflow !== b.workflow) {
        return a.workflow.localeCompare(b.workflow);
      }
      if (a.type !== b.type) {
        return a.type === 'request' ? -1 : 1;
      }
      return a.title.localeCompare(b.title);
    });

    console.log(`✅ Found ${bundles.length} bundles`);
    return bundles;
  } catch (error) {
    console.error(`❌ Failed to list bundles from ${sourceType}:`, error);
    throw error;
  }
};

/**
 * Get current data source information
 */
export const getDataSourceInfo = () => {
  const config = dataSourceConfig.getConfig();
  return {
    type: config.type,
    source: config.type === 'local'
      ? config.localResourcePath
      : config.apiBaseUrl,
    isConfigured: config.type === 'local' || !!config.apiBaseUrl
  };
};

export default {
  loadBundle,
  listBundles,
  detectBundleMetadata,
  getDataSourceInfo
};

