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
import { USER, USER_SESSION } from "@/core/constants/schema.constants";
import { EmailService } from "@/notification/email/email.service";
import { UtilityService } from "@/core/services/util.service";
import configuration from "@/core/services/configuration";
import { UserSessionDocument } from "../schemas/user-session.schema";

@Injectable()
export class UserService {
  constructor(
    @InjectModel(USER)
    private userModel: Model<UserDocument>,
    @InjectModel(USER_SESSION)
    private userSessionModel: Model<UserSessionDocument>,
    private emailService: EmailService
  ) {}

  async me(user: UserDocument) {
    return await this.userModel
      .findById(user.id)
      .select(
        "name email did profileImage country tag pushNotificationIsEnabled intercomHash"
      );
  }

  async signup(payload: CreateUserDTO) {
    await this.checkIfUserAlreadyExist(payload.email);
    const user = await this.userModel.create(payload);
    this.emailService.sendEmail(
      user,
      `Welcome to ${configuration().app.name}`,
      "welcome.njk",
      {
        loginLink: `${configuration().app.uiUrl}/signin`,
      }
    );
  }

  async findOrCreateUserSession(
    user: UserDocument,
    payload: { sessionClientId: string; deviceName: string; deviceIP: string }
  ) {
    const { sessionClientId, deviceName, deviceIP } = payload;
    const locationData = await UtilityService.getLocationFromIP(deviceIP);
    const session = await this.userSessionModel.findOneAndUpdate(
      { user: user.id, sessionClientId, isDeleted: false },
      {
        deviceName,
        deviceIP,
        location: UtilityService.formatLocationString(locationData),
      },
      { upsert: true, new: true }
    );

    return session;
  }

  async findSession(sessionId: string) {
    return await this.userSessionModel.findOne({
      _id: sessionId,
      isDeleted: false,
    });
  }

  async fetchUserSessions(user: UserDocument) {
    return await this.userSessionModel
      .find({ user: user.id, isDeleted: false })
      .sort({ lastActivity: -1 })
      .select("deviceName deviceIP lastActivity sessionClientId");
  }

  async logoutSession(user: UserDocument, sessionClientId: string) {
    await this.userSessionModel.findOneAndUpdate(
      { user: user.id, sessionClientId },
      { isDeleted: true }
    );
  }

  async userSessionPing(user: UserDocument, sessionClientId: string) {
    await this.userSessionModel.findOneAndUpdate(
      { user: user.id, sessionClientId },
      { lastActivity: new Date() }
    );
  }

  async checkIfTagExist(tag: string) {
    const user = await this.userModel.findOne({ tag, isDeleted: false });
    return !!user;
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
    user.resetPasswordToken = null;
    user.resetPasswordTokenExpires = null;
    user.jwtTokenVersion += 1;
    await user.save();

    this.emailService.sendEmail(user, "Password Reset", "password-update.njk");
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
    user.jwtTokenVersion += 1;
    await user.save();

    this.emailService.sendEmail(
      user,
      "Password Updated",
      "password-update.njk"
    );
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

  async updateUserTag(user: UserDocument, tag: string) {
    const tagAlreadyExist = await this.userModel.findOne({
      tag,
      isDeleted: false,
      _id: { $ne: user.id },
    });

    if (tagAlreadyExist) {
      throw new BadRequestException("tag already exist");
    }

    await this.userModel.updateOne({ _id: user.id }, { $set: { tag } });
  }

  async saveSessionFcmToken(
    user: UserDocument,
    payload: {
      fcmToken: string;
      sessionClientId: string;
    }
  ) {
    const { fcmToken, sessionClientId } = payload;
    await this.userSessionModel.findOneAndUpdate(
      {
        user: user.id,
        isDeleted: false,
        sessionClientId,
      },
      { fcmToken }
    );
  }
}
