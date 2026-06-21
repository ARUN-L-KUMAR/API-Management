import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { DatabaseService } from '../database/database.service';
import { EncryptionService } from '../common/encryption.service';
import { ProviderAdapterFactory } from '../providers/provider-adapter.factory';
import { apiKeys, models, keyModels, monitorLogs } from '../database/schema';
import { eq, and } from 'drizzle-orm';

@Processor('verification-queue')
export class VerificationProcessor extends WorkerHost {
  constructor(
    private dbService: DatabaseService,
    private encryptionService: EncryptionService
  ) {
    super();
  }

  async process(job: Job<{ apiKeyId: string; modelId: string }>): Promise<any> {
    const { apiKeyId, modelId } = job.data;
    const startTime = Date.now();

    const [keyRecord] = await this.dbService.db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.id, apiKeyId))
      .limit(1);

    const [modelRecord] = await this.dbService.db
      .select()
      .from(models)
      .where(eq(models.id, modelId))
      .limit(1);

    if (!keyRecord || !modelRecord) {
      throw new Error(`Key ${apiKeyId} or Model ${modelId} not found`);
    }

    try {
      const plainKey = this.encryptionService.decrypt(keyRecord.encryptedApiKey);
      const adapter = ProviderAdapterFactory.getAdapter(keyRecord.providerCode);

      const testPrompt = 'Reply only with OK';
      const result = await adapter.testModel(plainKey, modelRecord.modelName, testPrompt);

      await this.dbService.db
        .update(keyModels)
        .set({
          verificationStatus: result.status,
          latencyMs: result.latencyMs,
          errorMessage: result.errorMessage || null,
          lastVerifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(eq(keyModels.apiKeyId, apiKeyId), eq(keyModels.modelId, modelId)));

      await this.dbService.db.insert(monitorLogs).values({
        apiKeyId,
        eventType: 'Verification',
        status: result.status === 'Working' ? 'Success' : 'Failed',
        message: `Model ${modelRecord.modelName} verification: ${result.status}`,
        errorDetails: result.errorMessage ? { error: result.errorMessage } : null,
        durationMs: Date.now() - startTime,
      });

      return result;
    } catch (error: any) {
      await this.dbService.db
        .update(keyModels)
        .set({
          verificationStatus: 'Failed',
          errorMessage: error.message,
          lastVerifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(eq(keyModels.apiKeyId, apiKeyId), eq(keyModels.modelId, modelId)));

      await this.dbService.db.insert(monitorLogs).values({
        apiKeyId,
        eventType: 'Verification',
        status: 'Failed',
        message: `Model ${modelRecord.modelName} test runner crashed: ${error.message}`,
        errorDetails: { trace: error.stack },
        durationMs: Date.now() - startTime,
      });

      throw error;
    }
  }
}
