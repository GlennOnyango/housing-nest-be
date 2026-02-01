import { SetMetadata } from '@nestjs/common';

export type OrgScopeOptions = {
  param?: string;
};

export const ORG_SCOPE_KEY = 'org-scope';

export function RequireOrgScope(options: OrgScopeOptions = {}) {
  return SetMetadata(ORG_SCOPE_KEY, options);
}
