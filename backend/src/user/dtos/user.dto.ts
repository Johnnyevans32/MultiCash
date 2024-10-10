import { Transform } from "class-transformer";
import {
  IsOptional,
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  Matches,
  IsEnum,
  Length,
  IsBoolean,
} from "class-validator";
import { SupportedCountry } from "../schemas/user.schema";

export class CreateUserDTO {
  @IsOptional()
  @IsString()
  readonly did: string;

  @IsString()
  @Transform(({ value }) => value.trim())
  readonly name: string;

  @IsEmail()
  @Transform(({ value }) => value.trim().toLowerCase())
  readonly email: string;

  @IsString()
  @Transform(({ value }) => value.trim())
  @MinLength(5, { message: "Password must be at least 5 characters long" })
  @MaxLength(32, { message: "Password cannot exceed 32 characters" })
  @Matches(/(?=.*[A-Z])/, {
    message: "Password must contain at least one uppercase letter",
  })
  @Matches(/(?=.*[a-z])/, {
    message: "Password must contain at least one lowercase letter",
  })
  @Matches(/(?=.*[0-9])/, {
    message: "Password must contain at least one number",
  })
  readonly password: string;

  @IsEnum(SupportedCountry)
  readonly country: SupportedCountry;
}

export class ResetPasswordDTO {
  @IsString()
  readonly token: string;

  @IsString()
  @Transform(({ value }) => value.trim())
  @MinLength(5, { message: "Password must be at least 5 characters long" })
  @MaxLength(32, { message: "Password cannot exceed 32 characters" })
  @Matches(/(?=.*[A-Z])/, {
    message: "Password must contain at least one uppercase letter",
  })
  @Matches(/(?=.*[a-z])/, {
    message: "Password must contain at least one lowercase letter",
  })
  @Matches(/(?=.*[0-9])/, {
    message: "Password must contain at least one number",
  })
  readonly newPassword: string;
}

export class UpdatePasswordDTO {
  @IsString()
  readonly oldPassword: string;

  @IsString()
  @Transform(({ value }) => value.trim())
  @MinLength(5, { message: "Password must be at least 5 characters long" })
  @MaxLength(32, { message: "Password cannot exceed 32 characters" })
  @Matches(/(?=.*[A-Z])/, {
    message: "Password must contain at least one uppercase letter",
  })
  @Matches(/(?=.*[a-z])/, {
    message: "Password must contain at least one lowercase letter",
  })
  @Matches(/(?=.*[0-9])/, {
    message: "Password must contain at least one number",
  })
  readonly newPassword: string;
}

export class UpdateUserDTO {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  readonly name: string;

  @IsOptional()
  @IsString()
  readonly profileImage: string;

  @IsOptional()
  @IsString()
  readonly did: string;

  @IsOptional()
  @IsBoolean()
  pushNotificationIsEnabled: boolean;
}

export class ForgotPasswordDTO {
  @IsEmail()
  @Transform(({ value }) => value.trim().toLowerCase())
  readonly email: string;
}

export class UpdateUserTagDTO {
  @Transform(({ value }) => value.trim().toLowerCase())
  @IsString({ message: "Tag must be a string" })
  @Length(3, 30, { message: "Tag length must be between 3 and 30 characters" })
  @Matches(/^[a-z0-9-_]+$/, {
    message:
      "Tag can only contain lowercase letters, numbers, hyphens, and underscores",
  })
  readonly tag: string;
}
