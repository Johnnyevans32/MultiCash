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
import { VerifyAccountNumbertDTO } from "./types/payment.type";

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
}
