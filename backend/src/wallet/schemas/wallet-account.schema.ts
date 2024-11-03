import { Prop, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";

import { UserDocument } from "@/user/schemas/user.schema";
import { USER } from "@/core/constants/schema.constants";
import {
  BaseSchema,
  BaseSchemaDecorator,
} from "@/core/decorators/base-schema.decorator";
import { SupportedCurrencyEnum } from "./wallet.schema";
import { RecipientAddress } from "./beneficiary.schema";
import { PaymentProvider } from "@/payment/schemas/transfer-record.schema";

export type WalletAccountDocument = HydratedDocument<WalletAccount>;

@BaseSchemaDecorator()
export class WalletAccount extends BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: USER, required: true })
  user: UserDocument | string;

  @Prop({ type: SchemaTypes.String })
  bankName: string;

  @Prop({ type: SchemaTypes.String })
  accountName: string;

  @Prop({ type: SchemaTypes.String })
  accountNumber: string;

  @Prop({ type: SchemaTypes.String })
  bankCode?: string;

  @Prop({ type: SchemaTypes.Mixed })
  address?: RecipientAddress;

  @Prop({
    type: SchemaTypes.String,
    enum: Object.values(PaymentProvider),
  })
  provider: PaymentProvider;

  @Prop({
    type: SchemaTypes.String,
    enum: Object.values(SupportedCurrencyEnum),
  })
  currency?: SupportedCurrencyEnum;

  @Prop({ type: SchemaTypes.Mixed })
  providerResponse?: any;

  @Prop({ type: SchemaTypes.String })
  providerCustomerId?: string;
}

export const WalletAccountSchema = SchemaFactory.createForClass(WalletAccount);
