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
  CreateVirtualAccountDTO,
} from "@/payment/types/payment.type";
import {
  PaystackWebhookResponse,
  PaystackWebhookEventEnum,
  PaystackTransferData,
  PaystackChargeData,
} from "./paystack.types";
import configuration from "@/core/services/configuration";
import { SupportedCurrencyEnum } from "@/wallet/schemas/wallet.schema";
import { UtilityService } from "@/core/services/util.service";

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

    // if (configuration().isDev) {
    //   return {
    //     accountName: UtilityService.generateRandomName(),
    //     accountNumber,
    //   };
    // }

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

  async fetchBanks() {
    const { data } = await this.request<any>({
      method: "get",
      url: "bank",
    });

    return data;
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

  async createCustomer(payload: CreateVirtualAccountDTO) {
    const { email, name, phoneNumber = "2348123456789" } = payload;
    const { data } = await this.request<any>({
      method: "post",
      url: "customer",
      data: {
        email,
        first_name: name.split(" ").at(0),
        last_name: name.split(" ").at(-1),
        phone: phoneNumber,
      },
    });

    return data;
  }

  async createVirtualAccount(payload: CreateVirtualAccountDTO) {
    const { currency } = payload;
    if (configuration().isDev) {
      const { name } = payload;
      const mockResponse = {
        data: {
          bank: { name: `${currency} Federal Bank` },
          account_number: "1234567890",
        },
      };

      return {
        providerResponse: mockResponse.data,
        bankName: mockResponse.data.bank.name,
        accountName: name,
        accountNumber: mockResponse.data.account_number,
        currency,
        providerCustomerId: UtilityService.generateRandomHex(6),
        provider: this.name(),
      };
    }

    const customer = await this.createCustomer(payload);
    const { data } = await this.request<any>({
      method: "post",
      url: "dedicated_account",
      data: { customer: customer.id, preferred_bank: "wema-bank" },
    });

    return {
      providerResponse: data,
      bankName: data.bank.name,
      accountName: data.account_name,
      accountNumber: data.account_number,
      currency,
      providerCustomerId: customer.id,
      provider: this.name(),
    };
  }

  async transferToAccount(payload: TransferToAccountDTO) {
    const { currency } = payload;

    if (
      [
        SupportedCurrencyEnum.KES,
        SupportedCurrencyEnum.GHS,
        SupportedCurrencyEnum.ZAR,
      ].includes(currency) &&
      configuration().isDev
    ) {
      return {
        providerResponse: payload,
        status: this.paystackStatusMap["success"],
      };
    }

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

    return data.recipient_code;
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
