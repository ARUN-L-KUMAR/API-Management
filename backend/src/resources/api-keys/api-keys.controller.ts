import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';
import { OrgId } from '../../common/org-id.decorator';

@Controller('api/v1/api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  create(@Body() dto: CreateApiKeyDto, @OrgId() orgId: string) {
    return this.apiKeysService.create(dto, orgId);
  }

  @Get()
  findAll(
    @OrgId() orgId: string,
    @Query('folderId') folderId?: string,
    @Query('provider') provider?: string,
    @Query('status') status?: string
  ) {
    return this.apiKeysService.findAll(orgId, folderId, provider, status);
  }

  @Post('bulk-delete')
  @HttpCode(HttpStatus.OK)
  bulkDelete(@Body('ids') ids: string[], @OrgId() orgId: string) {
    return this.apiKeysService.bulkDelete(ids, orgId);
  }

  @Post('bulk-validate')
  @HttpCode(HttpStatus.OK)
  bulkValidate(@Body('ids') ids: string[], @OrgId() orgId: string) {
    return this.apiKeysService.bulkValidate(ids, orgId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @OrgId() orgId: string) {
    return this.apiKeysService.findOne(id, orgId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateApiKeyDto, @OrgId() orgId: string) {
    return this.apiKeysService.update(id, dto, orgId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @OrgId() orgId: string) {
    return this.apiKeysService.remove(id, orgId);
  }

  @Post(':id/validate')
  @HttpCode(HttpStatus.OK)
  validateKey(@Param('id') id: string, @OrgId() orgId: string) {
    return this.apiKeysService.validateKey(id, orgId);
  }

  @Get(':id/models')
  findModels(
    @Param('id') id: string,
    @OrgId() orgId: string,
    @Query('showFailed') showFailed?: string,
    @Query('showAll') showAll?: string
  ) {
    const isShowFailed = showFailed === 'true';
    const isShowAll = showAll === 'true';
    return this.apiKeysService.findModels(id, orgId, isShowFailed, isShowAll);
  }
}
