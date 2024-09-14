import { Prop, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";

import {
  BaseSchema,
  BaseSchemaDecorator,
} from "@/core/decorators/base-schema.decorator";
import { EXCHANGE, PFI, USER } from "@/core/constants/schema.constants";
import { UserDocument } from "@/user/schemas/user.schema";
import { PfiDocument } from "./pfi.schema";
import { SupportedCurrencyEnum } from "@/wallet/schemas/wallet.schema";
import { ExchangeDocument } from "./exchange.schema";

export enum OfferingStatus {
  Pending = "pending",
  Processing = "processing",
  AwaitingOrder = "awaiting_order",
  OrderPlaced = "order_placed",
  Cancelled = "cancelled",
  Completed = "completed",
}

export type OfferingDocument = HydratedDocument<Offering>;

@BaseSchemaDecorator()
export class Offering extends BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: USER })
  user: UserDocument | string;

  @Prop({ type: SchemaTypes.ObjectId, ref: EXCHANGE })
  exchange: ExchangeDocument | string;

  @Prop({ type: SchemaTypes.ObjectId, ref: PFI })
  pfi: PfiDocument | string;

  @Prop({ type: SchemaTypes.String, required: true })
  pfiOfferingId: string;

  @Prop({
    type: SchemaTypes.String,
    enum: OfferingStatus,
    default: OfferingStatus.Pending,
  })
  status: OfferingStatus;

  //optionals
  @Prop({ type: SchemaTypes.String })
  description: string;

  @Prop({ type: SchemaTypes.Number })
  payoutUnitsPerPayinUnit: number;

  @Prop({
    type: SchemaTypes.String,
    enum: SupportedCurrencyEnum,
  })
  payinCurrency: SupportedCurrencyEnum;
  @Prop({
    type: SchemaTypes.String,
    enum: SupportedCurrencyEnum,
  })
  payoutCurrency: SupportedCurrencyEnum;

  @Prop({ type: SchemaTypes.Number })
  expectedPayinAmount?: number;
  @Prop({ type: SchemaTypes.Number })
  expectedPayoutAmount?: number;

  @Prop({ type: SchemaTypes.Date })
  transactionStartDate?: Date;
  @Prop({ type: SchemaTypes.Date })
  transactionEndDate?: Date;

  @Prop({ type: SchemaTypes.Number })
  orderCompletionAmount?: number;

  @Prop({ type: SchemaTypes.String })
  pfiExchangeId?: string;

  @Prop({ type: SchemaTypes.Number })
  pfiFee?: number;
  @Prop({ type: SchemaTypes.Date })
  pfiQuoteExpiresAt?: Date;

  @Prop({ type: SchemaTypes.String })
  pfiOrderStatus?: string;

  @Prop({ type: SchemaTypes.String })
  cancellationReason?: string;
}

export const OfferingSchema = SchemaFactory.createForClass(Offering);
