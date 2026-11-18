import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { BookmarkService } from './bookmark.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { UpdateBookmarkDto } from './dto/update-bookmark.dto';
import { BookmarkFilterDto } from './dto/bookmark-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('bookmarks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bookmarks')
export class BookmarkController {
  constructor(private readonly bookmarkService: BookmarkService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @ApiOperation({ summary: 'Create a new bookmark' })
  async create(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateBookmarkDto,
  ) {
    return this.bookmarkService.create(tenantId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List bookmarks with filtering and pagination' })
  async findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query() filters: BookmarkFilterDto,
  ) {
    return this.bookmarkService.findAll(tenantId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a bookmark by ID' })
  async findOne(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.bookmarkService.findOne(tenantId, id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @ApiOperation({ summary: 'Update a bookmark' })
  async update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBookmarkDto,
  ) {
    return this.bookmarkService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @ApiOperation({ summary: 'Delete a bookmark' })
  async remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.bookmarkService.remove(tenantId, id);
  }

  @Post('batch/delete')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Batch delete bookmarks' })
  async batchDelete(
    @CurrentUser('tenantId') tenantId: string,
    @Body('ids') ids: string[],
  ) {
    return this.bookmarkService.batchDelete(tenantId, ids);
  }

  @Post('batch/move')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @ApiOperation({ summary: 'Batch move bookmarks to a category' })
  async batchMove(
    @CurrentUser('tenantId') tenantId: string,
    @Body('ids') ids: string[],
    @Body('categoryId') categoryId: string | null,
  ) {
    return this.bookmarkService.batchMove(tenantId, ids, categoryId);
  }

  @Post(':id/click')
  @ApiOperation({ summary: 'Track a bookmark click' })
  async trackClick(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.bookmarkService.incrementClickCount(tenantId, id);
  }
}
