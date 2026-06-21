import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JobsService } from './jobs.service';
import { ValidationProcessor } from './validation.processor';
import { DiscoveryProcessor } from './discovery.processor';
import { VerificationProcessor } from './verification.processor';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'validation-queue' },
      { name: 'discovery-queue' },
      { name: 'verification-queue' }
    ),
  ],
  providers: [
    JobsService,
    ValidationProcessor,
    DiscoveryProcessor,
    VerificationProcessor,
    SchedulerService,
  ],
  exports: [JobsService, BullModule],
})
export class JobsModule {}
