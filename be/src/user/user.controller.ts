import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Put,
  Res,
} from "@nestjs/common";
import { Response } from "express";

import { UserService } from "@/user/services/user.service";
import { UpdatePasswordDTO, UpdateUserDTO } from "@/user/dtos/user.dto";
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
}
