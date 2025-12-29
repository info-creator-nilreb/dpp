/**
 * Feature Registry Types
 * 
 * Shared type definitions for Feature Registry components
 */

export interface Feature {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: string;
  capabilityKey: string | null;
  minimumPlan: string;
  requiresActiveSubscription: boolean;
  requiresPublishingCapability: boolean;
  visibleInTrial: boolean;
  usableInTrial: boolean;
  configSchema: string | null;
  enabled: boolean;
  defaultForNewDpps: boolean;
  systemDefined: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Feature for Editor (id is optional for new features)
 */
export interface FeatureFormData {
  id?: string;
  key: string;
  name: string;
  description: string | null;
  category: string;
  capabilityKey: string | null;
  minimumPlan: string;
  requiresActiveSubscription: boolean;
  requiresPublishingCapability: boolean;
  visibleInTrial: boolean;
  usableInTrial: boolean;
  configSchema: string | null;
  enabled: boolean;
  defaultForNewDpps: boolean;
}

