import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApplicationError } from '../errors/application-error';

interface ErrorResponse {
  statusCode: number;
  code: string;
  message: string;
  timestamp: string;
  path: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const errorResponse = this.toErrorResponse(exception, request.url);

    if (errorResponse.statusCode >= 500) {
      this.logger.error(
        errorResponse.message,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(errorResponse.statusCode).json(errorResponse);
  }

  private toErrorResponse(exception: unknown, path: string): ErrorResponse {
    if (exception instanceof ApplicationError) {
      return this.buildResponse(
        exception.statusCode,
        exception.code,
        exception.message,
        path,
      );
    }

    if (exception instanceof HttpException) {
      return this.fromHttpException(exception, path);
    }

    return this.buildResponse(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'INTERNAL_SERVER_ERROR',
      'Internal server error',
      path,
    );
  }

  private fromHttpException(
    exception: HttpException,
    path: string,
  ): ErrorResponse {
    const statusCode = exception.getStatus();
    const response = exception.getResponse();

    if (typeof response === 'string') {
      return this.buildResponse(
        statusCode,
        this.defaultCodeForStatus(statusCode),
        response,
        path,
      );
    }

    if (this.isNestErrorBody(response)) {
      return this.buildResponse(
        statusCode,
        this.defaultCodeForStatus(statusCode),
        this.formatMessage(response.message),
        path,
      );
    }

    return this.buildResponse(
      statusCode,
      this.defaultCodeForStatus(statusCode),
      exception.message,
      path,
    );
  }

  private isNestErrorBody(
    value: object,
  ): value is { message?: string | string[]; error?: string } {
    return 'message' in value || 'error' in value;
  }

  private formatMessage(message: string | string[] | undefined): string {
    if (Array.isArray(message)) {
      return message.join('; ');
    }

    return message ?? 'Request failed';
  }

  private defaultCodeForStatus(statusCode: number): string {
    const statusName = HttpStatus[statusCode] ?? 'ERROR';
    return String(statusName);
  }

  private buildResponse(
    statusCode: number,
    code: string,
    message: string,
    path: string,
  ): ErrorResponse {
    return {
      statusCode,
      code,
      message,
      timestamp: new Date().toISOString(),
      path,
    };
  }
}
