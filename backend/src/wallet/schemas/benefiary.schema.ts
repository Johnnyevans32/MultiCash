import { Prop, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";

import { UserDocument } from "@/user/schemas/user.schema";
import { BANK, USER, WALLET } from "@/core/constants/schema.constants";
import {
  BaseSchema,
  BaseSchemaDecorator,
} from "@/core/decorators/base-schema.decorator";
import { BankDocument } from "@/payment/schemas/bank.schema";
import { WalletDocument } from "./wallet.schema";

export type BenefiaryDocument = HydratedDocument<Benefiary>;

export enum BenefiaryType {
  BankAccount = "bankaccount",
  Platform = "platform",
}
@BaseSchemaDecorator()
export class Benefiary extends BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: USER, required: true })
  user: UserDocument | string;

  @Prop({ type: SchemaTypes.String })
  accountNumber: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: BANK })
  bank: BankDocument | string;

  @Prop({ type: SchemaTypes.String })
  accountName: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: USER })
  beneficiaryUser?: UserDocument | string;

  @Prop({
    type: SchemaTypes.String,
    enum: Object.values(BenefiaryType),
    default: BenefiaryType.BankAccount,
  })
  type: BenefiaryType;
}

export const BenefiarySchema = SchemaFactory.createForClass(Benefiary);
