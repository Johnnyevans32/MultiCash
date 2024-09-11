import { configure, Environment } from "nunjucks";
import { join } from "path";
import * as moment from "moment";

import { Mail, Address } from "@/notification/email/types";
import { Injectable } from "@nestjs/common";
import { UserDocument } from "@/user/schemas/user.schema";
import { MailerService } from "@nestjs-modules/mailer";
import configuration from "@/core/services/configuration";
import { UtilityService } from "@/core/services/util.service";

@Injectable()
export class EmailService {
  private engine: Environment;

  constructor(private mailerService: MailerService) {
    const path = join(__dirname, "../../../", "templates");
    this.engine = configure(path, { autoescape: true });
  }

  async sendEmail(
    user: UserDocument,
    subject: string,
    template: string,
    context: Record<string, any> = {}
  ) {
    const mail = new Mail();
    const to = new Address(user.email, user.name);
    mail.to = [to];
    mail.subject = subject;

    const body = this.engine.render(template, {
      ...context,
      user,
      year: moment().format("YYYY"),
    });
    mail.body = body;

    await this.mailerService.sendMail({
      to: mail.to.map(({ email, name }) => ({ address: email, name })),
      subject: mail.subject,
      html: mail.body,
    });
  }

  async sendResetPasswordLink(user: UserDocument, token: string) {
    const context = {
      link: `${configuration().app.uiUrl}/reset-password/${token}`,
    };
    await this.sendEmail(
      user,
      "Your Reset Password Link is Here!",
      "reset-password.njk",
      context
    );
  }

  async sendWithdrawalNotification(
    user: UserDocument,
    amount: number,
    currency: string
  ) {
    const context = {
      amount: UtilityService.formatMoney(amount, currency),
      currency,
    };
    await this.sendEmail(
      user,
      "Withdrawal Confirmation",
      "wallet-withdrawal-success.njk",
      context
    );
  }

  async sendWalletFundingNotification(
    user: UserDocument,
    amount: number,
    currency: string
  ) {
    const context = {
      amount: UtilityService.formatMoney(amount, currency),
    };
    await this.sendEmail(
      user,
      "Wallet Funding Confirmation",
      "wallet-funding-success.njk",
      context
    );
  }

  async sendCompletedExchangeNotification(
    user: UserDocument,
    fromAmount: number,
    fromCurrency: string,
    toAmount: number,
    toCurrency: string
  ) {
    const context = {
      fromAmount: UtilityService.formatMoney(fromAmount, fromCurrency),
      toAmount: UtilityService.formatMoney(toAmount, toCurrency),
    };
    await this.sendEmail(
      user,
      "Currency Exchange Completed",
      "exchange-completed.njk",
      context
    );
  }
}
