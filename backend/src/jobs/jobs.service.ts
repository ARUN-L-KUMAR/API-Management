import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class JobsService {
  constructor(
    @InjectQueue('validation-queue') private validationQueue: Queue,
    @InjectQueue('discovery-queue') private discoveryQueue: Queue,
    @InjectQueue('verification-queue') private verificationQueue: Queue
  ) {}

  async queueKeyValidation(apiKeyId: string) {
    await this.validationQueue.add('validate', { apiKeyId }, { removeOnComplete: true });
  }

  async queueModelDiscovery(apiKeyId: string) {
    await this.discoveryQueue.add('discover', { apiKeyId }, { removeOnComplete: true });
  }

  async queueModelVerification(apiKeyId: string, modelId: string) {
    await this.verificationQueue.add('verify', { apiKeyId, modelId }, { removeOnComplete: true });
  }
}
