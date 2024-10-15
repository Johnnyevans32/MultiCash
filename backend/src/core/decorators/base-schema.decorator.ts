import { applyDecorators } from "@nestjs/common";
import { Prop, Schema, SchemaOptions } from "@nestjs/mongoose";
import { SchemaTypes } from "mongoose";

export const BaseSchemaDecorator = (options?: SchemaOptions): any =>
  applyDecorators(
    Schema({
      timestamps: true,
      toJSON: {
        virtuals: true,
        transform: (_doc: any, ret: any, _options: any): void => {
          ret.id = ret._id;
          delete ret._id;
          delete ret.__v;
          delete ret.isDeleted;
        },
      },
      toObject: {
        virtuals: true,
      },
      ...options,
    })
  );

@Schema()
export class BaseSchema {
  @Prop({ type: SchemaTypes.Boolean, default: false })
  isDeleted: boolean;

  @Prop({ type: SchemaTypes.Date })
  deletedAt?: Date;
}
