import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DatabaseService } from '../database/database.service';
import { apiKeys } from '../database/schema';
import { eq } from 'drizzle-orm';
import { JobsService } from './jobs.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private dbService: DatabaseService,
    private jobsService: JobsService
  ) {}

  // Scan every 5 minutes
  @Cron('*/5 * * * *')
  async handleCron() {
    this.logger.log('Scanning keys for scheduled monitoring health checks...');
    try {
      const now = new Date();
      
      const allKeys = await this.dbService.db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.isMonitoringEnabled, true));

      const keysToCheck = allKeys.filter((k) => k.providerCode.toLowerCase() !== 'other');

      for (const key of keysToCheck) {
        const lastCheck = key.lastValidatedAt || key.createdAt;
        const frequencyMs = key.monitoringFrequency * 60 * 1000;
        const nextCheckDue = new Date(lastCheck.getTime() + frequencyMs);

        if (now >= nextCheckDue) {
          this.logger.log(`Queueing validation check for key: ${key.keyName} (${key.id})`);
          await this.jobsService.queueKeyValidation(key.id);
        }
      }
    } catch (error: any) {
      this.logger.error(`Error in scheduled monitoring scan: ${error.message}`, error.stack);
    }
  }
}
