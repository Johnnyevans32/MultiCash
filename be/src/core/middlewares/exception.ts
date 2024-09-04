import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
} from "@nestjs/common";
import { FastifyReply } from "fastify";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  statusCodeMessage = {
    400: "we don't allow this, go back to the docs, please",
    401: "Thou shalt not pass!",
    402: "please kindly fund your account to complete request",
    403: "you are out of bounds",
    404: "hmm, one of our engineers is responsible for this or is it you?",
    405: "wrong request method, go back to the docs, please",
    409: "this is conflicting with our resources",
    422: "unprocessable entity",
    429: "give us a break boss, too much requests sent already",
    500: "shit, we played too much, we are fixing it now",
    501: "we are working to make this implemented, give us some time please",
    503: "api maintenance undergoing",
  };
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    response.status(status).send({
      code: status,
      message:
        status === 404
          ? this.statusCodeMessage[status]
          : (exception.getResponse() as any).message || exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
