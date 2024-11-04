import { Prop, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";

import { UserDocument } from "@/user/schemas/user.schema";
import { BANK, USER } from "@/core/constants/schema.constants";
import {
  BaseSchema,
  BaseSchemaDecorator,
} from "@/core/decorators/base-schema.decorator";
import { BankDocument } from "@/payment/schemas/bank.schema";
import { SupportedCurrencyEnum } from "./wallet.schema";

export type BeneficiaryDocument = HydratedDocument<Beneficiary>;

export enum BeneficiaryType {
  BankAccount = "bank_account",
  Platform = "platform",
}

export enum RecipientType {
  Person = "person",
  Business = "business",
}

export enum AccountType {
  Savings = "savings",
  Checking = "checking",
}

export interface RecipientAddress {
  country: string;
  city: string;
  firstLine: string;
  postCode: string;
  state: string;
}
@BaseSchemaDecorator()
export class Beneficiary extends BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: USER, required: true })
  user: UserDocument | string;

  @Prop({ type: SchemaTypes.String })
  accountNumber: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: BANK })
  bank: BankDocument | string;

  @Prop({ type: SchemaTypes.String })
  accountName: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: USER })
  beneficiaryUser?: UserDocument | string;

  @Prop({
    type: SchemaTypes.String,
    enum: Object.values(BeneficiaryType),
    default: BeneficiaryType.BankAccount,
  })
  type: BeneficiaryType;

  @Prop({
    type: SchemaTypes.String,
    enum: Object.values(RecipientType),
  })
  recipientType: RecipientType;

  @Prop({ type: SchemaTypes.String })
  bankCode?: string;

  @Prop({
    type: SchemaTypes.String,
    enum: Object.values(AccountType),
  })
  accountType?: AccountType;

  @Prop({ type: SchemaTypes.Mixed })
  address?: RecipientAddress;

  @Prop({
    type: SchemaTypes.String,
    enum: Object.values(SupportedCurrencyEnum),
  })
  currency?: SupportedCurrencyEnum;
}

export const BeneficiarySchema = SchemaFactory.createForClass(Beneficiary);
