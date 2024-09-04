import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { OFFERING, PFI, EXCHANGE } from "@/core/constants/schema.constants";
import { PfiSchema } from "./schemas/pfi.schema";
import { ExchangeController } from "./exchange.controller";
import { ExchangeService } from "./services/exchange.service";
import { OfferingSchema } from "./schemas/offering.schema";
import { WalletModule } from "@/wallet/wallet.module";
import { ExchangeSchema } from "./schemas/exchange.schema";
import { RevenueModule } from "@/revenue/revenue.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PFI, schema: PfiSchema }]),
    MongooseModule.forFeature([{ name: EXCHANGE, schema: ExchangeSchema }]),
    MongooseModule.forFeature([{ name: OFFERING, schema: OfferingSchema }]),
    WalletModule,
    RevenueModule,
  ],
  controllers: [ExchangeController],
  providers: [ExchangeService],
  exports: [],
})
export class ExchangeModule {}
