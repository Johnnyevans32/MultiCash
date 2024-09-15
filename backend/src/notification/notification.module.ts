import { Module } from "@nestjs/common";
import { EmailService } from "@/notification/email/email.service";
import { FcmService } from "./fcm/fcm.service";

@Module({
  providers: [EmailService, FcmService],
  exports: [EmailService, FcmService],
})
export class NotificationModule {}
