import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { middleware } from 'supertokens-node/framework/express';

@Injectable()
export class SupertokensMiddleware implements NestMiddleware {
  private readonly handler = middleware();

  use(request: Request, response: Response, next: NextFunction): void {
    void this.handler(request, response, next);
  }
}
