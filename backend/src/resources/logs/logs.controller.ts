import { Controller, Get, Query } from '@nestjs/common';
import { LogsService } from './logs.service';
import { OrgId } from '../../common/org-id.decorator';

@Controller('api/v1/activity-logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  findAll(@OrgId() orgId: string, @Query('apiKeyId') apiKeyId?: string) {
    return this.logsService.findAll(orgId, apiKeyId);
  }
}
