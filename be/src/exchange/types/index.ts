import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from "class-validator";
import { SupportedCurrencyEnum } from "@/wallet/schemas/wallet.schema";

export class GetOfferingsDTO {
  @IsEnum(SupportedCurrencyEnum)
  payinCurrency: SupportedCurrencyEnum;

  @IsEnum(SupportedCurrencyEnum)
  payoutCurrency: SupportedCurrencyEnum;
}

export class CreateOfferingDTO {
  @IsString()
  pfiOfferingId: string;
}

export class OfferingDTO extends CreateOfferingDTO {
  @IsString()
  @IsOptional()
  pfiName: string;

  @IsString()
  @IsOptional()
  pfiDid: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsNumber()
  @IsOptional()
  payoutUnitsPerPayinUnit: number;

  @IsEnum(SupportedCurrencyEnum)
  @IsOptional()
  payinCurrency: SupportedCurrencyEnum;

  @IsEnum(SupportedCurrencyEnum)
  @IsOptional()
  payoutCurrency: SupportedCurrencyEnum;

  @IsNumber()
  @IsOptional()
  fee: number;
}

export class CreateExchangeDTO {
  @IsNumber()
  @IsPositive()
  payinAmount: number;

  @IsArray()
  @ArrayMinSize(1)
  offerings: string[];
}
