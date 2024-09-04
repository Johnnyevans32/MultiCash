import { Prop, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";

import {
  BaseSchema,
  BaseSchemaDecorator,
} from "@/core/decorators/base-schema.decorator";
import { SupportedCurrencyEnum } from "@/wallet/schemas/wallet.schema";
import { TransferStatus, PaymentProvider } from "./transfer-record.schema";

export type ChargeRecordDocument = HydratedDocument<ChargeRecord>;

@BaseSchemaDecorator()
export class ChargeRecord extends BaseSchema {
  @Prop({
    type: SchemaTypes.String,
    required: true,
    unique: true,
  })
  reference: string;

  @Prop({
    type: SchemaTypes.String,
    enum: Object.values(TransferStatus),
    default: TransferStatus.Pending,
  })
  status: TransferStatus;

  @Prop({
    type: SchemaTypes.String,
  })
  channel: string;

  @Prop({
    type: SchemaTypes.Number,
    required: true,
  })
  amount: number;

  @Prop({
    type: SchemaTypes.String,
    required: true,
  })
  paymentProvider: PaymentProvider;

  @Prop({
    type: SchemaTypes.String,
    enum: Object.values(SupportedCurrencyEnum),
  })
  currency: SupportedCurrencyEnum;

  @Prop({
    type: SchemaTypes.Mixed,
    default: [],
  })
  webhookResponse: any[];

  @Prop({
    type: SchemaTypes.Mixed,
  })
  meta?: any;
}

export const ChargeRecordSchema = SchemaFactory.createForClass(ChargeRecord);
