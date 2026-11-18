import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify which roles are required to access an endpoint.
 * Usage: @Roles(Role.ADMIN, Role.EDITOR)
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
