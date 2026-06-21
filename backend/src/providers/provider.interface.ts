export interface DiscoveredModel {
  id: string; // The raw provider identifier, e.g. 'gpt-4o'
  displayName: string;
  capabilities: {
    text: boolean;
    vision: boolean;
    audio: boolean;
  };
}

export interface ValidationResult {
  status: 'Working' | 'Invalid' | 'Quota Exceeded' | 'Rate Limited' | 'Unauthorized' | 'Error' | 'Unknown';
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface VerificationResult {
  status: 'Working' | 'Failed' | 'Unauthorized' | 'Deprecated' | 'Timeout' | 'Rate Limited' | 'Unknown';
  latencyMs: number;
  errorMessage?: string;
  response?: string;
}

export interface ProviderAdapter {
  validateKey(apiKey: string): Promise<ValidationResult>;
  fetchModels(apiKey: string): Promise<DiscoveredModel[]>;
  testModel(apiKey: string, modelName: string, prompt: string): Promise<VerificationResult>;
}
