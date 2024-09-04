import {
  BaseSchema,
  BaseSchemaDecorator,
} from "@/core/decorators/base-schema.decorator";
import { SupportedCurrencyEnum } from "@/wallet/schemas/wallet.schema";
import { Prop, SchemaFactory } from "@nestjs/mongoose";
import { SchemaTypes, HydratedDocument } from "mongoose";

export type BankDocument = HydratedDocument<Bank>;

@BaseSchemaDecorator()
export class Bank extends BaseSchema {
  @Prop({ enum: Object.values(SupportedCurrencyEnum) })
  currency: SupportedCurrencyEnum;

  @Prop({
    type: SchemaTypes.String,
    required: true,
  })
  name: string;

  @Prop({
    type: SchemaTypes.String,
  })
  logo: string;

  @Prop({
    type: SchemaTypes.Map,
    of: String,
    required: true,
  })
  meta: Map<string, string>;
}

export const BankSchema = SchemaFactory.createForClass(Bank);
