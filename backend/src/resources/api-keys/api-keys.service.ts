import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { EncryptionService } from '../../common/encryption.service';
import { apiKeys, apiKeyTags, tags, keyModels, models, monitorLogs } from '../../database/schema';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';
import { eq, and, inArray } from 'drizzle-orm';
import { JobsService } from '../../jobs/jobs.service';

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
      result = result.filter((k) => k.status.toLowerCase() === status.toLowerCase());
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

    await this.dbService.db
      .update(apiKeys)
      .set({
        keyName: dto.keyName ?? existing.keyName,
        description: dto.description ?? existing.description,
        folderId: dto.folderId !== undefined ? dto.folderId : existing.folderId,
        isMonitoringEnabled: dto.isMonitoringEnabled ?? existing.isMonitoringEnabled,
        monitoringFrequency: dto.monitoringFrequency ?? existing.monitoringFrequency,
        updatedAt: new Date(),
      })
      .where(eq(apiKeys.id, id));

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
      return rows.filter((r) => r.verificationStatus !== 'Discovered');
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
}
