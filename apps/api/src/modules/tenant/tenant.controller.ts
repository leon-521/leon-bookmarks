import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';
import { TenantService } from './tenant.service';
import { UpdateTenantDto, UpdateThemeDto } from './dto/update-tenant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

class InviteWorkspaceMemberDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  role?: Role;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;
}

class UpdateWorkspaceMemberRoleDto {
  @IsString()
  role: Role;
}

@ApiTags('tenants')
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get('members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List members in the current workspace' })
  async listMembers(@CurrentUser('tenantId') tenantId: string) {
    return this.tenantService.listMembers(tenantId);
  }

  @Post('members/invite')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invite a new member to the current workspace' })
  async inviteMember(
    @CurrentUser('tenantId') tenantId: string,
    @Body() body: InviteWorkspaceMemberDto,
  ) {
    return this.tenantService.inviteMember(tenantId, body);
  }

  @Patch('members/:memberId/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a workspace member role' })
  async updateMemberRole(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') requesterRole: Role,
    @Param('memberId') memberId: string,
    @Body() body: UpdateWorkspaceMemberRoleDto,
  ) {
    return this.tenantService.updateMemberRole(tenantId, userId, requesterRole, memberId, body.role);
  }

  @Delete('members/:memberId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a member from the workspace' })
  async removeMember(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') requesterRole: Role,
    @Param('memberId') memberId: string,
  ) {
    return this.tenantService.removeMember(tenantId, userId, requesterRole, memberId);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get public tenant info by slug' })
  async findBySlug(@Param('slug') slug: string) {
    return this.tenantService.findBySlug(slug);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get tenant by ID' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('role') role: Role,
  ) {
    if (role !== Role.SUPER_ADMIN && id !== tenantId) {
      throw new ForbiddenException('Cannot access another workspace');
    }
    return this.tenantService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update tenant settings' })
  async update(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('role') role: Role,
    @Body() dto: UpdateTenantDto,
  ) {
    const effectiveTenantId = role === Role.SUPER_ADMIN ? id : tenantId;
    return this.tenantService.update(id, effectiveTenantId, dto);
  }

  @Patch(':id/theme')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update tenant theme configuration' })
  async updateTheme(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('role') role: Role,
    @Body() dto: UpdateThemeDto,
  ) {
    const effectiveTenantId = role === Role.SUPER_ADMIN ? id : tenantId;
    return this.tenantService.updateTheme(id, effectiveTenantId, dto);
  }
}
