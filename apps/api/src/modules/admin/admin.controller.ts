import {
  Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

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
    @Query('search') search?: string,
    @Query('plan') plan?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.listTenants({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      search, plan,
      isActive: status === 'active' ? true : status === 'inactive' ? false : undefined,
    });
  }

  @Get('tenants/:id')
  @ApiOperation({ summary: 'Get tenant details with stats' })
  async getTenant(@Param('id') id: string) {
    return this.adminService.getTenantDetail(id);
  }

  @Patch('tenants/:id')
  @ApiOperation({ summary: 'Update tenant (plan, limits, status)' })
  async updateTenant(@Param('id') id: string, @Body() dto: any) {
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
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    return this.adminService.listUsers({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      search, role,
    });
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Change a user role' })
  async updateUserRole(@Param('id') id: string, @Body('role') role: Role) {
    return this.adminService.updateUserRole(id, role);
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
  async createAiProvider(
    @Body() dto: { name: string; baseUrl: string; apiKey: string; model?: string; isDefault?: boolean; description?: string },
  ) {
    return this.adminService.createAiProvider(dto);
  }

  @Patch('ai-providers/:id')
  @ApiOperation({ summary: 'Update an AI provider' })
  async updateAiProvider(
    @Param('id') id: string,
    @Body() dto: { name?: string; baseUrl?: string; apiKey?: string; model?: string; isDefault?: boolean; isActive?: boolean; description?: string },
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
