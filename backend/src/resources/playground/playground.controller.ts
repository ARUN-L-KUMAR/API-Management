import { Controller, Post, Get, Body } from '@nestjs/common';
import { PlaygroundService } from './playground.service';
import { OrgId, UserId } from '../../common/org-id.decorator';

@Controller('api/v1/playground')
export class PlaygroundController {
  constructor(private readonly playgroundService: PlaygroundService) {}

  @Post('run')
  run(
    @Body('apiKeyId') apiKeyId: string,
    @Body('modelId') modelId: string,
    @Body('prompt') prompt: string,
    @UserId() userId: string,
    @OrgId() orgId: string
  ) {
    return this.playgroundService.runPrompt(apiKeyId, modelId, prompt, userId, orgId);
  }

  @Get('sessions')
  findSessions(@OrgId() orgId: string) {
    return this.playgroundService.findSessions(orgId);
  }
}
