import { Prop, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";

import {
  BaseSchema,
  BaseSchemaDecorator,
} from "@/core/decorators/base-schema.decorator";
import { SupportedCurrencyEnum } from "./wallet.schema";

export type WalletCurrencyDocument = HydratedDocument<WalletCurrency>;

@BaseSchemaDecorator()
export class WalletCurrency extends BaseSchema {
  @Prop({ type: SchemaTypes.String })
  name: string;

  @Prop({
    type: SchemaTypes.String,
    enum: SupportedCurrencyEnum,
    unique: true,
  })
  currency: SupportedCurrencyEnum;

  @Prop({ type: SchemaTypes.String })
  logo: string;

  @Prop({ type: SchemaTypes.Number, default: 0 })
  exchangePercentageFee: number;

  @Prop({ type: SchemaTypes.Number, default: 0 })
  maxExchangeFee: number;

  @Prop({ type: SchemaTypes.Number, default: 0 })
  minExchangeFee: number;

  @Prop({ type: SchemaTypes.Number, default: 0 })
  transferFee: number;

  @Prop({ type: SchemaTypes.Boolean, default: false })
  withdrawalEnabled: boolean;

  @Prop({ type: SchemaTypes.Boolean, default: false })
  fundingEnabled: boolean;
}

export const WalletCurrencySchema =
  SchemaFactory.createForClass(WalletCurrency);
