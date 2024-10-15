import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { UserService } from "@/user/services/user.service";
import { UtilityService } from "@/core/services/util.service";
import { UserDocument } from "@/user/schemas/user.schema";
import * as moment from "moment";

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userService.findUser({ email });
    if (!user) return;
    const isMatch = await UtilityService.verifyPassword(
      password,
      user.password
    );
    if (isMatch) return user;
  }

  async signin(user: UserDocument, payload: any) {
    const session = await this.userService.findOrCreateUserSession(
      user,
      payload
    );
    user.lastLoggedIn = moment().toDate();
    await user.save();
    return {
      accessToken: this.jwtService.sign({
        sub: user.id,
        tokenVersion: user.jwtTokenVersion,
        sessionId: session.id,
      }),
    };
  }

  async signup(payload: any) {
    return this.userService.signup(payload);
  }

  async forgotPassword(payload: any) {
    return this.userService.forgotPassword(payload);
  }

  async resetPassword(payload: any) {
    return this.userService.resetPassword(payload);
  }
}
