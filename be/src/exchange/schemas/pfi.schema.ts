import { Prop, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes } from "mongoose";

import {
  BaseSchema,
  BaseSchemaDecorator,
} from "@/core/decorators/base-schema.decorator";

export type PfiDocument = HydratedDocument<Pfi>;

@BaseSchemaDecorator()
export class Pfi extends BaseSchema {
  @Prop({ type: SchemaTypes.String, required: true })
  did: string;

  @Prop({ type: SchemaTypes.String, required: true })
  name: string;
}

export const PfiSchema = SchemaFactory.createForClass(Pfi);
