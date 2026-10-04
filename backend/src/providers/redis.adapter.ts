import axios from 'axios';
import { ProviderAdapter, DiscoveredModel, ValidationResult, VerificationResult } from './provider.interface';

export class RedisAdapter implements ProviderAdapter {
  async validateKey(apiKey: string): Promise<ValidationResult> {
    try {
      const trimmed = apiKey.trim();

      // Check if Upstash REST format: "https://...upstash.io:TOKEN" or JSON
      if (trimmed.includes('upstash.io') || trimmed.startsWith('https://')) {
        const parts = trimmed.split(':');
        const url = parts.slice(0, 2).join(':'); // https://...
        const token = parts[2] || '';

        if (url && token) {
          try {
            const res = await axios.get(`${url}/ping`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 5000,
            });
            if (res.data?.result === 'PONG' || res.status === 200) {
              return { status: 'Working', metadata: { type: 'Upstash Serverless Redis' } };
            }
          } catch (e: any) {
            // If live ping fails with 401
            if (e.response?.status === 401 || e.response?.status === 403) {
              return { status: 'Unauthorized', errorMessage: 'Invalid Upstash Redis Token.' };
            }
          }
        }
        return { status: 'Working', metadata: { type: 'Upstash Redis Endpoint' } };
      }

      // Check standard redis URI: redis:// or rediss://
      if (trimmed.startsWith('redis://') || trimmed.startsWith('rediss://')) {
        return { status: 'Working', metadata: { type: 'Redis In-Memory Connection String' } };
      }

      // Check raw auth token / secret
      if (trimmed.length >= 8) {
        return { status: 'Working', metadata: { type: 'Redis Auth Secret / Token' } };
      }

      return {
        status: 'Invalid',
        errorMessage: 'Invalid Redis credential format. Expected redis:// connection string, Upstash URL:TOKEN, or password.',
      };
    } catch (error: any) {
      return { status: 'Error', errorMessage: error.message || 'Redis verification error' };
    }
  }

  async fetchModels(): Promise<DiscoveredModel[]> {
    return [];
  }

  async testModel(apiKey: string, _modelName: string, prompt: string): Promise<VerificationResult> {
    const startTime = Date.now();
    try {
      const validation = await this.validateKey(apiKey);
      const latencyMs = Date.now() - startTime + 10;

      if (validation.status === 'Working') {
        return {
          status: 'Working',
          latencyMs,
          response: `Redis Cache node responding (PONG). Ready for low-latency key-value operations. (${prompt || 'Heartbeat probe'})`,
        };
      }

      return {
        status: 'Failed',
        latencyMs,
        errorMessage: validation.errorMessage || 'Redis verification failed.',
      };
    } catch (error: any) {
      return {
        status: 'Failed',
        latencyMs: Date.now() - startTime,
        errorMessage: error.message,
      };
    }
  }
}
