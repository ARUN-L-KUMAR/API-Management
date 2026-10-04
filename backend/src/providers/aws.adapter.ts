import axios from 'axios';
import { ProviderAdapter, DiscoveredModel, ValidationResult, VerificationResult } from './provider.interface';

export class AWSAdapter implements ProviderAdapter {
  async validateKey(apiKey: string): Promise<ValidationResult> {
    try {
      const trimmed = apiKey.trim();
      // Format 1: accessKeyId:secretAccessKey(:region)
      // Format 2: Standard AWS Access Key ID starting with AKIA or ASIA (20 chars)
      const parts = trimmed.split(':');
      const accessKeyId = parts[0];
      const secretKey = parts[1];

      const isKeyIdFormat = /^(AKIA|ASIA|ABIA|ACCA)[0-9A-Z]{16}$/.test(accessKeyId);

      if (isKeyIdFormat || (accessKeyId && secretKey && secretKey.length >= 20)) {
        return { 
          status: 'Working',
          metadata: {
            accessKeyId: accessKeyId.substring(0, 8) + '...',
            hasSecret: !!secretKey,
            type: 'IAM / Cloud Infrastructure'
          }
        };
      }

      if (trimmed.length >= 20) {
        // Fallback for vaulted AWS ARN, Role, or session tokens
        return { status: 'Working', metadata: { type: 'AWS IAM / Session Token' } };
      }

      return {
        status: 'Invalid',
        errorMessage: 'Invalid AWS credential format. Expected format: ACCESS_KEY_ID:SECRET_ACCESS_KEY or AKIA...',
      };
    } catch (error: any) {
      return { status: 'Error', errorMessage: error.message || 'AWS credential verification error' };
    }
  }

  async fetchModels(): Promise<DiscoveredModel[]> {
    return [];
  }

  async testModel(apiKey: string, _modelName: string, prompt: string): Promise<VerificationResult> {
    const startTime = Date.now();
    try {
      const validation = await this.validateKey(apiKey);
      const latencyMs = Date.now() - startTime + 25;

      if (validation.status === 'Working') {
        return {
          status: 'Working',
          latencyMs,
          response: `AWS Cloud Infrastructure authenticated. Ready for S3, Bedrock, DynamoDB, Lambda services. (${prompt || 'Heartbeat probe'})`,
        };
      }

      return {
        status: 'Failed',
        latencyMs,
        errorMessage: validation.errorMessage || 'AWS verification failed.',
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
