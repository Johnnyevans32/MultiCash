import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
} from "@nestjs/common";
import { Response } from "express";
import { HttpStatusCode } from "axios";

import { UtilityService } from "@/core/services/util.service";
import { ExchangeService } from "./services/exchange.service";
import { CreateExchangeDTO, GetOfferingsDTO } from "./types";
import { CurrentUser, Public } from "@/auth/decorators/user.decorator";
import { UserDocument } from "@/user/schemas/user.schema";
import { PaginateDTO } from "@/core/services/response.service";

@Controller("exchanges")
export class ExchangeController {
  constructor(private exchangeService: ExchangeService) {}

  @Get("pfis")
  async fetchPfis(@Res() res: Response, @Query() payload: any) {
    return UtilityService.handleRequest(
      res,
      "successful",
      this.exchangeService,
      "fetchPfis",
      HttpStatusCode.Ok,
      payload
    );
  }

  @Get("offerings")
  async getOfferings(@Res() res: Response, @Query() payload: GetOfferingsDTO) {
    return UtilityService.handleRequest(
      res,
      "successful",
      this.exchangeService,
      "getOfferings",
      HttpStatusCode.Ok,
      payload
    );
  }

  @Post("")
  async createExchange(
    @Res() res: Response,
    @Body() payload: CreateExchangeDTO,
    @CurrentUser() user: UserDocument
  ) {
    return UtilityService.handleRequest(
      res,
      "successful",
      this.exchangeService,
      "createExchange",
      HttpStatusCode.Created,
      user,
      payload
    );
  }

  @Get("")
  async fetchExchanges(
    @Res() res: Response,
    @CurrentUser() user: UserDocument,
    @Query() payload: PaginateDTO
  ) {
    return UtilityService.handleRequest(
      res,
      "successful",
      this.exchangeService,
      "fetchExchanges",
      HttpStatusCode.Ok,
      user,
      payload
    );
  }

  @Put(":id/rate")
  async rateExchange(
    @Res() res: Response,
    @CurrentUser() user: UserDocument,
    @Param("id") exchangeId: string,
    @Body() payload: any
  ) {
    return UtilityService.handleRequest(
      res,
      "successful",
      this.exchangeService,
      "rateExchange",
      HttpStatusCode.Ok,
      user,
      exchangeId,
      payload
    );
  }

  @Public()
  @Get("offerings/status")
  async checkStatusOfOfferingsFromPFIs(@Res() res: Response) {
    return UtilityService.handleRequest(
      res,
      "successful",
      this.exchangeService,
      "checkStatusOfOfferingsFromPFIs",
      HttpStatusCode.Ok
    );
  }
}
