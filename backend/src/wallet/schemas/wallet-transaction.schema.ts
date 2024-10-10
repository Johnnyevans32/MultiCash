import { Prop, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";

import { USER, WALLET } from "@/core/constants/schema.constants";
import {
  BaseSchema,
  BaseSchemaDecorator,
} from "@/core/decorators/base-schema.decorator";
import {
  SupportedCurrencyEnum,
  Wallet,
  WalletDocument,
} from "@/wallet/schemas/wallet.schema";
import { UserDocument } from "@/user/schemas/user.schema";

export enum TransactionType {
  CREDIT = "credit",
  DEBIT = "debit",
}

export enum TransactionPurpose {
  CURRENCY_EXCHANGE = "currency_exchange",
  WITHDRAWAL = "withdrawal",
  DEPOSIT = "deposit",
  TRANSFER_CREDIT = "transfer_credit",
  TRANSFER_DEBIT = "transfer_debit",
  PENDING_CURRENCY_EXCHANGE_CREDIT = "pending_currency_exchange_credit",
  PENDING_CURRENCY_EXCHANGE_DEBIT = "pending_currency_exchange_debit",
  REFUND = "refund",
}

export enum TransactionStatus {
  Pending = "pending",
  Processing = "processing",
  Successful = "successful",
  Failed = "failed",
}

export type WalletTransactionDocument = HydratedDocument<WalletTransaction>;

@BaseSchemaDecorator()
export class WalletTransaction extends BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: WALLET })
  wallet: WalletDocument | string;

  @Prop({ type: SchemaTypes.ObjectId, ref: USER })
  user: UserDocument | string;

  @Prop({ type: SchemaTypes.ObjectId, ref: USER })
  receiver?: UserDocument | string;

  @Prop({ type: SchemaTypes.ObjectId, ref: USER })
  sender?: UserDocument | string;

  @Prop({ type: SchemaTypes.String })
  reference: string;

  @Prop({ type: SchemaTypes.Number })
  amount: number;

  @Prop({ type: SchemaTypes.String })
  description: string;

  @Prop({ type: SchemaTypes.String, enum: Object.values(TransactionType) })
  type: TransactionType;

  @Prop({ type: SchemaTypes.String, enum: Object.values(TransactionPurpose) })
  purpose: TransactionPurpose;

  @Prop({
    type: SchemaTypes.String,
    enum: Object.values(SupportedCurrencyEnum),
  })
  currency: SupportedCurrencyEnum;

  @Prop({ type: SchemaTypes.Number, default: 0 })
  fee: number;

  @Prop({
    type: SchemaTypes.Mixed,
    required: true,
  })
  walletStateAfter: Wallet;

  @Prop({
    type: SchemaTypes.Mixed,
    required: true,
  })
  walletStateBefore: Wallet;

  @Prop({ type: SchemaTypes.Mixed })
  meta?: any;

  @Prop({ type: SchemaTypes.String })
  note?: string;

  @Prop({
    type: SchemaTypes.String,
    enum: Object.values(TransactionStatus),
    default: TransactionStatus.Successful,
  })
  status: TransactionStatus;
}

export const WalletTransactionSchema =
  SchemaFactory.createForClass(WalletTransaction);
