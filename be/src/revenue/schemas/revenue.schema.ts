import { Prop, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";

import {
  BaseSchema,
  BaseSchemaDecorator,
} from "@/core/decorators/base-schema.decorator";
import { SupportedCurrencyEnum } from "@/wallet/schemas/wallet.schema";

export enum RevenueSource {
  CURRENCY_EXCHANGE = "currency_exchange",
  WALLET_WITHDRAWAL = "wallet_withdrawal",
}

export enum RevenueTransferStatus {
  Pending = "pending",
  Processing = "processing",
  Successful = "successful",
}

export type RevenueDocument = HydratedDocument<Revenue>;

@BaseSchemaDecorator()
export class Revenue extends BaseSchema {
  @Prop({ type: SchemaTypes.String, required: true, unique: true })
  reference: string;

  @Prop({ type: SchemaTypes.Number, required: true })
  amount: number;

  @Prop({ enum: Object.values(SupportedCurrencyEnum), required: true })
  currency: SupportedCurrencyEnum;

  @Prop({
    type: SchemaTypes.String,
    enum: Object.values(RevenueTransferStatus),
    default: RevenueTransferStatus.Pending,
  })
  status: RevenueTransferStatus;

  @Prop({ type: SchemaTypes.String, enum: Object.values(RevenueSource) })
  source: RevenueSource;

  @Prop({ type: SchemaTypes.Mixed })
  meta?: any;
}

export const RevenueSchema = SchemaFactory.createForClass(Revenue);
