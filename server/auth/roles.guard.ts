import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ROLES_KEY } from '../common/decorators/roles.decorator.js';
import { AuthenticatedRequest } from '../common/types/authenticated-request.js';
import { UserRole } from '../users/entities/user.entity.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!roles?.length) return true;
    const request = context.getType<string>() === 'http'
      ? context.switchToHttp().getRequest<AuthenticatedRequest>()
      : GqlExecutionContext.create(context).getContext<{ req: AuthenticatedRequest }>().req;
    if (!request.user || !roles.includes(request.user.role)) {
      throw new ForbiddenException('Недостаточно прав');
    }
    return true;
  }
}
