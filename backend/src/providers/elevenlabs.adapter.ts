import axios from 'axios';
import { ProviderAdapter, DiscoveredModel, ValidationResult, VerificationResult } from './provider.interface';

export class ElevenLabsAdapter implements ProviderAdapter {
  private baseUrl = 'https://api.elevenlabs.io/v1';
  // A standard public voice ID for test streams (Rachel voice)
  private testVoiceId = '21m00Tcm4TlvDq8ikWAM';

  async validateKey(apiKey: string): Promise<ValidationResult> {
    try {
      await axios.get(`${this.baseUrl}/user`, {
        headers: { 'xi-api-key': apiKey },
      });
      return { status: 'Working' };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async fetchModels(apiKey: string): Promise<DiscoveredModel[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/models`, {
        headers: { 'xi-api-key': apiKey },
      });

      const list = response.data || [];
      return list.map((model: any) => {
        const id = model.model_id;
        return {
          id,
          displayName: model.name || id.replace(/_/g, ' ').toUpperCase(),
          capabilities: {
            text: false,
            vision: false,
            audio: true,
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
      // Test the model by running a mini TTS request (just "OK")
      const res = await axios.post(
        `${this.baseUrl}/text-to-speech/${this.testVoiceId}/stream`,
        {
          text: prompt.substring(0, 10), // Keep it extremely short
          model_id: modelName,
          output_format: 'mp3_22050_32',
        },
        {
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer', // Expect audio bytes back
          timeout: 10000,
        }
      );

      const latencyMs = Date.now() - startTime;
      const byteLength = res.data ? res.data.byteLength : 0;

      return {
        status: 'Working',
        latencyMs,
        response: `Audio stream generated successfully (${byteLength} bytes returned).`,
      };
    } catch (error: any) {
      const latencyMs = Date.now() - startTime;
      const errorResult = this.handleError(error);

      let status: VerificationResult['status'] = 'Failed';
      if (errorResult.status === 'Unauthorized') status = 'Unauthorized';
      else if (errorResult.status === 'Rate Limited') status = 'Rate Limited';

      let errMsg = error.message;
      if (error.response?.data instanceof ArrayBuffer) {
        try {
          const dec = new TextDecoder('utf-8');
          const errJson = JSON.parse(dec.decode(error.response.data));
          errMsg = errJson.detail?.message || errMsg;
        } catch (_) {}
      } else if (error.response?.data?.detail?.message) {
        errMsg = error.response.data.detail.message;
      }

      return {
        status,
        latencyMs,
        errorMessage: errMsg,
      };
    }
  }

  private handleError(error: any): ValidationResult {
    if (error.response) {
      const status = error.response.status;
      let message = error.response.data?.detail?.message || '';

      // De-serialize array buffer if error is returned as buffer
      if (error.response.data instanceof ArrayBuffer) {
        try {
          const dec = new TextDecoder('utf-8');
          const parsed = JSON.parse(dec.decode(error.response.data));
          message = parsed.detail?.message || message;
        } catch (_) {}
      }

      if (status === 401) {
        return { status: 'Unauthorized', errorMessage: 'Invalid ElevenLabs API Key.' };
      }
      if (status === 403) {
        return { status: 'Unauthorized', errorMessage: 'ElevenLabs subscription inactive or unauthorized.' };
      }
      if (status === 429) {
        return { status: 'Rate Limited', errorMessage: 'ElevenLabs rate limit reached.' };
      }
      return { status: 'Invalid', errorMessage: message || `HTTP Error ${status}` };
    }
    return { status: 'Error', errorMessage: error.message || 'Network connectivity issue.' };
  }
}
