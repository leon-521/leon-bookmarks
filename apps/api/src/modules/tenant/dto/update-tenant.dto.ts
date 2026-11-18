import { IsString, IsOptional, IsBoolean, IsInt, Min, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Plan } from '@prisma/client';

export class UpdateTenantDto {
  @ApiPropertyOptional({ example: 'Acme Corp' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiPropertyOptional({ example: 'https://example.com/favicon.ico' })
  @IsString()
  @IsOptional()
  favicon?: string;

  @ApiPropertyOptional({ example: 'acme.example.com' })
  @IsString()
  @IsOptional()
  customDomain?: string;

  @ApiPropertyOptional({ enum: Plan })
  @IsString()
  @IsOptional()
  plan?: Plan;

  @ApiPropertyOptional({ example: 1000 })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxBookmarks?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxMembers?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateThemeDto {
  @ApiPropertyOptional({
    example: { primaryColor: '#3B82F6', darkMode: false, layout: 'grid' },
  })
  @IsObject()
  themeConfig: Record<string, any>;
}
