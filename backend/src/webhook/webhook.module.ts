import { Module } from "@nestjs/common";

import { PaymentModule } from "@/payment/payment.module";
import { WebhookController } from "./webhook.controller";

@Module({
  imports: [PaymentModule],
  controllers: [WebhookController],
  providers: [],
})
export class WebhookModule {}
