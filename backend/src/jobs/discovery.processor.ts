import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { DatabaseService } from '../database/database.service';
import { EncryptionService } from '../common/encryption.service';
import { ProviderAdapterFactory } from '../providers/provider-adapter.factory';
import { apiKeys, models, keyModels, monitorLogs } from '../database/schema';
import { eq, and } from 'drizzle-orm';
import { JobsService } from './jobs.service';

@Processor('discovery-queue')
export class DiscoveryProcessor extends WorkerHost {
  constructor(
    private dbService: DatabaseService,
    private encryptionService: EncryptionService,
    private jobsService: JobsService
  ) {
    super();
  }

  async process(job: Job<{ apiKeyId: string }>): Promise<any> {
    const { apiKeyId } = job.data;
    const startTime = Date.now();

    const [keyRecord] = await this.dbService.db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.id, apiKeyId))
      .limit(1);

    if (!keyRecord || keyRecord.status !== 'Working') {
      return { message: 'Key is not in active Working state, skipping discovery.' };
    }

    try {
      const plainKey = this.encryptionService.decrypt(keyRecord.encryptedApiKey);
      const adapter = ProviderAdapterFactory.getAdapter(keyRecord.providerCode);
      const discovered = await adapter.fetchModels(plainKey);

      if (discovered.length === 0) {
        await this.dbService.db.insert(monitorLogs).values({
          apiKeyId,
          eventType: 'Verification',
          status: 'Failed',
          message: 'No models discovered for this key.',
          durationMs: Date.now() - startTime,
        });
        return { discoveredCount: 0 };
      }

      for (const rawModel of discovered) {
        let [globalModel] = await this.dbService.db
          .select()
          .from(models)
          .where(and(eq(models.providerCode, keyRecord.providerCode), eq(models.modelName, rawModel.id)))
          .limit(1);

        if (!globalModel) {
          [globalModel] = await this.dbService.db
            .insert(models)
            .values({
              providerCode: keyRecord.providerCode,
              modelName: rawModel.id,
              displayName: rawModel.displayName,
              capabilities: rawModel.capabilities,
              status: 'Active',
            })
            .returning();
        }

        let [keyModelLink] = await this.dbService.db
          .select()
          .from(keyModels)
          .where(and(eq(keyModels.apiKeyId, apiKeyId), eq(keyModels.modelId, globalModel.id)))
          .limit(1);

        if (!keyModelLink) {
          [keyModelLink] = await this.dbService.db
            .insert(keyModels)
            .values({
              apiKeyId,
              modelId: globalModel.id,
              verificationStatus: 'Discovered',
            })
            .returning();
        }

        await this.jobsService.queueModelVerification(apiKeyId, globalModel.id);
      }

      await this.dbService.db.insert(monitorLogs).values({
        apiKeyId,
        eventType: 'Verification',
        status: 'Success',
        message: `Discovered and queued verification for ${discovered.length} models.`,
        durationMs: Date.now() - startTime,
      });

      return { discoveredCount: discovered.length };
    } catch (error: any) {
      await this.dbService.db.insert(monitorLogs).values({
        apiKeyId,
        eventType: 'Verification',
        status: 'Failed',
        message: `Model discovery failed: ${error.message}`,
        errorDetails: { trace: error.stack },
        durationMs: Date.now() - startTime,
      });
      throw error;
    }
  }
}
