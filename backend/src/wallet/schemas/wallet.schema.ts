import { Prop, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";

import { UserDocument } from "@/user/schemas/user.schema";
import { USER, WALLET_CURRENCY } from "@/core/constants/schema.constants";
import {
  BaseSchema,
  BaseSchemaDecorator,
} from "@/core/decorators/base-schema.decorator";
import { WalletCurrencyDocument } from "./wallet-currency.schema";

export enum SupportedCurrencyEnum {
  NGN = "NGN",
  GHS = "GHS",
  KES = "KES",
  USD = "USD",
  GBP = "GBP",
  EUR = "EUR",
  USDC = "USDC",
  BTC = "BTC",
  AUD = "AUD",
  MXN = "MXN",
  ZAR = "ZAR",
}

export type WalletDocument = HydratedDocument<Wallet>;

@BaseSchemaDecorator()
export class Wallet extends BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: USER })
  user: UserDocument | string;

  @Prop({
    type: SchemaTypes.String,
    enum: SupportedCurrencyEnum,
  })
  currency: SupportedCurrencyEnum;

  @Prop({ type: SchemaTypes.Number, default: 0 })
  availableBalance: number;

  @Prop({ type: SchemaTypes.Number, default: 0 })
  pendingBalance: number;

  walletCurrency?: WalletCurrencyDocument;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);

WalletSchema.virtual("walletCurrency", {
  localField: "currency",
  foreignField: "currency",
  ref: WALLET_CURRENCY,
  match: {
    isDeleted: false,
  },
  justOne: true,
});
