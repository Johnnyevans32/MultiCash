import { Prop, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes } from "mongoose";

import {
  BaseSchema,
  BaseSchemaDecorator,
} from "@/core/decorators/base-schema.decorator";
import { USER } from "@/core/constants/schema.constants";
import { UserDocument } from "./user.schema";

export type UserDeviceDocument = HydratedDocument<UserDevice>;

@BaseSchemaDecorator()
export class UserDevice extends BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: USER })
  user: UserDocument | string;

  @Prop({ type: String })
  deviceId: string;

  @Prop({ type: String })
  name: string;

  @Prop({ type: String })
  fcmToken: string;

  @Prop({ type: String })
  ip: string;

  @Prop({ type: SchemaTypes.Date })
  lastActivity?: Date;
}

export const UserDeviceSchema = SchemaFactory.createForClass(UserDevice);
