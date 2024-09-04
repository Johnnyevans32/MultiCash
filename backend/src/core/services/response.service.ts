import { Injectable } from "@nestjs/common";
import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from "class-validator";
import { get, isNil, isEmpty } from "lodash";

export interface ResponseObject<T> {
  code?: number;
  message?: string;
  data?: T;
  metadata?: PaginationMetaData;
}

export interface PaginationMetaData {
  page: number;
  perPage: number;
  total: number;
  previousPage: number;
  nextPage: number;
  pageCount: number;
}

export class PaginateDTO {
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit: number;

  @IsString()
  @IsOptional()
  search: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  all: boolean;
}

@Injectable()
export class ResponseService {
  static json<T>(
    res: any,
    statusOrError: number | Error,
    message?: string,
    data?: T,
    metadata?: PaginationMetaData,
    code?: number,
    directPayload?: T
  ): void {
    const error = statusOrError instanceof Error && statusOrError;

    const status = error
      ? get(error, "status", 400)
      : (statusOrError as number);

    const responseObj: ResponseObject<T> = {
      message: error ? message || error.message : message,
      ...(!isNil(data) && { data: data }),
      ...(!isNil(metadata) && { metadata }),
      ...(!isEmpty(code) && { code }),
    };

    if (error) {
      console.error(error.stack);
    }

    res
      .status(status)
      .send(!isEmpty(directPayload) ? directPayload : responseObj);
  }
}
