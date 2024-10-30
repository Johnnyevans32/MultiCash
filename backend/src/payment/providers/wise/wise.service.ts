import { constants, createHmac, createPublicKey, verify } from "crypto";
import { Injectable, NotImplementedException } from "@nestjs/common";
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
  CreatePaymentIntentDTO,
  ICheckTransferStatusResponse,
} from "@/payment/types/payment.type";
import configuration from "@/core/services/configuration";
import { SupportedCurrencyEnum } from "@/wallet/schemas/wallet.schema";
import {
  AccountType,
  RecipientType,
} from "@/wallet/schemas/beneficiary.schema";

@Injectable()
export class WiseService extends RequestService implements IPaymentProvider {
  private readonly wiseEventMap = {
    "transfers#state-change#outgoing_payment_sent":
      WebhookEventEnum.TransferSuccess,
    "transfers#state-change#cancelled": WebhookEventEnum.TransferFailed,
  };

  private readonly wiseStatusMap = {
    outgoing_payment_sent: TransferStatus.Successful,
    processing: TransferStatus.Processing,
    incoming_payment_waiting: TransferStatus.Processing,
    incoming_payment_initiated: TransferStatus.Processing,
    funds_converted: TransferStatus.Processing,
    cancelled: TransferStatus.Failed,
  };

  constructor() {
    const { apiKey, baseurl } = configuration().wise;
    super({
      baseURL: baseurl,
      headers: { Authorization: `Bearer ${apiKey}` },
    });
  }

  async checkTransferStatus(
    payload: CheckTransferStatusDTO
  ): Promise<ICheckTransferStatusResponse> {
    const response = await this.request<any>({
      method: "get",
      url: `/v1/transfers/${payload.pspTransactionId}`,
    });

    return {
      providerResponse: response,
      status: this.wiseStatusMap[response.status] || TransferStatus.Processing,
    };
  }
  createCheckoutSession?(
    payload: CreatePaymentIntentDTO
  ): Promise<{ sessionId: string }> {
    throw new NotImplementedException();
  }

  name(): PaymentProvider {
    return PaymentProvider.Wise;
  }

  /**
   * For verifying account details, this depends on the country and currency.
   * Wise supports local bank transfers for certain currencies, and you may use
   * their API to fetch details for different account requirements.
   */
  async verifyAccountNumber(payload: VerifyAccountNumbertDTO) {
    throw new NotImplementedException();
  }

  /**
   * Transfer funds to a recipient account using Wise API.
   * You need to create a recipient and then initiate a transfer.
   */
  async transferToAccount(payload: TransferToAccountDTO) {
    const { amount, currency, reference, description } = payload;

    const quoteId = await this.createQuote(amount, currency);

    const recipientId = await this.getTransferRecipientCode(payload);

    const response = await this.request<any>({
      method: "post",
      url: "/v1/transfers",
      data: {
        targetAccount: recipientId,
        quoteUuid: quoteId,
        customerTransactionId: crypto.randomUUID(),
        details: {
          reference: description,
        },
      },
    });

    if (configuration().isDev) {
      this.simulateSuccessfulTransaction(response.id);
    }

    return {
      providerResponse: response,
      status: this.wiseStatusMap[response.status] || TransferStatus.Processing,
      pspTransactionId: response.id,
    };
  }

  /**
   * Helper method to create a quote for a transfer.
   */
  private async createQuote(amount: number, currency: SupportedCurrencyEnum) {
    const response = await this.request<any>({
      method: "post",
      url: `/v3/profiles/${configuration().wise.businessId}/quotes`,
      data: {
        sourceCurrency: currency,
        targetCurrency: currency,
        sourceAmount: amount,
      },
    });
    return response.id;
  }

  /**
   * Helper method to fetch or create a transfer recipient (beneficiary) code.
   */
  private async getTransferRecipientCode(payload: TransferToAccountDTO) {
    const {
      accountNumber,
      accountName,
      bank,
      currency,
      bankCode,
      recipientType,
      accountType,
      address,
    } = payload;

    const currencyTypeMap = {
      [SupportedCurrencyEnum.EUR]: "iban",
      [SupportedCurrencyEnum.GBP]: "sort_code",
      [SupportedCurrencyEnum.AUD]: "australian",
      [SupportedCurrencyEnum.MXN]: "mexican",
      [SupportedCurrencyEnum.USD]: "aba",
    };

    const currencyDetailsMap = {
      [SupportedCurrencyEnum.EUR]: { BIC: bankCode, IBAN: accountNumber },
      [SupportedCurrencyEnum.GBP]: { sortCode: bankCode, accountNumber },
      [SupportedCurrencyEnum.AUD]: { bsbCode: bankCode, accountNumber },
      [SupportedCurrencyEnum.MXN]: {
        clabe: bankCode,
        identificationNumber: accountNumber,
      },
      [SupportedCurrencyEnum.USD]: {
        abartn: bankCode,
        accountNumber,
        accountType:
          accountType === AccountType.Checking ? "CHECKING" : "SAVINGS",
        address,
      },
    };

    const response = await this.request<any>({
      method: "post",
      url: "/v1/accounts",
      data: {
        currency,
        type: currencyTypeMap[currency],
        profile: configuration().wise.businessId,
        accountHolderName: accountName,
        details: {
          legalType:
            recipientType === RecipientType.Business ? "BUSINESS" : "PRIVATE",
          ...(currencyDetailsMap[currency] ?? {}),
        },
      },
    });

    return response.id;
  }

  async simulateSuccessfulTransaction(id: string) {
    // Wait 1 second before starting the sequence
    const sleep = async (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    await sleep(1000);
    await this.request({
      method: "get",
      url: `v1/simulation/transfers/${id}/processing`,
    });

    await sleep(1000);
    await this.request({
      method: "get",
      url: `v1/simulation/transfers/${id}/funds_converted`,
    });

    await sleep(1000);
    await this.request({
      method: "get",
      url: `v1/simulation/transfers/${id}/outgoing_payment_sent`,
    });
  }

  /**
   * Handle webhook validation by verifying the signature.
   */
  validateWebhook(headers: any, payload: any): boolean {
    const signature = headers["x-signature-sha256"];

    const publicKey = createPublicKey({
      key: configuration().wise.publicKey,
      format: "pem",
    });

    return verify(
      "RSA-SHA256",
      Buffer.from(JSON.stringify(payload)),
      {
        key: publicKey,
        padding: constants.RSA_PKCS1_PADDING,
      },
      Buffer.from(signature, "base64")
    );
  }

  /**
   * Transform the webhook payload into a common format for handling
   * different Wise events (transfers, charges, etc.)
   */
  public transformWebhook(payload: any): IWebhookResponse<IWebhookTransfer> {
    switch (payload.event_type) {
      case "transfers#state-change":
        return this.transformTransferData(payload);

      default:
        throw new NotImplementedException(`Unhandled event: ${payload.event}`);
    }
  }

  /**
   * Transform the transfer data received in the webhook.
   */
  private transformTransferData(
    payload: any
  ): IWebhookResponse<IWebhookTransfer> {
    const {
      current_state,
      resource: { id },
    } = payload.data;

    return {
      event: this.wiseEventMap[`${payload.event_type}#${current_state}`],
      data: {
        status: this.wiseStatusMap[current_state],
        reference: id,
        amount: 0,
        meta: {},
      },
      provider: PaymentProvider.Wise,
      originalPayload: payload,
    };
  }
}
