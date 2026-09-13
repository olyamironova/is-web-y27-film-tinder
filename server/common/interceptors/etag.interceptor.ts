import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { createHash } from 'crypto';
import { Request, Response } from 'express';
import { Observable, map } from 'rxjs';

@Injectable()
export class EtagInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType<string>() !== 'http') return next.handle();
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data: unknown) => {
        const etag = `"${createHash('sha256').update(JSON.stringify(data)).digest('base64url')}"`;
        response.setHeader('ETag', etag);
        if (request.headers['if-none-match'] === etag) {
          response.status(304);
          return undefined;
        }
        return data;
      }),
    );
  }
}
