import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import { Request, Response } from "express";
import { PaymentService } from "@/payment/services/payment.service";
import { UtilityService } from "@/core/services/util.service";
import { SupportedCurrencyEnum } from "@/wallet/schemas/wallet.schema";
import {
  CreatePaymentIntentDTO,
  VerifyAccountNumbertDTO,
} from "./types/payment.type";
import { UserDocument } from "@/user/schemas/user.schema";
import { CurrentUser } from "@/auth/decorators/user.decorator";

@Controller("payments")
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get("banks")
  async fetchBanks(
    @Res() res: Response,
    @Query("currency") currency: SupportedCurrencyEnum
  ): Promise<any> {
    return UtilityService.handleRequest(
      res,
      "successful",
      this.paymentService,
      "fetchBanks",
      HttpStatus.OK,
      currency
    );
  }

  @Post("verify/account")
  async verifyAccountNumber(
    @Res() res: Response,
    @Body() payload: VerifyAccountNumbertDTO
  ): Promise<any> {
    return UtilityService.handleRequest(
      res,
      "successful",
      this.paymentService,
      "verifyAccountNumber",
      HttpStatus.OK,
      payload
    );
  }

  @Post("session")
  async createCheckoutSession(
    @Res() res: Response,
    @Body() payload: CreatePaymentIntentDTO,
    @CurrentUser() user: UserDocument
  ): Promise<any> {
    return UtilityService.handleRequest(
      res,
      "successful",
      this.paymentService,
      "createCheckoutSession",
      HttpStatus.OK,
      user,
      payload
    );
  }
}
