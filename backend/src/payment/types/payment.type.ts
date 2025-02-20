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
import {
  AccountType,
  RecipientAddress,
  RecipientType,
} from "@/wallet/schemas/beneficiary.schema";

export interface IPaymentProvider {
  name(): PaymentProvider;

  createVirtualAccount(
    payload: CreateVirtualAccountDTO
  ): Promise<ICreateVirtualAccountResponse>;

  /**
   * For verifying account details
   */
  verifyAccountNumber(
    payload: VerifyAccountNumbertDTO
  ): Promise<IVerifyAccountNumberResponse | void>;
  checkTransferStatus(
    payload: CheckTransferStatusDTO
  ): Promise<ICheckTransferStatusResponse>;
  /**
   * Transfer funds to a recipient account.
   */
  transferToAccount(
    payload: TransferToAccountDTO
  ): Promise<ITransferToAccountResponse>;

  createCheckoutSession?(payload: CreatePaymentIntentDTO): Promise<{
    sessionId: string;
  }>;

  /**
   * Handle webhook validation by verifying the signature.
   */
  validateWebhook(headers: any, payload: any, rawBody?: any): boolean;
  /**
   * Transform the webhook payload into a common format for handling
   * different events (transfers, charges, etc.)
   */
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

  @IsOptional()
  stripeAccountId?: string;

  @IsOptional()
  bankCode?: string;

  @IsEnum(RecipientType)
  recipientType?: RecipientType;

  @IsEnum(AccountType)
  accountType?: AccountType;

  @IsOptional()
  address?: RecipientAddress;
}

export class VerifyAccountNumbertDTO {
  @IsOptional()
  bank: BankDocument;

  @IsString()
  accountNumber: string;

  @IsOptional()
  @IsMongoId()
  bankId: string;

  @IsOptional()
  bankCode?: string;

  @IsOptional()
  @IsEnum(RecipientType)
  recipientType?: RecipientType;

  @IsOptional()
  @IsEnum(AccountType)
  accountType?: AccountType;

  @IsOptional()
  address?: RecipientAddress;

  @IsOptional()
  @IsString()
  accountName: string;

  @IsEnum(SupportedCurrencyEnum)
  currency: SupportedCurrencyEnum;
}

export class CheckTransferStatusDTO {
  @IsString()
  reference: string;

  @IsOptional()
  pspTransactionId?: string;
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
  pspTransactionId?: string;
}

export class CreatePaymentIntentDTO {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsEnum(SupportedCurrencyEnum)
  currency: SupportedCurrencyEnum;

  @IsOptional()
  meta: any;

  @IsOptional()
  email: string;

  @IsOptional()
  description: string;
}

export class CreateVirtualAccountDTO {
  @IsEnum(SupportedCurrencyEnum)
  currency: SupportedCurrencyEnum;

  @IsString()
  email: string;

  @IsString()
  name: string;

  @IsOptional()
  phoneNumber?: string;
}

export interface ICreateVirtualAccountResponse {
  providerResponse: any;
  bankName: string;
  accountName: string;
  accountNumber: string;
  currency: SupportedCurrencyEnum;
  provider: PaymentProvider;
  bankCode?: string;
  address?: any;
}
