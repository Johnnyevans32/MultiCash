import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { UserService } from "@/user/services/user.service";
import { UserController } from "@/user/user.controller";
import { USER, USER_DEVICE } from "@/core/constants/schema.constants";
import { UserSchema } from "@/user/schemas/user.schema";
import { UserDeviceSchema } from "./schemas/user-device.schema";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: USER, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: USER_DEVICE, schema: UserDeviceSchema },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
