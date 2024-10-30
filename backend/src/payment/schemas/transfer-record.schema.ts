import { Prop, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";

import {
  BaseSchema,
  BaseSchemaDecorator,
} from "@/core/decorators/base-schema.decorator";
import { BankDocument } from "./bank.schema";
import { BANK } from "@/core/constants/schema.constants";
import { SupportedCurrencyEnum } from "@/wallet/schemas/wallet.schema";
import {
  RecipientType,
  AccountType,
  BeneficiaryAddress,
} from "@/wallet/schemas/beneficiary.schema";

export enum TransferPurpose {
  WALLET_WITHDRAWAL = "wallet_withdrawal",
  REVENUE_TRANSFER = "revenue_transfer",
}

export enum TransferStatus {
  Pending = "pending",
  Processing = "processing",
  Successful = "successful",
  Failed = "failed",
}

export enum PaymentProvider {
  Paystack = "paystack",
  Stripe = "stripe",
  BitPay = "bitpay",
  Wise = "wise",
}

export type TransferRecordDocument = HydratedDocument<TransferRecord>;

@BaseSchemaDecorator()
export class TransferRecord extends BaseSchema {
  @Prop({
    ref: BANK,
    type: SchemaTypes.ObjectId,
  })
  bank: BankDocument | string;

  @Prop({ type: SchemaTypes.String, required: true })
  accountNumber: string;

  @Prop({ type: SchemaTypes.String, required: true })
  accountName: string;

  @Prop({ type: SchemaTypes.String, required: true, unique: true })
  reference: string;

  @Prop({ type: SchemaTypes.String, unique: true })
  pspTransactionId?: string;

  @Prop({ type: SchemaTypes.Number, required: true })
  amount: number;

  @Prop({ type: SchemaTypes.String, required: true })
  description: string;

  @Prop({ enum: Object.values(SupportedCurrencyEnum), required: true })
  currency: SupportedCurrencyEnum;

  @Prop({
    type: SchemaTypes.String,
    enum: Object.values(TransferStatus),
    default: TransferStatus.Pending,
  })
  status: TransferStatus;

  @Prop({
    type: SchemaTypes.String,
    enum: Object.values(PaymentProvider),
  })
  paymentProvider: PaymentProvider;

  @Prop({ type: SchemaTypes.String, enum: Object.values(TransferPurpose) })
  purpose: TransferPurpose;

  @Prop({ type: SchemaTypes.Mixed })
  meta?: any;

  @Prop({ type: SchemaTypes.Mixed, default: [] })
  webhookResponse?: any[];

  @Prop({ type: SchemaTypes.Mixed, default: [] })
  providerResponse?: any[];

  @Prop({ type: SchemaTypes.String })
  bankCode?: string;

  @Prop({ type: SchemaTypes.String, enum: Object.values(RecipientType) })
  recipientType?: RecipientType;

  @Prop({ type: SchemaTypes.String, enum: Object.values(AccountType) })
  accountType?: AccountType;

  @Prop({ type: SchemaTypes.Mixed })
  address?: BeneficiaryAddress;
}

export const TransferRecordSchema =
  SchemaFactory.createForClass(TransferRecord);
