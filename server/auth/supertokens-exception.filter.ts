import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Request, Response } from 'express';
import { errorHandler } from 'supertokens-node/framework/express';
import { Error as SupertokensError } from 'supertokens-node';

@Catch(SupertokensError)
export class SupertokensExceptionFilter implements ExceptionFilter {
  private readonly handler = errorHandler();

  catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType<string>() === 'graphql') {
      throw exception;
    }
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    void this.handler(exception, request, response, (err) => {
      if (err) throw err;
    });
  }
}
