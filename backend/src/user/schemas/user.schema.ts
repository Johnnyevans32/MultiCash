import { Prop, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

import {
  BaseSchema,
  BaseSchemaDecorator,
} from "@/core/decorators/base-schema.decorator";
import { UtilityService } from "@/core/services/util.service";
import { UserSessionDocument } from "./user-session.schema";
import { USER_SESSION } from "@/core/constants/schema.constants";
import { createHmac } from "crypto";
import configuration from "@/core/services/configuration";

export type UserDocument = HydratedDocument<User>;

export enum SupportedCountry {
  NG = "NG",
  GH = "GH",
  KE = "KE",
  ZA = "ZA",
}

@BaseSchemaDecorator({
  toJSON: {
    virtuals: true,
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

  @Prop({ type: String, required: true, unique: true })
  email: string;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({ type: String, enum: Object.values(SupportedCountry) })
  country: SupportedCountry;

  @Prop({ type: String })
  profileImage?: string;

  @Prop({ type: String })
  kycVcJwt?: string;

  @Prop({ type: String })
  resetPasswordToken?: string;

  @Prop({ type: Date })
  resetPasswordTokenExpires?: Date;

  @Prop({ type: Number, default: 0 })
  jwtTokenVersion?: number;

  @Prop({ type: String, unique: true })
  tag?: string;

  @Prop({ type: Boolean, default: false })
  pushNotificationIsEnabled: boolean;

  @Prop({ type: Date })
  lastLoggedIn: Date;

  sessions: UserSessionDocument[];
  intercomHash?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre<UserDocument>("save", async function (next) {
  const user = this;

  if (user.isModified("password")) {
    user.password = await UtilityService.hashPassword(user.password);
  }

  next();
});

UserSchema.virtual("sessions", {
  localField: "_id",
  foreignField: "user",
  ref: USER_SESSION,
  match: {
    isDeleted: false,
  },
});

UserSchema.virtual("intercomHash").get(function () {
  if (!this.email) return;
  const hash = createHmac("sha256", configuration().intercom.secretKey)
    .update(this.email)
    .digest("hex");
  return hash;
});
