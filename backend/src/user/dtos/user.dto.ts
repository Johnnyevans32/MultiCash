import { Transform } from "class-transformer";
import {
  IsOptional,
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  Matches,
} from "class-validator";

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
  @Transform(({ value }) => value.trim().toLowerCase())
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
}

export class ResetPasswordDTO {
  @IsString()
  readonly token: string;

  @IsString()
  @Transform(({ value }) => value.trim().toLowerCase())
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
  @Transform(({ value }) => value.trim().toLowerCase())
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
  readonly profileImageUrl: string;

  @IsOptional()
  @IsString()
  readonly did: string;
}

export class ForgotPasswordDTO {
  @IsEmail()
  @Transform(({ value }) => value.trim().toLowerCase())
  readonly email: string;
}
