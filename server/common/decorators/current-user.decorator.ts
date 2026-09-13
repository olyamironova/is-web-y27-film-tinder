import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthenticatedRequest, AuthenticatedUser } from '../types/authenticated-request.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser | undefined => {
    const request = context.getType<string>() === 'http'
      ? context.switchToHttp().getRequest<AuthenticatedRequest>()
      : GqlExecutionContext.create(context).getContext<{ req: AuthenticatedRequest }>().req;
    return request.user;
  },
);
