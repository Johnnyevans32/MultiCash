import { REVENUE } from "@/core/constants/schema.constants";
import { Module } from "@nestjs/common";
import { RevenueSchema } from "./schemas/revenue.schema";
import { MongooseModule } from "@nestjs/mongoose";
import { RevenueService } from "./services/revenue.service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: REVENUE, schema: RevenueSchema }]),
  ],
  controllers: [],
  providers: [RevenueService],
  exports: [RevenueService],
})
export class RevenueModule {}
