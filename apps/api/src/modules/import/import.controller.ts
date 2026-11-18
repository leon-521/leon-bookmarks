import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Role } from '@prisma/client';
import { ImportService } from './import.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

export class ImportHtmlDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsBoolean()
  @IsOptional()
  createCategories?: boolean;

  @IsString()
  @IsOptional()
  defaultCategoryId?: string;

  @IsBoolean()
  @IsOptional()
  skipDuplicates?: boolean;
}

export class ImportJsonDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}

@ApiTags('import')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('html')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Import bookmarks from Chrome/Firefox HTML export' })
  async importHtml(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: ImportHtmlDto,
  ) {
    return this.importService.importFromHtml(tenantId, userId, dto.content, {
      createCategories: dto.createCategories ?? true,
      defaultCategoryId: dto.defaultCategoryId,
      skipDuplicates: dto.skipDuplicates ?? true,
    });
  }

  @Post('json')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Import bookmarks from JSON format' })
  async importJson(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: ImportJsonDto,
  ) {
    return this.importService.importFromJson(tenantId, userId, dto.content);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export bookmarks in HTML, JSON, or CSV format' })
  async exportBookmarks(
    @CurrentUser('tenantId') tenantId: string,
    @Query('format') format?: 'html' | 'json' | 'csv',
  ) {
    const validFormat = format && ['html', 'json', 'csv'].includes(format) ? format : 'html';
    return this.importService.exportBookmarks(tenantId, validFormat);
  }
}
