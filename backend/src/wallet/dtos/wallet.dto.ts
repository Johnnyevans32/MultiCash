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
import { TransactionPurpose } from "../schemas/wallet-transaction.schema";
import { BenefiaryType } from "../schemas/benefiary.schema";

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
  benefiary: string;

  @IsString()
  password: string;
}

export class CreateBenefiaryDTO {
  @IsOptional()
  @IsString()
  accountNumber: string;

  @IsOptional()
  @IsString()
  accountName: string;

  @IsOptional()
  @IsMongoId()
  bank: string;

  @IsEnum(BenefiaryType)
  benefiaryType: BenefiaryType;

  @IsOptional()
  @IsString()
  benefiaryTag: string;
}
