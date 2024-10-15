import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Put,
  Res,
} from "@nestjs/common";
import { Response } from "express";

import { UserService } from "@/user/services/user.service";
import {
  UpdatePasswordDTO,
  UpdateUserDTO,
  UpdateUserTagDTO,
} from "@/user/dtos/user.dto";
import { CurrentUser } from "@/auth/decorators/user.decorator";
import { UtilityService } from "@/core/services/util.service";
import { HttpStatusCode } from "axios";
import { UserDocument } from "./schemas/user.schema";

@Controller("users")
export class UserController {
  constructor(private userService: UserService) {}

  @Get("")
  async me(@Res() res: Response, @CurrentUser() user: UserDocument) {
    return UtilityService.handleRequest(
      res,
      "successful",
      this.userService,
      "me",
      HttpStatus.OK,
      user
    );
  }

  @Put("")
  async updateUser(
    @Res() res: Response,
    @CurrentUser() user: UserDocument,
    @Body() payload: UpdateUserDTO
  ) {
    return UtilityService.handleRequest(
      res,
      "update successful",
      this.userService,
      "updateUser",
      HttpStatusCode.Ok,
      user,
      payload
    );
  }

  @Get("sessions")
  async fetchUserSessions(
    @Res() res: Response,
    @CurrentUser() user: UserDocument
  ) {
    return UtilityService.handleRequest(
      res,
      "sessions fetched successful",
      this.userService,
      "fetchUserSessions",
      HttpStatusCode.Ok,
      user
    );
  }

  @Get(":tag")
  async checkIfTagExist(@Res() res: Response, @Param("tag") tag: string) {
    return UtilityService.handleRequest(
      res,
      "successful",
      this.userService,
      "checkIfTagExist",
      HttpStatusCode.Ok,
      tag
    );
  }

  @Put("password")
  async updatePassword(
    @Res() res: Response,
    @CurrentUser() user: UserDocument,
    @Body() payload: UpdatePasswordDTO
  ) {
    return UtilityService.handleRequest(
      res,
      "update successful",
      this.userService,
      "updatePassword",
      HttpStatusCode.Ok,
      user,
      payload
    );
  }

  @Delete("")
  async deleteUser(@Res() res: Response, @CurrentUser() user: UserDocument) {
    return UtilityService.handleRequest(
      res,
      "delete successful",
      this.userService,
      "deleteUser",
      HttpStatusCode.Ok,
      user
    );
  }

  @Put("logout/:id")
  async logoutSession(
    @Res() res: Response,
    @CurrentUser() user: UserDocument,
    @Param("id") sessionClientId: string
  ) {
    return UtilityService.handleRequest(
      res,
      "successful",
      this.userService,
      "logoutSession",
      HttpStatusCode.Ok,
      user,
      sessionClientId
    );
  }

  @Put("tag")
  async updateUserTag(
    @Res() res: Response,
    @CurrentUser() user: UserDocument,
    @Body() payload: UpdateUserTagDTO
  ) {
    return UtilityService.handleRequest(
      res,
      "update successful",
      this.userService,
      "updateUserTag",
      HttpStatusCode.Ok,
      user,
      payload.tag
    );
  }

  @Put("sessions/fcm-token")
  async saveSessionFcmToken(
    @Res() res: Response,
    @CurrentUser() user: UserDocument,
    @Body() payload: any
  ) {
    return UtilityService.handleRequest(
      res,
      "update successful",
      this.userService,
      "saveSessionFcmToken",
      HttpStatusCode.Ok,
      user,
      payload
    );
  }

  @Put("sessions/:id/ping")
  async userSessionPing(
    @Res() res: Response,
    @CurrentUser() user: UserDocument,
    @Param("id") sesionClientId: string
  ) {
    return UtilityService.handleRequest(
      res,
      "update successful",
      this.userService,
      "userSessionPing",
      HttpStatusCode.Ok,
      user,
      sesionClientId
    );
  }
}
