import { IsString, IsOptional, IsUUID, IsBoolean, IsInt, Min, IsArray } from 'class-validator';

export class CreateApiKeyDto {
  @IsString()
  keyName: string;

  @IsString()
  providerCode: string;

  @IsString()
  apiKey: string;

  @IsOptional()
  @IsString()
  description?: string;

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
}
