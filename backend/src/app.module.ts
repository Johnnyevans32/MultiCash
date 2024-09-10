import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { MailerModule } from "@nestjs-modules/mailer";
import { CacheModule } from "@nestjs/cache-manager";
import { ScheduleModule } from "@nestjs/schedule";
import * as mongoosePaginate from "mongoose-paginate-v2";

import { UserModule } from "@/user/user.module";
import { WalletModule } from "@/wallet/wallet.module";
import { HealthModule } from "@/health/health.module";
import { CoreModule } from "@/core/core.module";
import { AuthModule } from "@/auth/auth.module";
import { NotificationModule } from "@/notification/notification.module";
import { JwtAuthGuard } from "./auth/guards/jwt.guard";
import { ExchangeModule } from "./exchange/exchange.module";
import { PaymentModule } from "./payment/payment.module";
import { WebhookModule } from "./webhook/webhook.module";
import configuration from "./core/services/configuration";
import { RevenueModule } from "./revenue/revenue.module";
import { FileModule } from "./file/file.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      cache: true,
    }),
    MailerModule.forRootAsync({
      useFactory: async () => ({
        transport: {
          host: configuration().mail.server,
          port: configuration().mail.port,
          ignoreTLS: true,
          secure: false,
          auth: {
            user: configuration().mail.username,
            pass: configuration().mail.password,
          },
        },
        defaults: {
          from: `${configuration().app.name} <${configuration().mail.username}>`,
        },
        preview: true,
      }),
    }),
    MongooseModule.forRoot(configuration().database.uri, {
      connectionFactory: (connection) => {
        connection.plugin(mongoosePaginate);
        return connection;
      },
    }),
    {
      module: CoreModule,
      global: true,
    },
    CacheModule.register({ isGlobal: true }),
    WalletModule,
    { module: UserModule, global: true },
    { module: NotificationModule, global: true },
    HealthModule,
    AuthModule,
    ExchangeModule,
    ScheduleModule.forRoot(),
    PaymentModule,
    WebhookModule,
    RevenueModule,
    FileModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
