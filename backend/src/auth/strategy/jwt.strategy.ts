import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UserService } from "@/user/services/user.service";
import configuration from "@/core/services/configuration";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configuration().jwt.secret,
    });
  }

  async validate(payload: any) {
    const [user, session] = await Promise.all([
      this.userService.findUser({
        _id: payload.sub,
        jwtTokenVersion: payload.tokenVersion,
      }),
      this.userService.findSession(payload.sessionId),
    ]);

    if (!session) {
      throw new UnauthorizedException("session invalid");
    }

    return user;
  }
}
