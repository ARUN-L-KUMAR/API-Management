import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { monitorLogs, apiKeys } from '../../database/schema';
import { eq, desc, and } from 'drizzle-orm';

@Injectable()
export class LogsService {
  constructor(private dbService: DatabaseService) {}

  async findAll(orgId: string, apiKeyId?: string) {
    if (apiKeyId) {
      return this.dbService.db
        .select({
          id: monitorLogs.id,
          apiKeyId: monitorLogs.apiKeyId,
          eventType: monitorLogs.eventType,
          status: monitorLogs.status,
          message: monitorLogs.message,
          errorDetails: monitorLogs.errorDetails,
          durationMs: monitorLogs.durationMs,
          createdAt: monitorLogs.createdAt,
        })
        .from(monitorLogs)
        .innerJoin(apiKeys, eq(apiKeys.id, monitorLogs.apiKeyId))
        .where(and(eq(monitorLogs.apiKeyId, apiKeyId), eq(apiKeys.organizationId, orgId)))
        .orderBy(desc(monitorLogs.createdAt));
    }

    return this.dbService.db
      .select({
        id: monitorLogs.id,
        apiKeyId: monitorLogs.apiKeyId,
        eventType: monitorLogs.eventType,
        status: monitorLogs.status,
        message: monitorLogs.message,
        errorDetails: monitorLogs.errorDetails,
        durationMs: monitorLogs.durationMs,
        createdAt: monitorLogs.createdAt,
        keyName: apiKeys.keyName,
        providerCode: apiKeys.providerCode,
      })
      .from(monitorLogs)
      .innerJoin(apiKeys, eq(apiKeys.id, monitorLogs.apiKeyId))
      .where(eq(apiKeys.organizationId, orgId))
      .orderBy(desc(monitorLogs.createdAt));
  }
}
