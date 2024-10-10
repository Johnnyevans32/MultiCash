import { Prop, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";

import {
  BaseSchema,
  BaseSchemaDecorator,
} from "@/core/decorators/base-schema.decorator";
import { OFFERING, USER } from "@/core/constants/schema.constants";
import { UserDocument } from "@/user/schemas/user.schema";
import { OfferingDocument, OfferingStatus } from "./offering.schema";
import { SupportedCurrencyEnum } from "@/wallet/schemas/wallet.schema";

export enum ExchangeStatus {
  Pending = "pending",
  Processing = "processing",
  Completed = "completed",
  Cancelled = "cancelled",
  PartiallyCompleted = "partially_completed",
}
export type ExchangeDocument = HydratedDocument<Exchange>;

@BaseSchemaDecorator()
export class Exchange extends BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: USER })
  user: UserDocument | string;

  @Prop({ type: SchemaTypes.Number, required: true })
  payinAmount: number;
  @Prop({ type: SchemaTypes.Number })
  totalPayinAmount: number;
  @Prop({ type: SchemaTypes.Number, required: true })
  payoutAmount: number;

  @Prop({ enum: Object.values(SupportedCurrencyEnum), required: true })
  payinCurrency: SupportedCurrencyEnum;
  @Prop({ enum: Object.values(SupportedCurrencyEnum), required: true })
  payoutCurrency: SupportedCurrencyEnum;

  @Prop({ type: SchemaTypes.Number, required: true })
  payoutUnitsPerPayinUnit: number;

  @Prop({ type: SchemaTypes.Number, required: true })
  platformFee: number;
  @Prop({ type: SchemaTypes.Number, required: true })
  providerFee: number;
  @Prop({ type: SchemaTypes.Number, required: true })
  totalFee: number;

  @Prop({
    enum: Object.values(ExchangeStatus),
    default: ExchangeStatus.Pending,
  })
  status: ExchangeStatus;

  @Prop({ type: SchemaTypes.Number, max: 5, min: 1 })
  rating?: number;
  @Prop({ type: SchemaTypes.String })
  comment?: string;

  @Prop({ type: SchemaTypes.Date })
  completionDate?: Date;

  offeringToBeProcessed?: OfferingDocument;
  offerings?: OfferingDocument[];
}

export const ExchangeSchema = SchemaFactory.createForClass(Exchange);

ExchangeSchema.virtual("offeringToBeProcessed", {
  localField: "_id",
  foreignField: "exchange",
  ref: OFFERING,
  match: {
    isDeleted: false,
    status: { $nin: [OfferingStatus.Completed] },
  },
  justOne: true,
});

ExchangeSchema.virtual("offerings", {
  localField: "_id",
  foreignField: "exchange",
  ref: OFFERING,
  match: {
    isDeleted: false,
  },
});
