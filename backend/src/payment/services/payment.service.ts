import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model } from "mongoose";
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
  CreateVirtualAccountDTO,
} from "../types/payment.type";
import { SupportedCurrencyEnum } from "@/wallet/schemas/wallet.schema";
import { PaystackService } from "../providers/paystack/paystack.service";
import { ChargeRecordDocument } from "../schemas/charge-record.schema";
import { WalletService } from "@/wallet/services/wallet.service";
import { StripeService } from "../providers/stripe/stripe.service";
import { UserDocument } from "@/user/schemas/user.schema";
import { WiseService } from "../providers/wise/wise.service";

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
    private wiseService: WiseService,
    @Inject(forwardRef(() => WalletService))
    private walletService: WalletService
  ) {
    this._registerServices();
  }

  private _registerServices(): void {
    this.services.set(PaymentProvider.Paystack, this.paystackService);
    this.services.set(PaymentProvider.Stripe, this.stripeService);
    this.services.set(PaymentProvider.Wise, this.wiseService);

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

    this.registerCurrencyService(SupportedCurrencyEnum.USD, this.wiseService);
    this.registerCurrencyService(SupportedCurrencyEnum.EUR, this.wiseService);
    this.registerCurrencyService(SupportedCurrencyEnum.GBP, this.wiseService);
    this.registerCurrencyService(SupportedCurrencyEnum.AUD, this.wiseService);
    this.registerCurrencyService(SupportedCurrencyEnum.MXN, this.wiseService);
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

  async fetchBanksByQuery(query: FilterQuery<BankDocument>) {
    return this.bankModel.find({
      isDeleted: false,
      ...query,
    });
  }

  async fetchBanks(currency?: string) {
    return this.bankModel
      .find({
        isDeleted: false,
        ...(currency && { currency }),
      })
      .sort({ name: 1 })
      .select("name currency");
  }

  async fetchBankById(bankId: string) {
    return this.bankModel.findOne({ isDeleted: false, _id: bankId });
  }

  async verifyAccountNumber(payload: VerifyAccountNumbertDTO) {
    const { bankId, currency } = payload;

    let bank;
    if (bankId) {
      bank = await this.bankModel.findOne({
        _id: bankId,
        isDeleted: false,
      });
      if (!bank) {
        throw new BadRequestException("invalid bank");
      }
    }
    const service = this.getCurrencyService(bank?.currency || currency);

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
        bank: bank?.id,
      },
      {
        upsert: true,
        new: true,
      }
    );
    const updatedFields = {};

    try {
      const transferResponse = await service.transferToAccount({
        ...payload,
        bank,
        amount,
        reference,
      });

      updatedFields.status = transferResponse.status;
      if (transferResponse.pspTransactionId) {
        updatedFields.pspTransactionId = transferResponse.pspTransactionId;
      }
      updatedFields.providerResponse = [
        ...transferRecord.providerResponse,
        transferResponse,
      ];
    } catch (error) {
      const errorContent =
        typeof error === "string"
          ? error
          : error.message || JSON.stringify(error);

      updatedFields.providerResponse = [
        ...transferRecord.providerResponse,
        errorContent,
      ];
      updatedFields.status = TransferStatus.Failed;
    } finally {
      transferRecord = await this.transferRecordModel.findByIdAndUpdate(
        transferRecord.id,
        { $set: updatedFields },
        { new: true }
      );
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
          bankCode,
          recipientType,
          accountType,
          address,
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
          bankCode,
          recipientType,
          accountType,
          address,
        });

        transferRecord = await this.transferRecordModel.findByIdAndUpdate(
          transferRecord.id,
          { $set: { status: transferResponse.status } },
          { new: true }
        );
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
    let transferRecord = await this.transferRecordModel
      .findOne({
        paymentProvider: provider,
        isDeleted: false,
        $or: [
          { reference: data.reference },
          { pspTransactionId: data.reference },
        ],
      })
      .sort({
        createdAt: -1,
      });
    if (!transferRecord) {
      throw new Error(`transfer record not found`);
    }

    transferRecord = await this.transferRecordModel.findByIdAndUpdate(
      transferRecord.id,
      { $set: { status: data.status }, $push: { webhookResponse: payload } },
      { new: true }
    );

    switch (transferRecord.purpose) {
      case TransferPurpose.WALLET_WITHDRAWAL:
        this.walletService.handleTransferHook(transferRecord);
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
          pspTransactionId: transferRecord.pspTransactionId,
        });
        if (
          [TransferStatus.Failed, TransferStatus.Successful].includes(status)
        ) {
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
        } else {
          transferRecord = await this.transferRecordModel.findByIdAndUpdate(
            transferRecord.id,
            { $set: { status } },
            { new: true }
          );
        }
      })
    );

    return pendingOrProccesingTransfers;
  }

  async createCheckoutSession(
    user: UserDocument,
    payload: CreatePaymentIntentDTO
  ) {
    const resp = await this.stripeService.createCheckoutSession({
      ...payload,
      meta: { user: user.id },
      email: user.email,
    });
    return resp;
  }

  async addBanks() {
    const data = [];
    await Promise.all(
      data.map(async (bank) => {
        await this.bankModel.findOneAndUpdate(
          {
            name: `${bank.name}-${bank.code}`,
            currency: SupportedCurrencyEnum.GBP,
          },
          { $set: { meta: { wiseBankCode: bank.code } } },
          { new: true, upsert: true }
        );
      })
    );
  }

  async createVirtualAccount(payload: CreateVirtualAccountDTO) {
    const service = this.getCurrencyService(payload.currency);
    const resp = await service.createVirtualAccount(payload);
    return resp;
  }
}
