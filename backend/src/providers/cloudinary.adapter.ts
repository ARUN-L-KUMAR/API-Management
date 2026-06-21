import axios from 'axios';
import { ProviderAdapter, DiscoveredModel, ValidationResult, VerificationResult } from './provider.interface';

export class CloudinaryAdapter implements ProviderAdapter {
  async validateKey(apiKey: string): Promise<ValidationResult> {
    try {
      const [cloudName, key, secret] = apiKey.split(':');
      if (cloudName && key && secret) {
        await axios.get(`https://api.cloudinary.com/v1_1/${cloudName}/resources/image`, {
          auth: { username: key, password: secret },
        });
        return { status: 'Working' };
      }
      return { status: 'Invalid', errorMessage: 'Expected format: cloudname:key:secret' };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async fetchModels(): Promise<DiscoveredModel[]> {
    return [];
  }

  async testModel(apiKey: string, _modelName: string, prompt: string): Promise<VerificationResult> {
    const startTime = Date.now();
    try {
      const [cloudName, key, secret] = apiKey.split(':');
      if (cloudName && key && secret) {
        await axios.get(`https://api.cloudinary.com/v1_1/${cloudName}/ping`, {
          auth: { username: key, password: secret },
        });
        const latencyMs = Date.now() - startTime;
        return { status: 'Working', latencyMs, response: `Cloudinary ping OK: ${prompt}` };
      }
      const latencyMs = Date.now() - startTime;
      return { status: 'Failed', latencyMs, errorMessage: 'Invalid Cloudinary credentials format.' };
    } catch (error: any) {
      const latencyMs = Date.now() - startTime;
      const errorResult = this.handleError(error);
      return {
        status: errorResult.status === 'Unauthorized' ? 'Unauthorized' : 'Failed',
        latencyMs,
        errorMessage: error.response?.data?.error?.message || error.message,
      };
    }
  }

  private handleError(error: any): ValidationResult {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.error?.message || '';
      if (status === 401 || status === 403) {
        return { status: 'Unauthorized', errorMessage: 'Invalid Cloudinary credentials.' };
      }
      return { status: 'Invalid', errorMessage: message || `HTTP Error ${status}` };
    }
    return { status: 'Error', errorMessage: error.message || 'Network connectivity issue.' };
  }
}
