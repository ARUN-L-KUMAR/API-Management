import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { EncryptionService } from '../../common/encryption.service';
import { apiKeys, apiKeyTags, tags, keyModels, models, monitorLogs } from '../../database/schema';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';
import { eq, and, inArray } from 'drizzle-orm';
import { JobsService } from '../../jobs/jobs.service';
import { ProviderAdapterFactory } from '../../providers/provider-adapter.factory';

@Injectable()
export class ApiKeysService {
  constructor(
    private dbService: DatabaseService,
    private encryptionService: EncryptionService,
    private jobsService: JobsService
  ) {}

  async create(dto: CreateApiKeyDto, orgId: string) {
    const encrypted = this.encryptionService.encrypt(dto.apiKey);
    const isOtherProvider = dto.providerCode.toLowerCase() === 'other';
    
    // Insert API Key
    const [newKey] = await this.dbService.db
      .insert(apiKeys)
      .values({
        organizationId: orgId,
        providerCode: dto.providerCode,
        keyName: dto.keyName,
        encryptedApiKey: encrypted,
        description: dto.description || null,
        accountEmail: dto.accountEmail || null,
        accountPhone: dto.accountPhone || null,
        folderId: dto.folderId || null,
        isMonitoringEnabled: false,
        monitoringFrequency: dto.monitoringFrequency || 60,
        status: isOtherProvider ? 'Stored' : 'Unknown',
      })
      .returning();

    // Map tags if provided
    if (dto.tagIds && dto.tagIds.length > 0) {
      const tagRecords = dto.tagIds.map((tagId) => ({
        apiKeyId: newKey.id,
        tagId,
      }));
      await this.dbService.db.insert(apiKeyTags).values(tagRecords);
    }

    // Queue background validation job (skip for generic "other" keys)
    if (!isOtherProvider) {
      await this.jobsService.queueKeyValidation(newKey.id);
    }

    return newKey;
  }

  async findAll(orgId: string, folderId?: string, provider?: string, status?: string) {
    let query = this.dbService.db
      .select({
        apiKey: apiKeys,
        tag: tags,
      })
      .from(apiKeys)
      .leftJoin(apiKeyTags, eq(apiKeyTags.apiKeyId, apiKeys.id))
      .leftJoin(tags, eq(tags.id, apiKeyTags.tagId))
      .where(eq(apiKeys.organizationId, orgId));

    const rows = await query;

    // Map-reduce results to combine tags
    const keysMap = new Map<string, any>();
    for (const row of rows) {
      const keyId = row.apiKey.id;
      if (!keysMap.has(keyId)) {
        keysMap.set(keyId, {
          ...row.apiKey,
          tags: [],
        });
      }
      if (row.tag) {
        keysMap.get(keyId).tags.push(row.tag);
      }
    }

    let result = Array.from(keysMap.values());

    // Apply secondary filtering in-memory for joined fields
    if (folderId) {
      result = result.filter((k) => k.folderId === folderId);
    }
    if (provider) {
      result = result.filter((k) => k.providerCode.toLowerCase() === provider.toLowerCase());
    }
    if (status) {
      if (status.toLowerCase() === 'invalid') {
        result = result.filter((k) => k.status.toLowerCase() !== 'working');
      } else {
        result = result.filter((k) => k.status.toLowerCase() === status.toLowerCase());
      }
    }

    return result;
  }

  async findOne(id: string, orgId: string) {
    const rows = await this.dbService.db
      .select({
        apiKey: apiKeys,
        tag: tags,
      })
      .from(apiKeys)
      .leftJoin(apiKeyTags, eq(apiKeyTags.apiKeyId, apiKeys.id))
      .leftJoin(tags, eq(tags.id, apiKeyTags.tagId))
      .where(and(eq(apiKeys.id, id), eq(apiKeys.organizationId, orgId)));

    if (rows.length === 0) {
      throw new NotFoundException(`API Key ${id} not found`);
    }

    const first = rows[0].apiKey;
    const decrypted = this.encryptionService.decrypt(first.encryptedApiKey);
    const keyTags = rows.map((r) => r.tag).filter(Boolean);

    return {
      ...first,
      plainApiKey: decrypted,
      tags: keyTags,
    };
  }

