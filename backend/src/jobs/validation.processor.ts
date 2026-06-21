import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { DatabaseService } from '../database/database.service';
import { EncryptionService } from '../common/encryption.service';
import { ProviderAdapterFactory } from '../providers/provider-adapter.factory';
import { apiKeys, monitorLogs } from '../database/schema';
import { eq } from 'drizzle-orm';
import { JobsService } from './jobs.service';

@Processor('validation-queue')
export class ValidationProcessor extends WorkerHost {
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

    if (!keyRecord) {
      throw new Error(`Key record ${apiKeyId} not found`);
    }

    if (keyRecord.providerCode.toLowerCase() === 'other') {
      return { status: 'Skipped', message: 'Generic API key - validation not applicable.' };
    }

    try {
      const plainKey = this.encryptionService.decrypt(keyRecord.encryptedApiKey);
      const adapter = ProviderAdapterFactory.getAdapter(keyRecord.providerCode);
      const validationResult = await adapter.validateKey(plainKey);

      await this.dbService.db
        .update(apiKeys)
        .set({
          status: validationResult.status,
          lastValidatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(apiKeys.id, apiKeyId));

      await this.dbService.db.insert(monitorLogs).values({
        apiKeyId,
        eventType: 'Validation',
        status: validationResult.status === 'Working' ? 'Success' : 'Failed',
        message: validationResult.status === 'Working' 
          ? 'Key validated successfully' 
          : `Validation failed: ${validationResult.errorMessage || 'Unknown error'}`,
        errorDetails: validationResult.errorMessage ? { error: validationResult.errorMessage } : null,
        durationMs: Date.now() - startTime,
      });

      if (validationResult.status === 'Working') {
        await this.jobsService.queueModelDiscovery(apiKeyId);
      }

      return validationResult;
    } catch (error: any) {
      await this.dbService.db
        .update(apiKeys)
        .set({
          status: 'Error',
          lastValidatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(apiKeys.id, apiKeyId));

      await this.dbService.db.insert(monitorLogs).values({
        apiKeyId,
        eventType: 'Validation',
        status: 'Failed',
        message: `Validation job crashed: ${error.message}`,
        errorDetails: { trace: error.stack },
        durationMs: Date.now() - startTime,
      });

      throw error;
    }
  }
}
