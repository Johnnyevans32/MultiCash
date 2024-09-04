import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { UserService } from "@/user/services/user.service";
import { UserController } from "@/user/user.controller";
import { USER } from "@/core/constants/schema.constants";
import { UserSchema } from "@/user/schemas/user.schema";

@Module({
  imports: [MongooseModule.forFeature([{ name: USER, schema: UserSchema }])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
