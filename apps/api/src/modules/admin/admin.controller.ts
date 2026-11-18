import {
  Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

class AdminUpdateTenantDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  plan?: string;

  @IsNumber()
  @IsOptional()
  maxBookmarks?: number;

  @IsNumber()
  @IsOptional()
  maxMembers?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

class AdminUpdateRoleDto {
  @IsString()
  role: string;
}

class CreateAiProviderDto {
  @IsString()
  name: string;

  @IsString()
  baseUrl: string;

  @IsString()
  apiKey: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsString()
  @IsOptional()
  description?: string;
}

class UpdateAiProviderDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  baseUrl?: string;

  @IsString()
  @IsOptional()
  apiKey?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  description?: string;
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ══════ Dashboard Analytics ══════
  @Get('analytics')
  @ApiOperation({ summary: 'Get platform-wide analytics' })
  async getAnalytics() {
    return this.adminService.getAnalytics();
  }

  // ══════ Tenant Management ══════
  @Get('tenants')
  @ApiOperation({ summary: 'List all tenants with pagination' })
  async listTenants(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('plan') plan?: string,
    @Query('status') status?: string,
  ) {
    const rawLimit = limit || pageSize;
    const parsedPage = Math.max(1, page ? parseInt(page, 10) || 1 : 1);
    const parsedLimit = Math.min(100, Math.max(1, rawLimit ? parseInt(rawLimit, 10) || 20 : 20));
    const normalizedStatus = status?.toLowerCase();

    return this.adminService.listTenants({
      page: parsedPage,
      limit: parsedLimit,
      search,
      plan,
      isActive:
        normalizedStatus === 'active'
          ? true
          : normalizedStatus === 'inactive' || normalizedStatus === 'frozen'
            ? false
            : undefined,
    });
  }

  @Get('tenants/:id')
  @ApiOperation({ summary: 'Get tenant details with stats' })
  async getTenant(@Param('id') id: string) {
    return this.adminService.getTenantDetail(id);
  }

  @Patch('tenants/:id')
  @ApiOperation({ summary: 'Update tenant (plan, limits, status)' })
  async updateTenant(@Param('id') id: string, @Body() dto: AdminUpdateTenantDto) {
    return this.adminService.updateTenant(id, dto);
  }

  @Patch('tenants/:id/freeze')
  @ApiOperation({ summary: 'Freeze a tenant' })
  async freezeTenant(@Param('id') id: string) {
    return this.adminService.setTenantStatus(id, false);
  }

  @Patch('tenants/:id/activate')
  @ApiOperation({ summary: 'Activate a frozen tenant' })
  async activateTenant(@Param('id') id: string) {
    return this.adminService.setTenantStatus(id, true);
  }

  @Delete('tenants/:id')
  @ApiOperation({ summary: 'Delete a tenant and all its data' })
  async deleteTenant(@Param('id') id: string) {
    return this.adminService.deleteTenant(id);
  }

  // ══════ User Management ══════
  @Get('users')
  @ApiOperation({ summary: 'List all users across tenants' })
  async listUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    const rawLimit = limit || pageSize;
    const parsedPage = Math.max(1, page ? parseInt(page, 10) || 1 : 1);
    const parsedLimit = Math.min(100, Math.max(1, rawLimit ? parseInt(rawLimit, 10) || 20 : 20));

    return this.adminService.listUsers({
      page: parsedPage,
      limit: parsedLimit,
      search,
      role,
    });
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Change a user role' })
  async updateUserRole(@Param('id') id: string, @Body() dto: AdminUpdateRoleDto) {
    return this.adminService.updateUserRole(id, dto.role);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete a user' })
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  // ══════ AI Provider Management ══════
  @Get('ai-providers')
  @ApiOperation({ summary: 'List all AI providers' })
  async listAiProviders() {
    return this.adminService.listAiProviders();
  }

  @Post('ai-providers')
  @ApiOperation({ summary: 'Create a new AI provider' })
  async createAiProvider(@Body() dto: CreateAiProviderDto) {
    return this.adminService.createAiProvider(dto);
  }

  @Patch('ai-providers/:id')
  @ApiOperation({ summary: 'Update an AI provider' })
  async updateAiProvider(
    @Param('id') id: string,
    @Body() dto: UpdateAiProviderDto,
  ) {
    return this.adminService.updateAiProvider(id, dto);
  }

  @Patch('ai-providers/:id/default')
  @ApiOperation({ summary: 'Set an AI provider as the default' })
  async setDefaultAiProvider(@Param('id') id: string) {
    return this.adminService.setDefaultAiProvider(id);
  }

  @Delete('ai-providers/:id')
  @ApiOperation({ summary: 'Delete an AI provider' })
  async deleteAiProvider(@Param('id') id: string) {
    return this.adminService.deleteAiProvider(id);
  }

  @Post('ai-providers/:id/test')
  @ApiOperation({ summary: 'Test an AI provider connection' })
  async testAiProvider(@Param('id') id: string) {
    return this.adminService.testAiProvider(id);
  }
}
