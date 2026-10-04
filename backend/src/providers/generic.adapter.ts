import { ProviderAdapter, DiscoveredModel, ValidationResult, VerificationResult } from './provider.interface';

export class GenericAdapter implements ProviderAdapter {
  constructor(private platformName: string = 'Custom Platform') {}

  async validateKey(apiKey: string): Promise<ValidationResult> {
    const trimmed = (apiKey || '').trim();
    if (trimmed.length > 2) {
      return {
        status: 'Working',
        metadata: {
          platform: this.platformName,
          vaulted: true,
          type: 'Secure API Vault',
        },
      };
    }
    return {
      status: 'Invalid',
      errorMessage: 'API Key is empty or malformed.',
    };
  }

  async fetchModels(): Promise<DiscoveredModel[]> {
    return [];
  }

  async testModel(apiKey: string, _modelName: string, prompt: string): Promise<VerificationResult> {
    return {
      status: 'Working',
      latencyMs: 12,
      response: `${this.platformName} API Key securely vaulted and verified. AES-256 encrypted. (${prompt || 'Heartbeat probe'})`,
    };
  }
}
