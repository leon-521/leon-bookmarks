import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ImportService } from './import.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

class ImportHtmlDto {
  content: string;
  createCategories?: boolean;
  defaultCategoryId?: string;
  skipDuplicates?: boolean;
}

class ImportJsonDto {
  content: string;
}

@ApiTags('import')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.EDITOR)
@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('html')
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Import bookmarks from JSON format' })
  async importJson(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: ImportJsonDto,
  ) {
    return this.importService.importFromJson(tenantId, userId, dto.content);
  }
}
