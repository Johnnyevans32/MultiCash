import { Transform } from "class-transformer";
import { IsOptional, IsString, IsEmail } from "class-validator";

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
  readonly password: string;
}

export class ResetPasswordDTO {
  @IsString()
  readonly token: string;

  @IsString()
  readonly newPassword: string;
}

export class UpdatePasswordDTO {
  @IsString()
  readonly oldPassword: string;

  @IsString()
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
