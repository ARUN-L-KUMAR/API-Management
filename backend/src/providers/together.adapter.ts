import axios from 'axios';
import { ProviderAdapter, DiscoveredModel, ValidationResult, VerificationResult } from './provider.interface';

export class TogetherAdapter implements ProviderAdapter {
  private baseUrl = 'https://api.together.xyz/v1';

  async validateKey(apiKey: string): Promise<ValidationResult> {
    try {
      await axios.get(`${this.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      return { status: 'Working' };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async fetchModels(apiKey: string): Promise<DiscoveredModel[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      const list = response.data || [];
      return list
        .filter((model: any) => model.type === 'chat' || model.type === 'language')
        .map((model: any) => {
          const id = model.id;
          return {
            id,
            displayName: model.display_name || id.split('/').pop().replace(/-/g, ' ').toUpperCase(),
            capabilities: {
              text: true,
              vision: id.includes('vision') || id.includes('vl'),
              audio: false,
            },
          };
        });
    } catch (error) {
      return [];
    }
  }

  async testModel(apiKey: string, modelName: string, prompt: string): Promise<VerificationResult> {
    const startTime = Date.now();
    try {
      const res = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: modelName,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 10,
        },
        {
          headers: { Authorization: `Bearer ${apiKey}` },
          timeout: 10000,
        }
      );

      const responseText = res.data?.choices?.[0]?.message?.content || '';
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
        return { status: 'Unauthorized', errorMessage: 'Invalid Together AI API Key.' };
      }
      if (status === 402) {
        return { status: 'Quota Exceeded', errorMessage: 'Insufficient Together AI funds.' };
      }
      if (status === 429) {
        return { status: 'Rate Limited', errorMessage: 'Together AI rate limit hit.' };
      }
      return { status: 'Invalid', errorMessage: message || `HTTP Error ${status}` };
    }
    return { status: 'Error', errorMessage: error.message || 'Network connectivity issue.' };
  }
}
