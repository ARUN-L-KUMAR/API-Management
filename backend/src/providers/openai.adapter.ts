import axios from 'axios';
import { ProviderAdapter, DiscoveredModel, ValidationResult, VerificationResult } from './provider.interface';

export class OpenAIAdapter implements ProviderAdapter {
  private baseUrl = 'https://api.openai.com/v1';

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

      const list = response.data?.data || [];
      const filtered: DiscoveredModel[] = list
        .filter((model: any) => {
          const id = model.id.toLowerCase();
          return (
            id.startsWith('gpt-') ||
            id.startsWith('o1') ||
            id.startsWith('text-davinci') ||
            id.startsWith('text-embedding')
          );
        })
        .map((model: any) => {
          const id = model.id;
          const isVision = id.includes('vision') || id.includes('gpt-4o') || id.includes('gpt-4-turbo');
          const isAudio = id.includes('audio') || id.includes('tts') || id.includes('whisper');
          return {
            id,
            displayName: this.formatDisplayName(id),
            capabilities: {
              text: !id.includes('whisper') && !id.includes('tts'),
              vision: isVision,
              audio: isAudio,
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
      const isEmbedding = modelName.includes('embedding');
      let responseText = '';
      
      if (isEmbedding) {
        const res = await axios.post(
          `${this.baseUrl}/embeddings`,
          { model: modelName, input: prompt },
          { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 10000 }
        );
        responseText = `Embedding generated. Vector size: ${res.data?.data?.[0]?.embedding?.length || 0}`;
      } else {
        const res = await axios.post(
          `${this.baseUrl}/chat/completions`,
          {
            model: modelName,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 10,
          },
          { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 10000 }
        );
        responseText = res.data?.choices?.[0]?.message?.content || '';
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
      else if (errorResult.status === 'Quota Exceeded') status = 'Failed'; // Map to Failed or customizable
      
      return {
        status,
        latencyMs,
        errorMessage: error.response?.data?.error?.message || error.message,
      };
    }
  }

  private formatDisplayName(id: string): string {
    return id
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private handleError(error: any): ValidationResult {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.error?.message || '';

      if (status === 401) {
        return { status: 'Unauthorized', errorMessage: 'Invalid API Key or unauthorized request.' };
      }
      if (status === 429) {
        if (message.includes('quota') || message.includes('billing')) {
          return { status: 'Quota Exceeded', errorMessage: 'Quota limits reached or billing deactivated.' };
        }
        return { status: 'Rate Limited', errorMessage: 'Rate limit exceeded.' };
      }
      return { status: 'Invalid', errorMessage: message || `HTTP Error ${status}` };
    }
    return { status: 'Error', errorMessage: error.message || 'Network connectivity issue.' };
  }
}
