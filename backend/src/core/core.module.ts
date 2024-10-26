import { Module } from "@nestjs/common";
import { UtilityService } from "./services/util.service";

@Module({
  imports: [],
  providers: [UtilityService],
  controllers: [],
  exports: [UtilityService],
})
export class CoreModule {}
