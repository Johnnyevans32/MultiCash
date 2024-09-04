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

    console.log("sent");
  }
}
