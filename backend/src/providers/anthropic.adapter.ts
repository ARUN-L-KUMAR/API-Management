import axios from 'axios';
import { ProviderAdapter, DiscoveredModel, ValidationResult, VerificationResult } from './provider.interface';

export class AnthropicAdapter implements ProviderAdapter {
  private baseUrl = 'https://api.anthropic.com/v1';

  // Anthropic static models fallback list since they lack a public list endpoint
  private staticModels: DiscoveredModel[] = [
    {
      id: 'claude-3-5-sonnet-latest',
      displayName: 'Claude 3.5 Sonnet (Latest)',
      capabilities: { text: true, vision: true, audio: false },
    },
    {
      id: 'claude-3-5-haiku-latest',
      displayName: 'Claude 3.5 Haiku (Latest)',
      capabilities: { text: true, vision: false, audio: false },
    },
    {
      id: 'claude-3-opus-latest',
      displayName: 'Claude 3 Opus (Latest)',
      capabilities: { text: true, vision: true, audio: false },
    },
    {
      id: 'claude-3-sonnet-20240229',
      displayName: 'Claude 3 Sonnet',
      capabilities: { text: true, vision: true, audio: false },
    },
    {
      id: 'claude-3-haiku-20240307',
      displayName: 'Claude 3 Haiku',
      capabilities: { text: true, vision: true, audio: false },
    },
  ];

  async validateKey(apiKey: string): Promise<ValidationResult> {
    try {
      // Execute a minimum-token message call to check auth status
      await axios.post(
        `${this.baseUrl}/messages`,
        {
          model: 'claude-3-5-haiku-latest',
          messages: [{ role: 'user', content: 'Ping' }],
          max_tokens: 1,
        },
        {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
        }
      );
      return { status: 'Working' };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async fetchModels(apiKey: string): Promise<DiscoveredModel[]> {
    // Check key validity first. If valid, return static models.
    const validation = await this.validateKey(apiKey);
    if (validation.status === 'Working' || validation.status === 'Rate Limited') {
      return this.staticModels;
    }
    return [];
  }

  async testModel(apiKey: string, modelName: string, prompt: string): Promise<VerificationResult> {
    const startTime = Date.now();
    try {
      const res = await axios.post(
        `${this.baseUrl}/messages`,
        {
          model: modelName,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 5,
        },
        {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          timeout: 10000,
        }
      );

      const responseText = res.data?.content?.[0]?.text || '';
      const latencyMs = Date.now() - startTime;

      return {
        status: 'Working',
        latencyMs,
        response: responseText.trim(),
      };
    } catch (error: any) {
      const latencyMs = Date.now() - startTime;
      const errorResult = this.handleError(error);

      let status: VerificationResult['status'] = 'Failed';
      if (errorResult.status === 'Unauthorized') status = 'Unauthorized';
      else if (errorResult.status === 'Rate Limited') status = 'Rate Limited';

      return {
        status,
        latencyMs,
        errorMessage: error.response?.data?.error?.message || error.message,
      };
    }
  }

  private handleError(error: any): ValidationResult {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.error?.message || '';

      if (status === 401) {
        return { status: 'Unauthorized', errorMessage: 'Invalid Anthropic API Key.' };
      }
      if (status === 403) {
        return { status: 'Unauthorized', errorMessage: 'Access denied to Anthropic resource.' };
      }
      if (status === 429) {
        if (message.includes('quota') || message.includes('credit')) {
          return { status: 'Quota Exceeded', errorMessage: 'Anthropic credits exhausted.' };
        }
        return { status: 'Rate Limited', errorMessage: 'Anthropic rate limit hit.' };
      }
      return { status: 'Invalid', errorMessage: message || `HTTP Error ${status}` };
    }
    return { status: 'Error', errorMessage: error.message || 'Network connectivity issue.' };
  }
}
