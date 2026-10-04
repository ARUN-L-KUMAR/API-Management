import { IsString, IsOptional, IsUUID, IsBoolean, IsInt, Min, IsArray } from 'class-validator';

export class UpdateApiKeyDto {
  @IsOptional()
  @IsString()
  keyName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  accountEmail?: string;

  @IsOptional()
  @IsString()
  accountPhone?: string;

  @IsOptional()
  @IsUUID()
  folderId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  tagIds?: string[];

  @IsOptional()
  @IsBoolean()
  isMonitoringEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(15)
  monitoringFrequency?: number;

  @IsOptional()
  @IsString()
  apiKey?: string;
}
