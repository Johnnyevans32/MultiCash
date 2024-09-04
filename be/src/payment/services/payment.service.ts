import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import {
  BANK,
  CHARGE_RECORD,
  TRANSFER_RECORD,
} from "@/core/constants/schema.constants";
import {
  PaymentProvider,
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
} from "../types/payment.type";
import { SupportedCurrencyEnum } from "@/wallet/schemas/wallet.schema";
import { PaystackService } from "../providers/paystack/paystack.service";
import { ChargeRecordDocument } from "../schemas/charge-record.schema";
import { WalletService } from "@/wallet/services/wallet.service";
import { AVAILABLE_BALANCE } from "@/wallet/dtos/wallet.dto";
import { TransactionPurpose } from "@/wallet/schemas/wallet-transaction.schema";
import { Interval } from "@nestjs/schedule";

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
    @Inject(forwardRef(() => WalletService))
    private walletService: WalletService
  ) {
    this._registerServices();
  }

  private _registerServices(): void {
    this.services.set(PaymentProvider.Paystack, this.paystackService);

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
    } catch (error) {
      transferRecord.status = TransferStatus.Failed;
      throw error;
    } finally {
      await transferRecord.save();
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
    payload: { event: any; headers: any },
    paymentProvider: PaymentProvider
  ): Promise<any> {
    try {
      const service = this.services.get(paymentProvider);
      const isValidWebhook = service.validateWebhook(
        payload.headers,
        payload.event
      );
      if (!isValidWebhook) {
        throw new BadRequestException("webhook is invalid");
      }

      const transformedData = service.transformWebhook(payload.event);
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
    await transferRecord.save();
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

    if (meta.user && status === TransferStatus.Successful) {
      await this.walletService.creditWallet({
        amount,
        balanceKeys: [AVAILABLE_BALANCE],
        currency,
        description: `funded wallet from ${channel}`,
        purpose: TransactionPurpose.DEPOSIT,
        reference,
        user: meta.user,
        meta,
      });
    }
  }

  @Interval(60 * 100)
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
            meta: {},
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
}
