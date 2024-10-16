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
import { HttpStatusCode } from "axios";
import * as requestIp from "request-ip";

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
  async signin(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: UserDocument,
    @Body() payload: any
  ) {
    const ipAddress = requestIp.getClientIp(req);
    const userAgent = req.headers["user-agent"];

    return UtilityService.handleRequest(
      res,
      "signin successful",
      this.authService,
      "signin",
      HttpStatus.OK,
      user,
      { ...payload, userAgent, ipAddress }
    );
  }

  @Public()
  @Post("signup")
  async signup(@Res() res: Response, @Body() payload: CreateUserDTO) {
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
