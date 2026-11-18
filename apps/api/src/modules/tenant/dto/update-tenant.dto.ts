import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

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
}

export class UpdateThemeDto {
  @ApiPropertyOptional({
    example: { accentColor: '#3B82F6', layout: 'grid', borderRadius: 10 },
  })
  @IsObject()
  themeConfig: Record<string, any>;
}
