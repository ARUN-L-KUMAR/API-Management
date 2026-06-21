import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { TagsService } from './tags.service';
import { OrgId } from '../../common/org-id.decorator';

@Controller('api/v1/tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  create(@Body('name') name: string, @Body('color') color: string, @OrgId() orgId: string) {
    return this.tagsService.create(name, color, orgId);
  }

  @Get()
  findAll(@OrgId() orgId: string) {
    return this.tagsService.findAll(orgId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @OrgId() orgId: string) {
    return this.tagsService.remove(id, orgId);
  }
}
