import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Cron, CronExpression } from "@nestjs/schedule";

import {
  BANK,
  CHARGE_RECORD,
  TRANSFER_RECORD,
} from "@/core/constants/schema.constants";
import {
  PaymentProvider,
  TransferPurpose,
  TransferRecordDocument,
  TransferStatus,
} from "../schemas/transfer-record.schema";
import { BankDocument } from "../schemas/bank.schema";
import {
  TransferToAccountDTO,
  IPaymentProvider,
  IWebhookResponse,
  IWebhookTransfer,
  WebhookEventEnum,
  VerifyAccountNumbertDTO,
  IWebhookCharge,
  CreatePaymentIntentDTO,
} from "../types/payment.type";
import { SupportedCurrencyEnum } from "@/wallet/schemas/wallet.schema";
import { PaystackService } from "../providers/paystack/paystack.service";
import { ChargeRecordDocument } from "../schemas/charge-record.schema";
import { WalletService } from "@/wallet/services/wallet.service";
import { StripeService } from "../providers/stripe/stripe.service";
import { UserDocument } from "@/user/schemas/user.schema";

@Injectable()
export class PaymentService {
  private services = new Map<PaymentProvider, IPaymentProvider>();
  private currencyService = new Map<SupportedCurrencyEnum, IPaymentProvider>();

  constructor(
    @InjectModel(TRANSFER_RECORD)
    private transferRecordModel: Model<TransferRecordDocument>,
    @InjectModel(CHARGE_RECORD)
    private chargeRecordModel: Model<ChargeRecordDocument>,
    @InjectModel(BANK)
    private bankModel: Model<BankDocument>,
    private paystackService: PaystackService,
    private stripeService: StripeService,
    @Inject(forwardRef(() => WalletService))
    private walletService: WalletService
  ) {
    this._registerServices();
  }

  private _registerServices(): void {
    this.services.set(PaymentProvider.Paystack, this.paystackService);
    this.services.set(PaymentProvider.Stripe, this.stripeService);

    this.registerCurrencyService(
      SupportedCurrencyEnum.NGN,
      this.paystackService
    );
    this.registerCurrencyService(
      SupportedCurrencyEnum.KES,
      this.paystackService
    );
    this.registerCurrencyService(
      SupportedCurrencyEnum.GHS,
      this.paystackService
    );
    this.registerCurrencyService(
      SupportedCurrencyEnum.ZAR,
      this.paystackService
    );

    this.registerCurrencyService(SupportedCurrencyEnum.USD, this.stripeService);
    this.registerCurrencyService(SupportedCurrencyEnum.EUR, this.stripeService);
    this.registerCurrencyService(SupportedCurrencyEnum.GBP, this.stripeService);
    this.registerCurrencyService(SupportedCurrencyEnum.AUD, this.stripeService);
    this.registerCurrencyService(SupportedCurrencyEnum.MXN, this.stripeService);
  }

  private registerCurrencyService(
    currency: SupportedCurrencyEnum,
    service: IPaymentProvider
  ) {
    this.currencyService.set(currency, service);
  }

  private getCurrencyService(
    currency: SupportedCurrencyEnum
  ): IPaymentProvider {
    const service = this.currencyService.get(currency);
    if (!service) {
      throw new Error(`no payment service registered for ${currency}`);
    }
    return service;
  }

  private getService(paymentService: PaymentProvider): IPaymentProvider {
    const service = this.services.get(paymentService);
    if (!service) {
      throw new Error(`service with name ${paymentService} not registered.`);
    }
    return service;
  }

  async fetchBanks(currency?: string) {
    return this.bankModel
      .find({
        isDeleted: false,
        ...(currency && { currency }),
      })
      .select("name currency");
  }

  async fetchBankById(bankId: string) {
    return this.bankModel.findOne({ isDeleted: false, _id: bankId });
  }

  async verifyAccountNumber(payload: VerifyAccountNumbertDTO) {
    const { bankId } = payload;

    const bank = await this.bankModel.findOne({
      _id: bankId,
      isDeleted: false,
    });
    if (!bank) {
      throw new BadRequestException("invalid bank");
    }
    const service = this.getCurrencyService(bank.currency);

    return service.verifyAccountNumber({ ...payload, bank });
  }

  async transferToAccount(payload: TransferToAccountDTO) {
    const { currency, bank, reference, amount } = payload;
    const service = this.getCurrencyService(currency);

    let transferRecord = await this.transferRecordModel.findOne({
      reference: payload.reference,
      isDeleted: false,
      paymentProvider: service.name(),
    });

    if (transferRecord) {
      const { status, id } = transferRecord;

      if (status === TransferStatus.Successful) {
        return transferRecord;
      }

      if (
        [TransferStatus.Pending, TransferStatus.Processing].includes(status)
      ) {
        [transferRecord] = await this.checkTransferStatus([id]);
      } else if (status === TransferStatus.Failed) {
        [transferRecord] = await this.retryTransfer([id]);
      }

      return transferRecord;
    }

    transferRecord = await this.transferRecordModel.findOneAndUpdate(
      {
        reference,
        isDeleted: false,
        paymentProvider: service.name(),
      },
      {
        ...payload,
        bank: bank.id,
      },
      {
        upsert: true,
        new: true,
      }
    );
    try {
      const transferResponse = await service.transferToAccount({
        ...payload,
        bank,
        amount,
        reference,
      });

      transferRecord.status = transferResponse.status;
      transferRecord.providerResponse.push(transferResponse);
    } catch (error) {
      transferRecord.providerResponse.push(JSON.parse(JSON.stringify(error)));
      transferRecord.status = TransferStatus.Failed;
    } finally {
      transferRecord.markModified("providerResponse");
      await transferRecord.save();
    }
    if (
      [TransferStatus.Failed, TransferStatus.Successful].includes(
        transferRecord.status
      )
    ) {
      this.handleTransferHook({
        event:
          transferRecord.status === TransferStatus.Failed
            ? WebhookEventEnum.TransferFailed
            : WebhookEventEnum.TransferSuccess,
        data: {
          status: transferRecord.status,
          amount: transferRecord.amount,
          meta: transferRecord.meta,
          reference: transferRecord.reference,
        },
        provider: transferRecord.paymentProvider,
        originalPayload: {},
      });
    }

    return transferRecord;
  }

