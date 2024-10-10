import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsMongoId,
} from "class-validator";
import { SupportedCurrencyEnum } from "../schemas/wallet.schema";
import {
  TransactionPurpose,
  TransactionStatus,
} from "../schemas/wallet-transaction.schema";
import { BeneficiaryType } from "../schemas/beneficiary.schema";

export class CreateWalletTxnDTO {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  reference: string;

  @IsString()
  user: string;

  @IsString()
  description: string;

  @IsEnum(SupportedCurrencyEnum)
  currency: SupportedCurrencyEnum;

  @IsEnum(TransactionPurpose)
  purpose: TransactionPurpose;

  @IsArray()
  balanceKeys: string[];

  @IsOptional()
  meta?: any;

  @IsOptional()
  fee?: number;

  @IsOptional()
  note?: string;

  @IsOptional()
  sender?: string;

  @IsOptional()
  receiver?: string;

  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;
}

export const AVAILABLE_BALANCE = "availableBalance";
export const PENDING_BALANCE = "pendingBalance";

export class WithdrawFromWalletDTO {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsOptional()
  note?: string;

  @IsMongoId()
  beneficiary: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsEnum(SupportedCurrencyEnum)
  currency: SupportedCurrencyEnum;
}

export class CreateBeneficiaryDTO {
  @IsOptional()
  @IsString()
  accountNumber: string;

  @IsOptional()
  @IsString()
  accountName: string;

  @IsOptional()
  @IsMongoId()
  bank: string;

  @IsEnum(BeneficiaryType)
  beneficiaryType: BeneficiaryType;

  @IsOptional()
  @IsString()
  beneficiaryTag: string;
}
