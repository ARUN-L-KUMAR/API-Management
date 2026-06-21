import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const OrgId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    // Check authenticated user first, then headers, then fallback
    if (request.user?.organizationId) return request.user.organizationId;
    const defaultOrgId = 'd0000000-0000-0000-0000-000000000000';
    return request.headers['x-organization-id'] || defaultOrgId;
  },
);

export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    // Check authenticated user first, then headers, then fallback
    if (request.user?.userId) return request.user.userId;
    const defaultUserId = '10000000-0000-0000-0000-000000000000';
    return request.headers['x-user-id'] || defaultUserId;
  },
);
