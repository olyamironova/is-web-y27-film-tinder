import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator.js';
import { AuthenticatedRequest } from '../common/types/authenticated-request.js';
import { AuthService } from './auth.service.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = this.getRequest(context);
    const user = await this.auth.authenticateRequest(request);
    if (!user) throw new UnauthorizedException('Требуется аутентификация');
    request.user = user;
    return true;
  }

  private getRequest(context: ExecutionContext): AuthenticatedRequest {
    if (context.getType<string>() === 'http') {
      return context.switchToHttp().getRequest<AuthenticatedRequest>();
    }
    return GqlExecutionContext.create(context).getContext<{ req: AuthenticatedRequest }>().req;
  }
}
