import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';
import { Role } from '@prisma/client';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

class ReorderCategoriesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  orderedIds: string[];
}

@ApiTags('categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @ApiOperation({ summary: 'Create a new category' })
  async create(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoryService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all categories (flat)' })
  async findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.categoryService.findAll(tenantId);
  }

  @Get('tree')
  @ApiOperation({ summary: 'Get categories as a nested tree' })
  async getTree(@CurrentUser('tenantId') tenantId: string) {
    return this.categoryService.getTree(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a category by ID' })
  async findOne(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.categoryService.findOne(tenantId, id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @ApiOperation({ summary: 'Update a category' })
  async update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @ApiOperation({ summary: 'Delete a category' })
  async remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.categoryService.remove(tenantId, id);
  }

  @Post('reorder')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @ApiOperation({ summary: 'Reorder categories' })
  async reorder(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: ReorderCategoriesDto,
  ) {
    return this.categoryService.reorder(tenantId, dto.orderedIds);
  }

  @Patch('reorder')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @ApiOperation({ summary: 'Reorder categories (PATCH alias)' })
  async reorderPatch(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: ReorderCategoriesDto,
  ) {
    return this.categoryService.reorder(tenantId, dto.orderedIds);
  }
}
