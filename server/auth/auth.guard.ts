import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Response } from 'express';
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

    const { req, res } = this.getRequestResponse(context);
    const session = await this.auth.resolveSession(req, res);
    if (!session) throw new UnauthorizedException('Требуется аутентификация');

    req.user = await this.auth.getOrCreateLocalUser(session.getUserId());
    return true;
  }

  private getRequestResponse(context: ExecutionContext): { req: AuthenticatedRequest; res: Response } {
    if (context.getType<string>() === 'http') {
      const http = context.switchToHttp();
      return { req: http.getRequest(), res: http.getResponse() };
    }
    const gql = GqlExecutionContext.create(context).getContext<{ req: AuthenticatedRequest; res: Response }>();
    return { req: gql.req, res: gql.res };
  }
}
