import { createHmac } from "crypto";
import { Injectable } from "@nestjs/common";

import { RequestService } from "@/core/services/request.service";
import {
  PaymentProvider,
  TransferStatus,
} from "@/payment/schemas/transfer-record.schema";
import {
  TransferToAccountDTO,
  VerifyAccountNumbertDTO,
  IPaymentProvider,
  IWebhookResponse,
  IWebhookTransfer,
  WebhookEventEnum,
  CheckTransferStatusDTO,
  IWebhookCharge,
} from "@/payment/types/payment.type";
import {
  PaystackWebhookResponse,
  PaystackWebhookEventEnum,
  PaystackTransferData,
  PaystackChargeData,
} from "./paystack.types";
import configuration from "@/core/services/configuration";
import { SupportedCurrencyEnum } from "@/wallet/schemas/wallet.schema";

@Injectable()
export class PaystackService
  extends RequestService
  implements IPaymentProvider
{
  private readonly secret: string;

  private readonly paystackEventMap = {
    [PaystackWebhookEventEnum.TransferSuccess]:
      WebhookEventEnum.TransferSuccess,
    [PaystackWebhookEventEnum.TransferFailed]: WebhookEventEnum.TransferFailed,

    [PaystackWebhookEventEnum.ChargeSuccess]: WebhookEventEnum.ChargeSuccess,
  };

  private readonly paystackStatusMap = {
    success: TransferStatus.Successful,
    processing: TransferStatus.Processing,
    failed: TransferStatus.Failed,
  };

  constructor() {
    const { secretKey, baseurl } = configuration().paystack;
    super({
      baseURL: baseurl,
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    this.secret = secretKey;
  }

  name(): PaymentProvider {
    return PaymentProvider.Paystack;
  }

  private getBankCodeKey() {
    return `paystackBankCode`;
  }

  async verifyAccountNumber(payload: VerifyAccountNumbertDTO) {
    const { accountNumber, bank } = payload;

    const { data } = await this.request<any>({
      method: "get",
      url: "bank/resolve",
      params: {
        account_number: accountNumber,
        bank_code: bank.meta.get(this.getBankCodeKey()),
      },
    });

    return {
      accountName: data.account_name,
      accountNumber: data.account_number,
    };
  }

  async checkTransferStatus(payload: CheckTransferStatusDTO) {
    const { reference } = payload;
    const { data } = await this.request<any>({
      url: `transfer/verify/${reference}`,
      method: "get",
    });

    return {
      providerResponse: data,
      status: this.paystackStatusMap[data.status],
    };
  }

  async transferToAccount(payload: TransferToAccountDTO) {
    const { currency } = payload;

    const reason = payload.description;
    const amount = Math.floor(payload.amount * 100);

    const recipient = await this.getTransferRecipientCode(payload);

    const { data } = await this.request<any>({
      method: "post",
      url: "transfer",
      data: {
        source: "balance",
        amount,
        reference: payload.reference,
        recipient,
        reason,
        currency,
        metadata: payload.meta,
      },
    });

    return {
      providerResponse: data,
      status: this.paystackStatusMap[data.status],
    };
  }

  private async getTransferRecipientCode(payload: TransferToAccountDTO) {
    const { accountNumber, accountName, currency, bank } = payload;

    const { data } = await this.request<any>({
      method: "post",
      url: "transferrecipient",
      data: {
        type: "nuban",
        name: accountName,
        account_number: accountNumber,
        bank_code: bank.meta.get(this.getBankCodeKey()),
        currency: currency,
      },
    });

    return data.recipient_code as string;
  }

  validateWebhook(headers: any, payload: any): boolean {
    const hash = createHmac("sha512", this.secret)
      .update(JSON.stringify(payload))
      .digest("hex");
    return hash === headers["x-paystack-signature"];
  }

  public transformWebhook(payload: PaystackWebhookResponse<any>) {
    switch (payload.event) {
      case PaystackWebhookEventEnum.TransferSuccess:
      case PaystackWebhookEventEnum.TransferFailed:
        return this.transformTransferData(payload);

      case PaystackWebhookEventEnum.ChargeSuccess:
        return this.transformChargeData(payload);

      default:
        break;
    }
  }

  private transformTransferData(
    payload: PaystackWebhookResponse<PaystackTransferData>
  ): IWebhookResponse<IWebhookTransfer> {
    const { data } = payload;
    return {
      event: this.paystackEventMap[payload.event],
      data: {
        status: this.paystackStatusMap[data.status],
        amount: data.amount / 100,
        meta: {},
        reference: data.reference,
      },
      provider: PaymentProvider.Paystack,
      originalPayload: payload,
    };
  }

  private transformChargeData(
    payload: PaystackWebhookResponse<PaystackChargeData>
  ): IWebhookResponse<IWebhookCharge> {
    const { data } = payload;
    return {
      event: this.paystackEventMap[payload.event],
      data: {
        status: this.paystackStatusMap[data.status],
        amount: data.amount / 100,
        meta: data.metadata,
        reference: data.reference,
        currency: data.currency as SupportedCurrencyEnum,
        channel: data.channel,
      },
      provider: PaymentProvider.Paystack,
      originalPayload: payload,
    };
  }
}
