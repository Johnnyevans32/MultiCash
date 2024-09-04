import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { WalletController } from "@/wallet/wallet.controller";
import { WalletService } from "@/wallet/services/wallet.service";
import { WalletSchema } from "@/wallet/schemas/wallet.schema";
import {
  WALLET,
  WALLET_CURRENCY,
  WALLET_TRANSACTION,
  WALLET_ACCOUNT,
} from "@/core/constants/schema.constants";
import { WalletTransactionSchema } from "@/wallet/schemas/wallet-transaction.schema";
import { WalletCurrencySchema } from "./schemas/wallet-currency.schema";
import { PaymentModule } from "@/payment/payment.module";
import { WalletAccountSchema } from "./schemas/wallet-account.schema";
import { RevenueModule } from "@/revenue/revenue.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: WALLET, schema: WalletSchema }]),
    MongooseModule.forFeature([
      { name: WALLET_TRANSACTION, schema: WalletTransactionSchema },
    ]),
    MongooseModule.forFeature([
      { name: WALLET_CURRENCY, schema: WalletCurrencySchema },
    ]),
    MongooseModule.forFeature([
      { name: WALLET_ACCOUNT, schema: WalletAccountSchema },
    ]),
    forwardRef(() => PaymentModule),
    RevenueModule,
  ],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
