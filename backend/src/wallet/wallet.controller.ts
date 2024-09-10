import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
} from "@nestjs/common";
import { Response } from "express";

import { WalletService } from "@/wallet/services/wallet.service";
import { UserDocument } from "@/user/schemas/user.schema";
import { CurrentUser } from "@/auth/decorators/user.decorator";
import { UtilityService } from "@/core/services/util.service";
import { HttpStatusCode } from "axios";
import { PaginateDTO } from "@/core/services/response.service";
import { CreateBenefiaryDTO, WithdrawFromWalletDTO } from "./dtos/wallet.dto";

@Controller("wallets")
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get("")
  async fetchWallets(@Res() res: Response, @CurrentUser() user: UserDocument) {
    return UtilityService.handleRequest(
      res,
      "successful",
      this.walletService,
      "fetchWallets",
      HttpStatusCode.Ok,
      user
    );
  }

  @Get(":id/transactions")
  async fetchWalletTransactions(
    @Res() res: Response,
    @CurrentUser() user: UserDocument,
    @Param("id") walletId: string,
    @Query() query: PaginateDTO
  ) {
    return UtilityService.handleRequest(
      res,
      "successful",
      this.walletService,
      "fetchWalletTransactions",
      HttpStatusCode.Ok,
      user,
      walletId,
      query
    );
  }

  @Post("withdraw")
  async withdraw(
    @Res() res: Response,
    @CurrentUser() user: UserDocument,
    @Body() payload: WithdrawFromWalletDTO
  ) {
    return UtilityService.handleRequest(
      res,
      "successful",
      this.walletService,
      "withdraw",
      HttpStatusCode.Ok,
      user,
      payload
    );
  }

  @Post("benefiaries")
  async createBenefiary(
    @Res() res: Response,
    @CurrentUser() user: UserDocument,
    @Body() payload: CreateBenefiaryDTO
  ) {
    return UtilityService.handleRequest(
      res,
      "successful",
      this.walletService,
      "createBenefiary",
      HttpStatusCode.Created,
      user,
      payload
    );
  }

  @Get("benefiaries")
  async fetchBenefiaries(
    @Res() res: Response,
    @CurrentUser() user: UserDocument
  ) {
    return UtilityService.handleRequest(
      res,
      "successful",
      this.walletService,
      "fetchBenefiaries",
      HttpStatusCode.Ok,
      user
    );
  }

  @Delete("benefiaries/:id")
  async deleteBenefiary(
    @Res() res: Response,
    @CurrentUser() user: UserDocument,
    @Param("id") benefiaryId: string
  ) {
    return UtilityService.handleRequest(
      res,
      "successful",
      this.walletService,
      "deleteBenefiary",
      HttpStatusCode.Ok,
      user,
      benefiaryId
    );
  }
}
