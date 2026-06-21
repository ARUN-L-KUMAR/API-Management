import axios from 'axios';
import { ProviderAdapter, DiscoveredModel, ValidationResult, VerificationResult } from './provider.interface';

export class OpenRouterAdapter implements ProviderAdapter {
  private baseUrl = 'https://openrouter.ai/api/v1';

  async validateKey(apiKey: string): Promise<ValidationResult> {
    try {
      await axios.get(`${this.baseUrl}/auth/key`, {
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

      const list = response.data?.data || [];
      return list.map((model: any) => {
        const id = model.id;
        const name = model.name || id;
        
        // OpenRouter models capability indicators
        const contextLength = model.context_length || 0;
        const isVision = id.includes('vision') || id.includes('vl') || id.includes('pixtral') || id.includes('gpt-4o');
        
        return {
          id,
          displayName: name,
          capabilities: {
            text: true,
            vision: isVision,
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
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://github.com/antigravity/ai-provider-registry',
            'X-Title': 'AI Provider Registry',
          },
          timeout: 12000,
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
        return { status: 'Unauthorized', errorMessage: 'Invalid OpenRouter API Key.' };
      }
      if (status === 403) {
        return { status: 'Unauthorized', errorMessage: 'OpenRouter authorization failure.' };
      }
      if (status === 429) {
        if (message.includes('credit') || message.includes('balance') || message.includes('quota')) {
          return { status: 'Quota Exceeded', errorMessage: 'OpenRouter credit limits reached.' };
        }
        return { status: 'Rate Limited', errorMessage: 'OpenRouter rate limit exceeded.' };
      }
      return { status: 'Invalid', errorMessage: message || `HTTP Error ${status}` };
    }
    return { status: 'Error', errorMessage: error.message || 'Network connectivity issue.' };
  }
}
