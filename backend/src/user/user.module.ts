import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { UserService } from "@/user/services/user.service";
import { UserController } from "@/user/user.controller";
import { USER, USER_SESSION } from "@/core/constants/schema.constants";
import { UserSchema } from "@/user/schemas/user.schema";
import { UserSessionSchema } from "./schemas/user-session.schema";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: USER, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: USER_SESSION, schema: UserSessionSchema },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
