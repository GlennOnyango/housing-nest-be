import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export function RequireRole(...roles: string[]) {
  return SetMetadata(ROLES_KEY, roles);
}
