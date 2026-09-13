import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : null;
    const details = typeof exceptionResponse === 'string'
      ? exceptionResponse
      : (exceptionResponse as { message?: string | string[] } | null)?.message;
    const message = Array.isArray(details) ? details.join('; ') : details ?? 'Внутренняя ошибка сервера';

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const stack = exception instanceof Error ? exception.stack : String(exception);
      this.logger.error(`${request.method} ${request.originalUrl}: ${message}`, stack);
    }

    if (request.originalUrl.startsWith('/admin') && request.accepts('html')) {
      response.status(status).send(`<!doctype html><html lang="ru"><meta charset="utf-8"><title>Ошибка</title><body><h1>Ошибка ${status}</h1><p>${this.escapeHtml(message)}</p><a href="/admin/movies">Назад</a></body></html>`);
      return;
    }

    response.status(status).json({
      statusCode: status,
      message,
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
    });
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!);
  }
}
