import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Response } from 'express';
import { Observable, map } from 'rxjs';

@Injectable()
export class ElapsedTimeInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ElapsedTimeInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startedAt = performance.now();
    return next.handle().pipe(
      map((data: unknown) => {
        const elapsedMs = Number((performance.now() - startedAt).toFixed(2));
        if (context.getType<string>() === 'graphql') {
          const gqlContext = GqlExecutionContext.create(context).getContext<{ res?: Response }>();
          if (gqlContext.res && !gqlContext.res.headersSent) gqlContext.res.setHeader('X-Elapsed-Time', `${elapsedMs}ms`);
        } else if (context.getType<string>() === 'http') {
          const response = context.switchToHttp().getResponse<Response>();
          // Ответ мог быть уже отправлен обработчиком (например, res.redirect в logout) — тогда заголовок не трогаем
          if (!response.headersSent) response.setHeader('X-Elapsed-Time', `${elapsedMs}ms`);
          const request = context.switchToHttp().getRequest<{ originalUrl?: string }>();
          this.logger.log(`${request.originalUrl ?? 'request'} ${elapsedMs}ms`);
          if (request.originalUrl?.startsWith('/admin') && data && typeof data === 'object') {
            return { ...(data as object), serverElapsedMs: elapsedMs };
          }
        }
        return data;
      }),
    );
  }
}
