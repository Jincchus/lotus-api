import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorLogsService } from '../../error-logs/error-logs.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly errorLogsService: ErrorLogsService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    console.error('[AllExceptionsFilter]', exception);
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    let status = 500;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message =
        typeof res === 'string'
          ? res
          : ((res as any).message ?? exception.message);
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // 5xx 서버 에러만 DB에 기록 (4xx 클라이언트 에러 제외)
    if (status >= 500) {
      const userId = (request as any).user?.id ?? null;
      this.errorLogsService
        .save({
          message: Array.isArray(message) ? message.join(', ') : String(message),
          stack: exception instanceof Error ? exception.stack : undefined,
          userId,
          path: request.url,
        })
        .catch(() => {});
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
