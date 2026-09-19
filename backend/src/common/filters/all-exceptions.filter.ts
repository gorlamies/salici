import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";

export function toErrorPayload(exception: unknown) {
  const status_code =
    exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
  const message =
    exception instanceof HttpException
      ? exception.message
      : "internal server error";
  const code =
    exception instanceof HttpException
      ? (HttpStatus[status_code] ?? "ERROR")
      : "INTERNAL_ERROR";

  return { status_code, message, code };
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const res = context.getResponse<Response>();
    const payload = toErrorPayload(exception);

    res.status(payload.status_code).json(payload);
  }
}