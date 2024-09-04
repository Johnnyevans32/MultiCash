import {
  IsEnum,
  IsMongoId,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
} from "class-validator";
import {
  PaymentProvider,
  TransferPurpose,
  TransferStatus,
} from "../schemas/transfer-record.schema";
import { SupportedCurrencyEnum } from "@/wallet/schemas/wallet.schema";
import { BankDocument } from "../schemas/bank.schema";

export interface IPaymentProvider {
  name(): PaymentProvider;
  verifyAccountNumber(
    payload: VerifyAccountNumbertDTO
  ): Promise<IVerifyAccountNumberResponse>;
  checkTransferStatus(
    payload: CheckTransferStatusDTO
  ): Promise<ICheckTransferStatusResponse>;
  transferToAccount(
    payload: TransferToAccountDTO
  ): Promise<ITransferToAccountResponse>;

  validateWebhook(headers: any, payload: any): boolean;
  transformWebhook(payload: any): IWebhookResponse<any>;
}

export enum WebhookEventEnum {
  TransferSuccess = "transfer.success",
  TransferFailed = "transfer.failure",

  ChargeSuccess = "charge.success",
  ChargeProcessing = "charge.processing",
  ChargeFailure = "charge.failure",
}

export interface IWebhookResponse<T> {
  event: WebhookEventEnum;
  data: T;
  provider: PaymentProvider;
  originalPayload?: unknown;
}

export interface IWebhookTransfer {
  status: TransferStatus;
  amount: number;
  meta: any;
  reference: string;
}

export interface IWebhookCharge {
  status: TransferStatus;
  amount: number;
  meta: any;
  reference: string;
  currency: SupportedCurrencyEnum;
  channel: string;
}

export class TransferToAccountDTO {
  @IsObject()
  bank: BankDocument;

  @IsString()
  accountNumber: string;

  @IsString()
  accountName: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsEnum(SupportedCurrencyEnum)
  currency: SupportedCurrencyEnum;

  @IsString()
  description: string;

  @IsEnum(TransferPurpose)
  purpose: TransferPurpose;

  @IsOptional()
  reference: string;

  @IsOptional()
  meta: any;
}

export class VerifyAccountNumbertDTO {
  @IsOptional()
  bank: BankDocument;

  @IsString()
  accountNumber: string;

  @IsMongoId()
  bankId: string;
}

export class CheckTransferStatusDTO {
  @IsString()
  reference: string;
}

export interface ICheckTransferStatusResponse {
  status: TransferStatus;
  providerResponse: any;
}

export interface IVerifyAccountNumberResponse {
  accountName: string;
  accountNumber: string;
}

export interface ITransferToAccountResponse {
  status: TransferStatus;
  providerResponse: any;
}
