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

export type WalletAccountDocument = HydratedDocument<WalletAccount>;

@BaseSchemaDecorator()
export class WalletAccount extends BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: USER })
  user: UserDocument | string;

  @Prop({ type: SchemaTypes.String })
  accountNumber: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: BANK })
  bank: BankDocument | string;

  @Prop({ type: SchemaTypes.ObjectId, ref: WALLET })
  wallet: WalletDocument | string;

  @Prop({ type: SchemaTypes.String })
  accountName: string;
}

export const WalletAccountSchema = SchemaFactory.createForClass(WalletAccount);
