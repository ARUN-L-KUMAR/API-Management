import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { EncryptionService } from '../../common/encryption.service';
import { apiKeys, models, playgroundSessions } from '../../database/schema';
import { eq, and, desc } from 'drizzle-orm';
import { ProviderAdapterFactory } from '../../providers/provider-adapter.factory';

@Injectable()
export class PlaygroundService {
  constructor(
    private dbService: DatabaseService,
    private encryptionService: EncryptionService
  ) {}

  async runPrompt(apiKeyId: string, modelId: string, prompt: string, userId: string, orgId: string) {
    const startTime = Date.now();

    const [keyRecord] = await this.dbService.db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.id, apiKeyId), eq(apiKeys.organizationId, orgId)))
      .limit(1);

    if (!keyRecord) {
      throw new NotFoundException(`API Key not found`);
    }

    if (keyRecord.status !== 'Working') {
      throw new BadRequestException(`Cannot test on a key with status: ${keyRecord.status}`);
    }

    const [modelRecord] = await this.dbService.db
      .select()
      .from(models)
      .where(eq(models.id, modelId))
      .limit(1);

    if (!modelRecord) {
      throw new NotFoundException(`Model not found`);
    }

    try {
      const plainKey = this.encryptionService.decrypt(keyRecord.encryptedApiKey);
      const adapter = ProviderAdapterFactory.getAdapter(keyRecord.providerCode);

      const result = await adapter.testModel(plainKey, modelRecord.modelName, prompt);
      const durationMs = Date.now() - startTime;

      await this.dbService.db.insert(playgroundSessions).values({
        organizationId: orgId,
        userId,
        apiKeyId,
        modelId,
        prompt,
        response: result.response || null,
        latencyMs: result.latencyMs || durationMs,
        tokensUsed: 0,
      });

      return {
        status: result.status,
        response: result.response,
        latencyMs: result.latencyMs,
        errorMessage: result.errorMessage,
      };
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      
      await this.dbService.db.insert(playgroundSessions).values({
        organizationId: orgId,
        userId,
        apiKeyId,
        modelId,
        prompt,
        response: null,
        latencyMs: durationMs,
        tokensUsed: 0,
      });

      return {
        status: 'Failed',
        errorMessage: error.message,
        latencyMs: durationMs,
      };
    }
  }

  async findSessions(orgId: string) {
    return this.dbService.db
      .select({
        id: playgroundSessions.id,
        prompt: playgroundSessions.prompt,
        response: playgroundSessions.response,
        latencyMs: playgroundSessions.latencyMs,
        createdAt: playgroundSessions.createdAt,
        keyName: apiKeys.keyName,
        modelName: models.modelName,
      })
      .from(playgroundSessions)
      .innerJoin(apiKeys, eq(apiKeys.id, playgroundSessions.apiKeyId))
      .innerJoin(models, eq(models.id, playgroundSessions.modelId))
      .where(eq(playgroundSessions.organizationId, orgId))
      .orderBy(desc(playgroundSessions.createdAt));
  }
}
