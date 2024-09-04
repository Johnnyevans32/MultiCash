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
}

export const AVAILABLE_BALANCE = "availableBalance";
export const PENDING_BALANCE = "pendingBalance";

export class WithdrawFromWalletDTO {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  note: string;

  @IsMongoId()
  walletAccount: string;

  @IsString()
  password: string;
}

export class CreateWalletAccountDTO {
  @IsString()
  accountNumber: string;

  @IsString()
  accountName: string;

  @IsMongoId()
  bank: string;
}