  async retryTransfer(ids = []) {
    const query = {
      ...(ids.length && { _id: { $in: ids } }),
      status: {
        $in: [TransferStatus.Failed],
      },
      isDeleted: false,
    };
    const failedTransfers = await this.transferRecordModel
      .find(query)
      .populate("bank");

    await Promise.all(
      failedTransfers.map(async (transferRecord) => {
        const {
          paymentProvider,
          amount,
          reference,
          currency,
          accountName,
          accountNumber,
          description,
          purpose,
          meta,
          bank,
        } = transferRecord;
        const service = this.getService(paymentProvider);
        const transferResponse = await service.transferToAccount({
          amount,
          reference,
          accountName,
          accountNumber,
          currency,
          description,
          meta,
          purpose,
          bank: bank as BankDocument,
        });

        transferRecord.status = transferResponse.status;
        await transferRecord.save();
      })
    );

    return failedTransfers;
  }

  async handleWebhook(
    payload: { event: any; headers: any; rawBody: any },
    paymentProvider: PaymentProvider
  ): Promise<any> {
    try {
      const service = this.services.get(paymentProvider);
      const isValidWebhook = service.validateWebhook(
        payload.headers,
        payload.event,
        payload.rawBody
      );
      if (!isValidWebhook) {
        throw new BadRequestException("webhook is invalid");
      }

      const transformedData = service.transformWebhook(payload.event);
      if (transformedData) {
        switch (transformedData.event) {
          case WebhookEventEnum.TransferFailed:
          case WebhookEventEnum.TransferSuccess:
            await this.handleTransferHook(transformedData);
            break;

          case WebhookEventEnum.ChargeSuccess:
            await this.handleChargeHook(transformedData);
            break;

          default:
            break;
        }
      }
    } catch (e) {
      console.log(e);
    }
  }

  async handleTransferHook(payload: IWebhookResponse<IWebhookTransfer>) {
    const { data, provider } = payload;
    const transferRecord = await this.transferRecordModel
      .findOne({
        reference: data.reference,
        paymentProvider: provider,
        isDeleted: false,
      })
      .sort({
        createdAt: -1,
      });
    if (!transferRecord) {
      throw new Error(`transfer record not found`);
    }

    transferRecord.webhookResponse.push(payload);
    transferRecord.status = data.status;
    transferRecord.markModified("webhookResponse");
    await transferRecord.save();

    switch (transferRecord.purpose) {
      case TransferPurpose.WALLET_WITHDRAWAL:
        this.walletService.handleTransferHook(payload);
        break;

      default:
        break;
    }
  }

  async handleChargeHook(payload: IWebhookResponse<IWebhookCharge>) {
    const {
      data: { amount, channel, currency, meta, reference, status },
      provider,
    } = payload;
    await this.chargeRecordModel.findOneAndUpdate(
      {
        reference,
        paymentProvider: provider,
        isDeleted: false,
      },
      {
        $set: { amount, channel, meta, status, currency },
        $push: { webhookResponse: payload },
      },
      { upsert: true, new: true }
    );

    await this.walletService.handleChargeHook(payload);
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async checkTransferStatus(ids = []) {
    const query = {
      ...(ids.length && { _id: { $in: ids } }),
      status: {
        $in: [TransferStatus.Pending, TransferStatus.Processing],
      },
      isDeleted: false,
    };

    const pendingOrProccesingTransfers = await this.transferRecordModel
      .find(query)
      .sort({ createdAt: -1 });

    await Promise.all(
      pendingOrProccesingTransfers.map(async (transferRecord) => {
        const service = this.getService(transferRecord.paymentProvider);
        const { status, providerResponse } = await service.checkTransferStatus({
          reference: transferRecord.reference,
        });
        await this.handleTransferHook({
          event:
            status === TransferStatus.Failed
              ? WebhookEventEnum.TransferFailed
              : WebhookEventEnum.TransferSuccess,
          data: {
            status,
            amount: transferRecord.amount,
            meta: transferRecord.meta,
            reference: transferRecord.reference,
          },
          provider: transferRecord.paymentProvider,
          originalPayload: providerResponse,
        });
        transferRecord.status = status;
        await transferRecord.save();
      })
    );

    return pendingOrProccesingTransfers;
  }

  async createCheckoutSession(
    user: UserDocument,
    payload: CreatePaymentIntentDTO
  ) {
    const service = this.getCurrencyService(payload.currency);
    const resp = await service.createCheckoutSession({
      ...payload,
      meta: { user: user.id },
      email: user.email,
    });
    return resp;
  }
}
