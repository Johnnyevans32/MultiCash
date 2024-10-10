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
import { SupportedCountry } from "@/user/schemas/user.schema";
import { Transform } from "class-transformer";

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

export class ExchangeRequestDTO {
  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => parseFloat(value))
  payinAmount: number;

  @IsArray()
  @ArrayMinSize(1)
  @Transform(({ value }) => {
    if (typeof value === "string") {
      return [value];
    }
    return value;
  })
  offerings: string[];
}

export class UserKycInfoDTO {
  @IsString({ message: "user name is required" })
  name: string;

  @IsEnum(SupportedCountry, { message: "user country is required" })
  country: SupportedCountry;

  @IsString({ message: "user did is required" })
  did: string;
}
