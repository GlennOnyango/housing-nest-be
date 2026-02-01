import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthUser } from './auth-user';
import { ORG_SCOPE_KEY, OrgScopeOptions } from './org-scope.decorator';

@Injectable()
export class OrgScopeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<OrgScopeOptions>(
      ORG_SCOPE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: AuthUser;
      params: Record<string, string>;
    }>();
    const user = request.user;
    if (!user) {
      throw new NotFoundException();
    }

    const orgParam = options.param ?? 'orgId';
    const orgId = request.params[orgParam];
    if (!orgId || !user.orgIds.includes(orgId)) {
      throw new NotFoundException();
    }

    return true;
  }
}
