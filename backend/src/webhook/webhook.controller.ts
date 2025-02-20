import {
  Body,
  Controller,
  HttpStatus,
  Post,
  Req,
  Res,
  RawBodyRequest,
} from "@nestjs/common";
import { Request, Response } from "express";
import { FastifyRequest } from "fastify";

import { PaymentService } from "@/payment/services/payment.service";
import { UtilityService } from "@/core/services/util.service";
import { PaymentProvider } from "@/payment/schemas/transfer-record.schema";
import { Public } from "@/auth/decorators/user.decorator";

@Controller("webhooks")
export class WebhookController {
  constructor(private readonly paymentService: PaymentService) {}

  @Public()
  @Post("paystack")
  async handlePaystackWebhook(
    @Res() res: Response,
    @Req() req: Request,
    @Body() payload: unknown
  ): Promise<any> {
    return UtilityService.handleRequest(
      res,
      "successful",
      {
        handleWebhook: (a: any, b: any) => {
          this.paymentService.handleWebhook(a, b);
          return {};
        },
      },
      "handleWebhook",
      HttpStatus.OK,
      { event: payload, headers: req.headers },
      PaymentProvider.Paystack
    );
  }

  @Public()
  @Post("wise")
  async handleWiseWebhook(
    @Res() res: Response,
    @Req() req: Request,
    @Body() payload: unknown
  ): Promise<any> {
    return UtilityService.handleRequest(
      res,
      "successful",
      {
        handleWebhook: (a: any, b: any) => {
          this.paymentService.handleWebhook(a, b);
          return {};
        },
      },
      "handleWebhook",
      HttpStatus.OK,
      { event: payload, headers: req.headers },
      PaymentProvider.Wise
    );
  }

  @Public()
  @Post("stripe")
  async handleStripeWebhook(
    @Res() res: Response,
    @Req() req: RawBodyRequest<FastifyRequest>,
    @Body() payload: unknown
  ): Promise<any> {
    return UtilityService.handleRequest(
      res,
      "successful",
      {
        handleWebhook: (a: any, b: any) => {
          this.paymentService.handleWebhook(a, b);
          return {};
        },
      },
      "handleWebhook",
      HttpStatus.OK,
      { event: payload, headers: req.headers, rawBody: req.rawBody },
      PaymentProvider.Stripe
    );
  }
}
