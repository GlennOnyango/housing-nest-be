import { randomUUID } from 'crypto';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

type ProblemDetails = {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  requestId?: string;
  errors?: string[];
};

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const errorResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;

    const detail =
      typeof errorResponse === 'string'
        ? errorResponse
        : typeof errorResponse === 'object' && errorResponse !== null
          ? (errorResponse as { message?: string | string[] }).message
          : undefined;

    const errors = Array.isArray(detail) ? detail : undefined;

    const problem: ProblemDetails = {
      type: 'about:blank',
      title:
        exception instanceof HttpException
          ? exception.name
          : 'Internal Server Error',
      status,
      detail: Array.isArray(detail) ? 'Validation failed' : detail,
      instance: request.originalUrl,
      requestId:
        (request.headers['x-request-id'] as string | undefined) ?? randomUUID(),
      errors,
    };

    response.status(status).json(problem);
  }
}
