import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
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
import { CreateBeneficiaryDTO, WithdrawFromWalletDTO } from "./dtos/wallet.dto";

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

  @Get("transactions/:transactionId/receipt")
  @Header("Content-Type", "application/pdf")
  @Header("Content-Disposition", "attachment; filename=receipt.pdf")
  async getTransactionReceipt(
    @Res() res: Response,
    @CurrentUser() user: UserDocument,
    @Param("transactionId") id: string
  ) {
    const pdfBuffer = await this.walletService.getTransactionReceipt(user, id);

    res.send(pdfBuffer);
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

  @Post("beneficiaries")
  async createBeneficiary(
    @Res() res: Response,
    @CurrentUser() user: UserDocument,
    @Body() payload: CreateBeneficiaryDTO
  ) {
    return UtilityService.handleRequest(
      res,
      "successful",
      this.walletService,
      "createBeneficiary",
      HttpStatusCode.Created,
      user,
      payload
    );
  }

  @Get("beneficiaries")
  async fetchBeneficiaries(
    @Res() res: Response,
    @CurrentUser() user: UserDocument,
    @Query("search") search: string
  ) {
    return UtilityService.handleRequest(
      res,
      "successful",
      this.walletService,
      "fetchBeneficiaries",
      HttpStatusCode.Ok,
      user,
      search
    );
  }

  @Delete("beneficiaries/:id")
  async deleteBeneficiary(
    @Res() res: Response,
    @CurrentUser() user: UserDocument,
    @Param("id") beneficiaryId: string
  ) {
    return UtilityService.handleRequest(
      res,
      "successful",
      this.walletService,
      "deleteBeneficiary",
      HttpStatusCode.Ok,
      user,
      beneficiaryId
    );
  }

  @Get("accounts")
  async fetchWalletAccounts(
    @Res() res: Response,
    @CurrentUser() user: UserDocument
  ) {
    return UtilityService.handleRequest(
      res,
      "successful",
      this.walletService,
      "fetchWalletAccounts",
      HttpStatusCode.Ok,
      user
    );
  }
}
