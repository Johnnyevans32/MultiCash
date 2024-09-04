import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import {
  BANK,
  CHARGE_RECORD,
  TRANSFER_RECORD,
} from "@/core/constants/schema.constants";
import { BankSchema } from "./schemas/bank.schema";
import { TransferRecordSchema } from "./schemas/transfer-record.schema";
import { PaymentService } from "./services/payment.service";
import { PaystackService } from "./providers/paystack/paystack.service";
import { PaymentController } from "./payment.controller";
import { WalletModule } from "@/wallet/wallet.module";
import { ChargeRecordSchema } from "./schemas/charge-record.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TRANSFER_RECORD, schema: TransferRecordSchema },
    ]),
    MongooseModule.forFeature([{ name: BANK, schema: BankSchema }]),
    MongooseModule.forFeature([
      { name: CHARGE_RECORD, schema: ChargeRecordSchema },
    ]),
    forwardRef(() => WalletModule),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, PaystackService],
  exports: [PaymentService],
})
export class PaymentModule {}
