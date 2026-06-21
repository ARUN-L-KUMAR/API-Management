import { Controller, Get, Post, Body, Param, Delete, Patch } from '@nestjs/common';
import { FoldersService } from './folders.service';
import { OrgId } from '../../common/org-id.decorator';

@Controller('api/v1/folders')
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Post()
  create(@Body('name') name: string, @OrgId() orgId: string) {
    return this.foldersService.create(name, orgId);
  }

  @Get()
  findAll(@OrgId() orgId: string) {
    return this.foldersService.findAll(orgId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body('name') name: string, @OrgId() orgId: string) {
    return this.foldersService.update(id, name, orgId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @OrgId() orgId: string) {
    return this.foldersService.remove(id, orgId);
  }
}
