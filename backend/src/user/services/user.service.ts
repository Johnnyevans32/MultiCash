import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model } from "mongoose";
import { createHash, randomBytes } from "crypto";
import * as moment from "moment";

import {
  CreateUserDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO,
  UpdatePasswordDTO,
  UpdateUserDTO,
} from "@/user/dtos/user.dto";
import { UserDocument } from "@/user/schemas/user.schema";
import { USER } from "@/core/constants/schema.constants";
import { EmailService } from "@/notification/email/email.service";
import { UtilityService } from "@/core/services/util.service";

@Injectable()
export class UserService {
  constructor(
    @InjectModel(USER)
    private userModel: Model<UserDocument>,
    private emailService: EmailService
  ) {}

  async me(user: UserDocument) {
    return this.userModel
      .findById(user.id)
      .select("name email did profileImageUrl");
  }

  async signup(payload: CreateUserDTO) {
    await this.checkIfUserAlreadyExist(payload.email);
    const user = await this.userModel.create(payload);
  }

  async checkIfUserAlreadyExist(email: string) {
    const user = await this.findUser({ email, isDeleted: false });
    if (user) {
      throw new BadRequestException("user already exist");
    }
  }
  async getUserByDid(did: string) {
    return this.findUser({ did });
  }

  async findUser(query: FilterQuery<UserDocument>, includeDeleted?: boolean) {
    return this.userModel.findOne({
      ...query,
      ...(!includeDeleted && { isDeleted: false }),
    });
  }

  async forgotPassword(payload: ForgotPasswordDTO) {
    const user = await this.findUser({ email: payload.email });
    if (user) {
      const resetToken = randomBytes(32).toString("hex");
      user.resetPasswordToken = createHash("sha256")
        .update(resetToken)
        .digest("hex");
      user.resetPasswordTokenExpires = moment().add(10, "minutes").toDate();
      this.emailService.sendResetPasswordLink(user, resetToken);
      await user.save();
    }
  }

  async resetPassword(payload: ResetPasswordDTO) {
    const hashedToken = createHash("sha256")
      .update(payload.token)
      .digest("hex");

    const user = await this.findUser({
      resetPasswordToken: hashedToken,
      resetPasswordTokenExpires: { $gt: moment().toDate() },
    });

    if (!user) {
      throw new BadRequestException("invalid or expired token");
    }

    user.password = payload.newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpires = undefined;
    await user.save();
  }

  async onModuleInit() {
    const user = await this.userModel.findById("66d8494c9b98b0eca006d8b8");
    await this.emailService.sendWalletFundingNotification(
      user,
      100000,
      2000000,
      "NGN"
    );
  }

  async updatePassword(user: UserDocument, payload: UpdatePasswordDTO) {
    const isMatch = await UtilityService.verifyPassword(
      payload.oldPassword,
      user.password
    );

    if (!isMatch) {
      throw new BadRequestException("invalid request");
    }

    user.password = payload.newPassword;
    await user.save();

    // TODO: send an email user password been changed
  }

  async updateUser(user: UserDocument, payload: UpdateUserDTO) {
    await this.userModel.findOneAndUpdate({ _id: user.id }, { $set: payload });
  }

  async deleteUser(user: UserDocument) {
    await this.userModel.findOneAndUpdate(
      { _id: user.id },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );
  }
}
