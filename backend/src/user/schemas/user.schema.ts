import { Prop, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

import {
  BaseSchema,
  BaseSchemaDecorator,
} from "@/core/decorators/base-schema.decorator";
import { UtilityService } from "@/core/services/util.service";

export type UserDocument = HydratedDocument<User>;

@BaseSchemaDecorator({
  toJSON: {
    transform: (_doc: any, ret: any): void => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.isDeleted;

      delete ret.password;
      delete ret.resetPasswordToken;
      delete ret.resetPasswordTokenExpires;
    },
  },
})
export class User extends BaseSchema {
  @Prop({ type: String })
  did: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({ type: String })
  profileImageUrl?: string;

  @Prop({ type: String })
  resetPasswordToken?: string;

  @Prop({ type: Date })
  resetPasswordTokenExpires?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre<UserDocument>("save", async function (next) {
  const user = this;

  if (user.isModified("password")) {
    user.password = await UtilityService.hashPassword(user.password);
  }

  next();
});
