import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from "class-validator";

import { SupportedCurrencyEnum } from "@/wallet/schemas/wallet.schema";
import { RevenueSource } from "../schemas/revenue.schema";

export class CreateRevenueDTO {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  reference: string;

  @IsEnum(SupportedCurrencyEnum)
  currency: SupportedCurrencyEnum;

  @IsEnum(RevenueSource)
  source: RevenueSource;

  @IsOptional()
  meta: any;
}
