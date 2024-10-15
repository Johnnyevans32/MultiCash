import { Prop, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes } from "mongoose";

import {
  BaseSchema,
  BaseSchemaDecorator,
} from "@/core/decorators/base-schema.decorator";
import { USER } from "@/core/constants/schema.constants";
import { UserDocument } from "./user.schema";

export type UserSessionDocument = HydratedDocument<UserSession>;

@BaseSchemaDecorator()
export class UserSession extends BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: USER })
  user: UserDocument | string;

  @Prop({ type: String })
  sessionClientId: string;

  @Prop({ type: String })
  userAgent: string;

  @Prop({ type: String })
  fcmToken: string;

  @Prop({ type: String })
  ipAddress: string;

  @Prop({ type: String })
  location: string;

  @Prop({ type: SchemaTypes.Date, default: new Date() })
  lastActivity?: Date;
}

export const UserSessionSchema = SchemaFactory.createForClass(UserSession);
