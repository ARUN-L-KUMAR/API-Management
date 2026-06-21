import axios from 'axios';
import { ProviderAdapter, DiscoveredModel, ValidationResult, VerificationResult } from './provider.interface';

export class GeminiAdapter implements ProviderAdapter {
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  async validateKey(apiKey: string): Promise<ValidationResult> {
    try {
      await axios.get(`${this.baseUrl}/models?key=${apiKey}`);
      return { status: 'Working' };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async fetchModels(apiKey: string): Promise<DiscoveredModel[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/models?key=${apiKey}`);
      const list = response.data?.models || [];
      
      const filtered: DiscoveredModel[] = list
        .filter((model: any) => {
          const name = model.name.toLowerCase();
          return name.includes('gemini') || name.includes('embedding');
        })
        .map((model: any) => {
          const rawId = model.name; // e.g. "models/gemini-1.5-flash"
          const cleanId = rawId.replace('models/', '');
          const isVision = cleanId.includes('flash') || cleanId.includes('pro');
          return {
            id: cleanId,
            displayName: model.displayName || cleanId,
            capabilities: {
              text: cleanId.includes('gemini'),
              vision: isVision,
              audio: cleanId.includes('gemini-1.5') || cleanId.includes('gemini-2.0'),
            },
          };
        });

      return filtered;
    } catch (error) {
      return [];
    }
  }

  async testModel(apiKey: string, modelName: string, prompt: string): Promise<VerificationResult> {
    const startTime = Date.now();
    try {
      const formattedModel = modelName.startsWith('models/') ? modelName : `models/${modelName}`;
      const isEmbedding = formattedModel.includes('embedding');
      let responseText = '';

      if (isEmbedding) {
        const res = await axios.post(
          `${this.baseUrl}/${formattedModel}:embedContent?key=${apiKey}`,
          { content: { parts: [{ text: prompt }] } },
          { timeout: 10000 }
        );
        responseText = `Embedding generated.`;
      } else {
        const res = await axios.post(
          `${this.baseUrl}/${formattedModel}:generateContent?key=${apiKey}`,
          {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 5 },
          },
          { timeout: 10000 }
        );
        responseText = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      }

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

      if (status === 400 && message.toLowerCase().includes('api key')) {
        return { status: 'Invalid', errorMessage: 'Invalid API Key parameter.' };
      }
      if (status === 403) {
        return { status: 'Unauthorized', errorMessage: 'API key does not have permission.' };
      }
      if (status === 429) {
        if (message.includes('quota')) {
          return { status: 'Quota Exceeded', errorMessage: 'Gemini Quota limits reached.' };
        }
        return { status: 'Rate Limited', errorMessage: 'Rate limit exceeded.' };
      }
      return { status: 'Invalid', errorMessage: message || `HTTP Error ${status}` };
    }
    return { status: 'Error', errorMessage: error.message || 'Network connectivity issue.' };
  }
}
