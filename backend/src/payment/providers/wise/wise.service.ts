import { createHmac } from "crypto";
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

@Injectable()
export class WiseService extends RequestService implements IPaymentProvider {
  private readonly secret: string;

  private readonly wiseEventMap = {
    "transfers.state-change": WebhookEventEnum.TransferSuccess, // or failed/processing based on the event details
    "transfers.cancelled": WebhookEventEnum.TransferFailed,
  };

  private readonly wiseStatusMap = {
    completed: TransferStatus.Successful,
    processing: TransferStatus.Processing,
    cancelled: TransferStatus.Failed,
  };

  constructor() {
    const { apiKey, baseurl } = configuration().wise;
    super({
      baseURL: baseurl,
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    this.secret = apiKey;
  }

  checkTransferStatus(
    payload: CheckTransferStatusDTO
  ): Promise<ICheckTransferStatusResponse> {
    throw new NotImplementedException();
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
    const { accountNumber, bank } = payload;
    const { currency } = bank;

    // Example logic to validate recipient accounts.
    const { data } = await this.request<any>({
      method: "get",
      url: `/v1/account/validate`,
      params: {
        accountNumber,
        bankCode: bank.meta.get("bankCode"), // Assuming you have bank codes for different regions
        currency,
      },
    });

    return {
      accountName: data.accountName,
      accountNumber: data.accountNumber,
    };
  }

  /**
   * Transfer funds to a recipient account using Wise API.
   * You need to create a recipient and then initiate a transfer.
   */
  async transferToAccount(payload: TransferToAccountDTO) {
    const { amount, currency, reference, description } = payload;

    // Step 1: Create a quote for the transfer
    const quote = await this.createQuote(amount, currency);

    // Step 2: Create a recipient (beneficiary) account
    const recipientId = await this.getTransferRecipientCode(payload);

    // Step 3: Initiate the transfer using the quote and recipient
    const { data } = await this.request<any>({
      method: "post",
      url: "/v1/transfers",
      data: {
        targetAccount: recipientId,
        quoteUuid: quote.id,
        customerTransactionId: reference,
        details: {
          reference: description,
        },
      },
    });

    return {
      providerResponse: data,
      status: this.wiseStatusMap[data.status],
    };
  }

  /**
   * Helper method to create a quote for a transfer.
   */
  private async createQuote(amount: number, currency: SupportedCurrencyEnum) {
    const { data } = await this.request<any>({
      method: "post",
      url: "/v1/quotes",
      data: {
        sourceCurrency: currency, // Use wallet currency for individual transactions
        targetCurrency: currency,
        sourceAmount: amount,
      },
    });
    return data;
  }

  /**
   * Helper method to fetch or create a transfer recipient (beneficiary) code.
   */
  private async getTransferRecipientCode(payload: TransferToAccountDTO) {
    const { accountNumber, accountName, bank, currency } = payload;

    const { data } = await this.request<any>({
      method: "post",
      url: "/v1/accounts",
      data: {
        currency,
        type: "sort_code",
        profile: 30000000,
        ownedByCustomer: true,
        accountHolderName: accountName,
        details: {
          legalType: "PRIVATE",
          sortCode: "040075",
          accountNumber: accountNumber,
        },
      },
    });

    return data.id; // Assuming the recipient ID is returned in the `id` field
  }

  /**
   * Handle webhook validation by verifying the signature.
   */
  validateWebhook(headers: any, payload: any): boolean {
    const signature = headers["x-signature"]; // Wise uses this header for webhook signature
    const hash = createHmac("sha256", this.secret)
      .update(JSON.stringify(payload))
      .digest("hex");
    return hash === signature;
  }

  /**
   * Transform the webhook payload into a common format for handling
   * different Wise events (transfers, charges, etc.)
   */
  public transformWebhook(payload: any): IWebhookResponse<IWebhookTransfer> {
    switch (payload.event) {
      case "transfers.state-change":
      case "transfers.cancelled":
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
    const { status, id, targetAccount, sourceAmount } = payload.data;

    return {
      event: this.wiseEventMap[payload.event],
      data: {
        status: this.wiseStatusMap[status],
        amount: sourceAmount,
        reference: id,
        meta: {},
      },
      provider: PaymentProvider.Wise,
      originalPayload: payload,
    };
  }
}
