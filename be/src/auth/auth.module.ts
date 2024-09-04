import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";

import { LocalStrategy } from "./strategy/local.strategy";
import { AuthService } from "./services/auth.service";
import { JwtModule } from "@nestjs/jwt";
import { JwtStrategy } from "./strategy/jwt.strategy";
import { AuthController } from "./auth.controller";
import configuration from "@/core/services/configuration";

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: configuration().jwt.secret,
        signOptions: { expiresIn: configuration().jwt.expiresIn },
      }),
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  controllers: [AuthController],
  exports: [],
})
export class AuthModule {}