  async update(id: string, dto: UpdateApiKeyDto, orgId: string) {
    const [existing] = await this.dbService.db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.organizationId, orgId)))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`API Key ${id} not found`);
    }

    const updatePayload: any = {
      keyName: dto.keyName ?? existing.keyName,
      description: dto.description ?? existing.description,
      accountEmail: dto.accountEmail !== undefined ? dto.accountEmail : existing.accountEmail,
      accountPhone: dto.accountPhone !== undefined ? dto.accountPhone : existing.accountPhone,
      folderId: dto.folderId !== undefined ? dto.folderId : existing.folderId,
      isMonitoringEnabled: dto.isMonitoringEnabled ?? existing.isMonitoringEnabled,
      monitoringFrequency: dto.monitoringFrequency ?? existing.monitoringFrequency,
      updatedAt: new Date(),
    };

    let secretRotated = false;
    if (dto.apiKey && dto.apiKey.trim().length > 0) {
      updatePayload.encryptedApiKey = this.encryptionService.encrypt(dto.apiKey.trim());
      const isOtherProvider = existing.providerCode.toLowerCase() === 'other';
      updatePayload.status = isOtherProvider ? 'Stored' : 'Unknown';
      secretRotated = true;
    }

    await this.dbService.db
      .update(apiKeys)
      .set(updatePayload)
      .where(eq(apiKeys.id, id));

    if (secretRotated && existing.providerCode.toLowerCase() !== 'other') {
      await this.jobsService.queueKeyValidation(id);
    }

    if (dto.tagIds !== undefined) {
      // Re-map tags (delete old mappings and insert new ones)
      await this.dbService.db.delete(apiKeyTags).where(eq(apiKeyTags.apiKeyId, id));
      if (dto.tagIds.length > 0) {
        const tagRecords = dto.tagIds.map((tagId) => ({
          apiKeyId: id,
          tagId,
        }));
        await this.dbService.db.insert(apiKeyTags).values(tagRecords);
      }
    }

    return this.findOne(id, orgId);
  }

  async remove(id: string, orgId: string) {
    const [deleted] = await this.dbService.db
      .delete(apiKeys)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.organizationId, orgId)))
      .returning();

    if (!deleted) {
      throw new NotFoundException(`API Key ${id} not found`);
    }
    return deleted;
  }

  async validateKey(id: string, orgId: string) {
    const [keyRecord] = await this.dbService.db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.organizationId, orgId)))
      .limit(1);

    if (!keyRecord) {
      throw new NotFoundException(`API Key ${id} not found`);
    }

    if (keyRecord.providerCode.toLowerCase() === 'other') {
      return { message: 'Validation is not available for generic API keys.' };
    }

    await this.jobsService.queueKeyValidation(id);
    return { message: 'Validation job triggered.' };
  }

  async findModels(id: string, orgId: string, showFailed?: boolean, showAll?: boolean) {
    const [keyRecord] = await this.dbService.db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.organizationId, orgId)))
      .limit(1);

    if (!keyRecord) {
      throw new NotFoundException(`API Key ${id} not found`);
    }

    const rows = await this.dbService.db
      .select({
        id: models.id,
        modelName: models.modelName,
        displayName: models.displayName,
        description: models.description,
        capabilities: models.capabilities,
        globalStatus: models.status,
        verificationStatus: keyModels.verificationStatus,
        lastVerifiedAt: keyModels.lastVerifiedAt,
        errorMessage: keyModels.errorMessage,
        latencyMs: keyModels.latencyMs,
      })
      .from(keyModels)
      .innerJoin(models, eq(models.id, keyModels.modelId))
      .where(eq(keyModels.apiKeyId, id));

    if (showAll) {
      return rows;
    }
    if (showFailed) {
      return rows.filter((r) => r.verificationStatus === 'Failed' || r.verificationStatus === 'Error');
    }
    // Default: Working only
    return rows.filter((r) => r.verificationStatus === 'Working');
  }

  // Bulk Operations
  async bulkDelete(ids: string[], orgId: string) {
    if (!ids || ids.length === 0) throw new BadRequestException('No IDs provided');
    const result = await this.dbService.db
      .delete(apiKeys)
      .where(and(inArray(apiKeys.id, ids), eq(apiKeys.organizationId, orgId)))
      .returning();
    return { count: result.length };
  }

  async bulkValidate(ids: string[], orgId: string) {
    if (!ids || ids.length === 0) throw new BadRequestException('No IDs provided');
    const records = await this.dbService.db
      .select()
      .from(apiKeys)
      .where(and(inArray(apiKeys.id, ids), eq(apiKeys.organizationId, orgId)));

    const validatable = records.filter((r) => r.providerCode.toLowerCase() !== 'other');
    for (const record of validatable) {
      await this.jobsService.queueKeyValidation(record.id);
    }
    const skipped = records.length - validatable.length;
    return { count: validatable.length, message: skipped > 0 ? `Bulk validation queued for ${validatable.length} key(s). ${skipped} generic key(s) skipped.` : 'Bulk validation queued.' };
  }

  async syncAllModels(orgId: string) {
    const keys = await this.dbService.db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.organizationId, orgId));

    const validatableKeys = keys.filter(
      (k) => k.providerCode.toLowerCase() !== 'other' && k.status === 'Working'
    );

    let totalDiscovered = 0;
    let totalWorking = 0;
    let totalFailed = 0;
    const details: any[] = [];

    // Process keys concurrently
    await Promise.allSettled(
      validatableKeys.map(async (keyRecord) => {
        try {
          const plainKey = this.encryptionService.decrypt(keyRecord.encryptedApiKey);
          const adapter = ProviderAdapterFactory.getAdapter(keyRecord.providerCode);

          // 1. Fetch live models from provider
          const discovered = await adapter.fetchModels(plainKey);
          totalDiscovered += discovered.length;
          const activeModelNames = new Set(discovered.map((d) => d.id));

          // 2. Bulk fetch existing global models for this provider
          const existingDbModels = await this.dbService.db
            .select()
            .from(models)
            .where(eq(models.providerCode, keyRecord.providerCode));

          const modelMap = new Map(existingDbModels.map((m) => [m.modelName, m]));

          // Find models not yet in the DB
          const newModelsToInsert = discovered
            .filter((raw) => !modelMap.has(raw.id))
            .map((raw) => ({
              providerCode: keyRecord.providerCode,
              modelName: raw.id,
              displayName: raw.displayName,
              capabilities: raw.capabilities,
              status: 'Active',
            }));

          if (newModelsToInsert.length > 0) {
            const inserted = await this.dbService.db
              .insert(models)
              .values(newModelsToInsert)
              .returning();
            for (const m of inserted) {
              modelMap.set(m.modelName, m);
            }
          }

          // 3. Bulk fetch existing key_models links for this key
          const existingLinks = await this.dbService.db
            .select({
              linkId: keyModels.id,
              modelName: models.modelName,
              modelId: models.id,
              status: keyModels.verificationStatus,
            })
            .from(keyModels)
            .innerJoin(models, eq(models.id, keyModels.modelId))
            .where(eq(keyModels.apiKeyId, keyRecord.id));

          const linkedModelIds = new Set(existingLinks.map((l) => l.modelId));

          // Find new links to insert
          const newLinksToInsert: (typeof keyModels.$inferInsert)[] = [];
          for (const raw of discovered) {
            const m = modelMap.get(raw.id);
            if (m && !linkedModelIds.has(m.id)) {
              newLinksToInsert.push({
                apiKeyId: keyRecord.id,
                modelId: m.id,
                verificationStatus: 'Discovered',
              });
            }
          }

          if (newLinksToInsert.length > 0) {
            await this.dbService.db.insert(keyModels).values(newLinksToInsert);
          }

          // 4. Mark models no longer returned in provider catalog as Failed
          const deprecatedLinkIds = existingLinks
            .filter((l) => !activeModelNames.has(l.modelName))
            .map((l) => l.linkId);

          if (deprecatedLinkIds.length > 0) {
            await this.dbService.db
              .update(keyModels)
              .set({
                verificationStatus: 'Failed',
                errorMessage: 'The model does not exist or was deprecated by provider',
                updatedAt: new Date(),
              })
              .where(inArray(keyModels.id, deprecatedLinkIds));
            totalFailed += deprecatedLinkIds.length;
          }

          // 5. Pick top 1 active model to test live with a 4s timeout for instant validation feedback
          const activeLinks = existingLinks.filter((l) => activeModelNames.has(l.modelName));
          const primaryModel = activeLinks[0];
          const remainingModels = activeLinks.slice(1);

          if (primaryModel) {
            try {
              const probePromise = adapter.testModel(plainKey, primaryModel.modelName, 'Reply only with OK');
              const timeoutPromise = new Promise<{ status: 'Failed'; latencyMs: number; errorMessage: string }>((resolve) =>
                setTimeout(() => resolve({ status: 'Failed', latencyMs: 4000, errorMessage: 'Probe timed out after 4000ms' }), 4000)
              );
              const probeResult = await Promise.race([probePromise, timeoutPromise]);

              await this.dbService.db
                .update(keyModels)
                .set({
                  verificationStatus: probeResult.status,
                  latencyMs: probeResult.latencyMs,
                  errorMessage: probeResult.errorMessage || null,
                  lastVerifiedAt: new Date(),
                  updatedAt: new Date(),
                })
                .where(eq(keyModels.id, primaryModel.linkId));

              if (probeResult.status === 'Working') {
                totalWorking++;
              } else {
                totalFailed++;
              }
            } catch (err: any) {
              await this.dbService.db
                .update(keyModels)
                .set({
                  verificationStatus: 'Failed',
                  errorMessage: err.message || 'Probe execution failed',
                  lastVerifiedAt: new Date(),
                  updatedAt: new Date(),
                })
                .where(eq(keyModels.id, primaryModel.linkId));
              totalFailed++;
            }
          }

          // 6. Queue remaining active models in background workers (BullMQ) in bulk
          if (remainingModels.length > 0) {
            await this.jobsService.queueModelVerificationBulk(
              remainingModels.map((item) => ({ apiKeyId: keyRecord.id, modelId: item.modelId }))
            );
          }

          details.push({
            keyId: keyRecord.id,
            keyName: keyRecord.keyName,
            provider: keyRecord.providerCode,
            testedImmediately: primaryModel ? 1 : 0,
            queuedForBackground: remainingModels.length,
          });
        } catch (err: any) {
          details.push({
            keyId: keyRecord.id,
            keyName: keyRecord.keyName,
            error: err.message,
          });
        }
      })
    );

    return {
      message: `Verified and synchronized models across ${validatableKeys.length} active key(s).`,
      keysCount: validatableKeys.length,
      totalDiscovered,
      workingModels: totalWorking,
      failedModels: totalFailed,
      details,
    };
  }
}
