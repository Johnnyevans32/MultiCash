import { configure, Environment } from "nunjucks";
import { join } from "path";
import * as moment from "moment";

import { Mail, Address } from "@/notification/email/types";
import { Injectable } from "@nestjs/common";
import { UserDocument } from "@/user/schemas/user.schema";
import { MailerService } from "@nestjs-modules/mailer";
import configuration from "@/core/services/configuration";

@Injectable()
export class EmailService {
  private engine: Environment;

  constructor(private mailerService: MailerService) {
    const path = join(__dirname, "../../../", "templates");
    this.engine = configure(path, { autoescape: true });
  }

  async sendResetPasswordLink(user: UserDocument, token: string) {
    const mail = new Mail();

    const to = new Address(user.email, user.name);
    mail.to = [to];

    mail.subject = "your reset password link is here!";

    const body = this.engine.render("reset-password.njk", {
      link: `${configuration().ui.url}/reset-password/${token}`,
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

  async sendWithdrawalNotification(
    user: UserDocument,
    amount: number,
    currency: string
  ) {
    const mail = new Mail();

    const to = new Address(user.email, user.name);
    mail.to = [to];

    mail.subject = "Withdrawal Confirmation";

    const body = this.engine.render("wallet-withdrawal-success.njk", {
      amount: this.formatMoney(amount, currency),
      user,
      year: moment().format("YYYY"),
      currency,
    });
    mail.body = body;

    await this.mailerService.sendMail({
      to: mail.to.map(({ email, name }) => ({ address: email, name })),
      subject: mail.subject,
      html: mail.body,
    });
  }

  async sendWalletFundingNotification(
    user: UserDocument,
    amount: number,
    balance: number,
    currency: string
  ) {
    const mail = new Mail();

    const to = new Address(user.email, user.name);
    mail.to = [to];

    mail.subject = "Wallet Funding Confirmation";

    const body = this.engine.render("wallet-funding-success.njk", {
      amount: this.formatMoney(amount, currency),
      balance: this.formatMoney(balance, currency),
      user,
      subject: mail.subject,
      year: moment().format("YYYY"),
    });
    mail.body = body;

    await this.mailerService.sendMail({
      to: mail.to.map(({ email, name }) => ({ address: email, name })),
      subject: mail.subject,
      html: mail.body,
    });
  }

  formatMoney(amount: number, currency = "USD", locale = "en-US") {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  }
}
