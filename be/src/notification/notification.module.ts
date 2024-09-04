import { Module } from "@nestjs/common";
import { EmailService } from "@/notification/email/email.service";

@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class NotificationModule {}
