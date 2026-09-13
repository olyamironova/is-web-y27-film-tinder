import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../common/types/authenticated-request.js';
import { UserRole } from '../users/entities/user.entity.js';
import { AuthService } from './auth.service.js';

@Injectable()
export class AuthRedirectMiddleware implements NestMiddleware {
  constructor(private readonly auth: AuthService) {}

  async use(request: AuthenticatedRequest, response: Response, next: NextFunction): Promise<void> {
    const user = await this.auth.authenticateRequest(request);
    if (!user) {
      response.redirect('/login?next=/admin/movies');
      return;
    }
    if (user.role !== UserRole.ADMIN) {
      response.status(403).send('Доступ разрешён только администратору');
      return;
    }
    request.user = user;
    next();
  }
}
