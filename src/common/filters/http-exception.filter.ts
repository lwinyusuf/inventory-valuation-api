import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = 
      exception instanceof HttpException 
        ? exception.getResponse() 
        : { message: 'Internal server error' };

    const message = 
      typeof exceptionResponse === 'object' && exceptionResponse['message']
        ? exceptionResponse['message']
        : exceptionResponse;

    response.status(status).json({
      success: false,
      statusCode: status,
      message: Array.isArray(message) ? message[0] : message, // Flatten validation errors
      data: null,
      timestamp: new Date().toISOString(),
    });
  }
}
