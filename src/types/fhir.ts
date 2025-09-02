// FHIR TypeScript interfaces for NHCX
export interface Coding {
  system?: string;
  code?: string;
  display?: string;
}

export interface CodeableConcept {
  coding?: Coding[];
  text?: string;
}

export interface Extension {
  id?: string;
  url?: string;
  extension?: Extension[];
  valueString?: string;
  valueCodeableConcept?: CodeableConcept;
  valueBoolean?: boolean;
  valueInteger?: number;
  valueDecimal?: number;
  valueDateTime?: string;
}

export interface Identifier {
  system?: string;
  value?: string;
  type?: CodeableConcept;
}

export interface Period {
  start?: string;
  end?: string;
}

export interface Reference {
  reference?: string;
  display?: string;
  identifier?: Identifier;
}

export interface Quantity {
  value?: number;
  unit?: string;
  system?: string;
  code?: string;
}

export interface Money {
  value?: number;
  currency?: string;
}

export interface Address {
  use?: string;
  type?: string;
  text?: string;
  line?: string[];
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface ContactPoint {
  system?: string;
  value?: string;
  use?: string;
}

export interface HumanName {
  use?: string;
  family?: string;
  given?: string[];
  prefix?: string[];
  suffix?: string[];
  text?: string;
}

export interface Meta {
  lastUpdated?: string;
  tag?: CodeableConcept[];
  profile?: string[];
  versionId?: string;
  security?: CodeableConcept[];
}

// Resource Types
export interface Patient {
  resourceType: "Patient";
  id?: string;
  meta?: Meta;
  identifier?: Identifier[];
  name?: HumanName[];
  telecom?: ContactPoint[];
  gender?: string;
  birthDate?: string;
  address?: Address[];
}

export interface Practitioner {
  resourceType: "Practitioner";
  id?: string;
  meta?: Meta;
  identifier?: Identifier[];
  name?: HumanName[];
  telecom?: ContactPoint[];
  address?: Address[];
  qualification?: any[];
}

export interface Organization {
  resourceType: "Organization";
  id?: string;
  meta?: Meta;
  identifier?: Identifier[];
  name?: string;
  type?: CodeableConcept[];
  telecom?: ContactPoint[];
  address?: Address[];
}

export interface Location {
  resourceType: "Location";
  id?: string;
  meta?: Meta;
  identifier?: Identifier[];
  name?: string;
  type?: CodeableConcept[];
  address?: Address;
}

export interface Coverage {
  resourceType: "Coverage";
  id?: string;
  meta?: Meta;
  identifier?: Identifier[];
  status?: string;
  type?: CodeableConcept;
  beneficiary?: Reference;
  payor?: Reference[];
  period?: Period;
}

// Claim Resources
export interface ClaimDiagnosis {
  sequence?: number;
  diagnosisCodeableConcept?: CodeableConcept;
  type?: CodeableConcept[];
}

export interface ClaimProcedure {
  sequence?: number;
  type?: CodeableConcept[];
  date?: string;
  procedureCodeableConcept?: CodeableConcept;
}

export interface ClaimItem {
  sequence?: number;
  category?: CodeableConcept;
  productOrService?: CodeableConcept;
  quantity?: Quantity;
  unitPrice?: Money;
  net?: Money;
}

export interface ClaimSupportingInfo {
  sequence?: number;
  category?: CodeableConcept;
  code?: CodeableConcept;
  valueString?: string;
  valueAttachment?: any;
}

export interface Claim {
  resourceType: "Claim";
  id?: string;
  meta?: Meta;
  identifier?: Identifier[];
  status?: string;
  type?: CodeableConcept;
  use?: string;
  patient?: Reference;
  billablePeriod?: Period;
  created?: string;
  provider?: Reference;
  priority?: CodeableConcept;
  supportingInfo?: ClaimSupportingInfo[];
  diagnosis?: ClaimDiagnosis[];
  procedure?: ClaimProcedure[];
  insurance?: any[];
  item?: ClaimItem[];
  total?: Money;
}

export interface ClaimResponse {
  resourceType: "ClaimResponse";
  id?: string;
  meta?: Meta;
  identifier?: Identifier[];
  status?: string;
  type?: CodeableConcept;
  use?: string;
  patient?: Reference;
  created?: string;
  insurer?: Reference;
  requestor?: Reference;
  request?: Reference;
  outcome?: string;
  disposition?: string;
  preAuthRef?: string;
  preAuthPeriod?: Period;
  payeeType?: CodeableConcept;
  item?: any[];
  total?: Money[];
  payment?: any;
  fundsReserve?: CodeableConcept;
  formCode?: CodeableConcept;
  form?: any;
  processNote?: any[];
  communicationRequest?: Reference[];
  insurance?: any[];
  error?: any[];
}

// Coverage Eligibility Resources
export interface CoverageEligibilityRequestItem {
  category?: CodeableConcept;
  productOrService?: CodeableConcept;
  quantity?: Quantity;
  unitPrice?: Money;
}

export interface CoverageEligibilityRequest {
  resourceType: "CoverageEligibilityRequest";
  id?: string;
  meta?: Meta;
  identifier?: Identifier[];
  status?: string;
  priority?: CodeableConcept;
  purpose?: string[];
  patient?: Reference;
  created?: string;
  enterer?: Reference;
  provider?: Reference;
  insurer?: Reference;
  facility?: Reference;
  insurance?: any[];
  item?: CoverageEligibilityRequestItem[];
}

export interface CoverageEligibilityResponseBenefit {
  type?: CodeableConcept;
  allowedMoney?: Money;
  usedMoney?: Money;
  description?: string;
}

export interface CoverageEligibilityResponseItem {
  category?: CodeableConcept;
  productOrService?: CodeableConcept;
  excluded?: boolean;
  name?: string;
  description?: string;
  benefit?: CoverageEligibilityResponseBenefit[];
}

export interface CoverageEligibilityResponseInsurance {
  coverage?: Reference;
  inforce?: boolean;
  item?: CoverageEligibilityResponseItem[];
}

export interface CoverageEligibilityResponse {
  resourceType: "CoverageEligibilityResponse";
  id?: string;
  meta?: Meta;
  identifier?: Identifier[];
  status?: string;
  purpose?: string[];
  patient?: Reference;
  created?: string;
  requestor?: Reference;
  request?: Reference;
  outcome?: string;
  disposition?: string;
  insurer?: Reference;
  insurance?: CoverageEligibilityResponseInsurance[];
}

// Insurance Plan Resources
export interface Limit {
  value?: Quantity;
  code?: CodeableConcept;
}

export interface Benefit {
  extension?: Extension[];
  type?: CodeableConcept;
  limit?: Limit[];
}

export interface InsurancePlanCoverage {
  extension?: Extension[];
  type?: CodeableConcept;
  benefit?: Benefit[];
}

export interface InsurancePlan {
  resourceType: "InsurancePlan";
  id?: string;
  meta?: Meta;
  extension?: Extension[];
  identifier?: Identifier[];
  status?: string;
  type?: CodeableConcept[];
  name?: string;
  period?: Period;
  ownedBy?: Reference;
  administeredBy?: Reference;
  coverageArea?: Reference[];
  coverage?: InsurancePlanCoverage[];
}

// Union type for all possible resources
export type FHIRResource = Patient 
  | Practitioner 
  | Organization 
  | Location 
  | Coverage 
  | Claim 
  | ClaimResponse
  | CoverageEligibilityRequest 
  | CoverageEligibilityResponse 
  | InsurancePlan;

export interface BundleEntry {
  id?: string;
  fullUrl?: string;
  resource?: FHIRResource;
}

export interface FHIRBundle {
  resourceType: "Bundle";
  id?: string;
  meta?: Meta;
  identifier?: Identifier;
  type?: string;
  timestamp?: string;
  entry?: BundleEntry[];
}

// Utility type to get resource type
export type ResourceType = FHIRResource['resourceType'];
