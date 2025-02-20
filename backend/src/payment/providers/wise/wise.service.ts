import { constants, createPublicKey, verify } from "crypto";
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
  CreateVirtualAccountDTO,
} from "@/payment/types/payment.type";
import configuration from "@/core/services/configuration";
import { SupportedCurrencyEnum } from "@/wallet/schemas/wallet.schema";
import {
  AccountType,
  RecipientAddress,
  RecipientType,
} from "@/wallet/schemas/beneficiary.schema";
import { UtilityService } from "@/core/services/util.service";

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

  async createVirtualAccount(payload: CreateVirtualAccountDTO) {
    try {
      const { currency } = payload;
      const profileId = await this.createProfile(payload);
      const details = await this.request<any>({
        method: "get",
        url: `/v1/profiles/${profileId}/account-details`,
      });

      const currencyAccount = details.find((i) => i.currency.code === currency);
      return {
        providerResponse: currencyAccount,
        bankName: "",
        accountName: "",
        accountNumber: "",
        currency,
        providerCustomerId: profileId,
        provider: this.name(),
      };
    } catch (err) {
      throw new Error(UtilityService.getWiseErrorMessgae(err));
    }
  }

  async checkTransferStatus(
    payload: CheckTransferStatusDTO
  ): Promise<ICheckTransferStatusResponse> {
    try {
      const response = await this.request<any>({
        method: "get",
        url: `/v1/transfers/${payload.pspTransactionId}`,
      });

      return {
        providerResponse: response,
        status:
          this.wiseStatusMap[response.status] || TransferStatus.Processing,
      };
    } catch (err) {
      throw new Error(UtilityService.getWiseErrorMessgae(err));
    }
  }
  createCheckoutSession?(
    payload: CreatePaymentIntentDTO
  ): Promise<{ sessionId: string }> {
    throw new NotImplementedException();
  }

  name(): PaymentProvider {
    return PaymentProvider.Wise;
  }

  private getBankCodeKey() {
    return `wiseBankCode`;
  }

  async verifyAccountNumber(payload: VerifyAccountNumbertDTO) {
    try {
      const {
        accountNumber,
        accountName,
        currency,
        recipientType,
        accountType,
        address,
        bankCode,
      } = payload;
      // if (configuration().isDev) {
      //   return {
      //     accountName,
      //     accountNumber,
      //   };
      // }
      await this.getTransferRecipientCode({
        accountNumber,
        accountName,
        currency,
        recipientType,
        accountType,
        address,
        bankCode,
      });

      return {
        accountName,
        accountNumber,
      };
    } catch (err) {
      throw new Error(UtilityService.getWiseErrorMessgae(err));
    }
  }

  async transferToAccount(payload: TransferToAccountDTO) {
    try {
      const { amount, currency, reference, description } = payload;

      // if (configuration().isDev) {
      //   return {
      //     providerResponse: payload,
      //     status: this.wiseStatusMap.outgoing_payment_sent,
      //   };
      // }

      const quoteId = await this.createQuote(amount, currency);

      const recipientId = await this.getTransferRecipientCode(payload);

      const response = await this.request<any>({
        method: "post",
        url: "/v1/transfers",
        data: {
          targetAccount: recipientId,
          quoteUuid: quoteId,
          customerTransactionId: reference,
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
        status:
          this.wiseStatusMap[response.status] || TransferStatus.Processing,
        pspTransactionId: response.id,
      };
    } catch (err) {
      throw new Error(UtilityService.getWiseErrorMessgae(err));
    }
  }

  /**
   * Helper method to create a quote for a transfer.
   */
  private async createQuote(amount: number, currency: SupportedCurrencyEnum) {
    try {
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
    } catch (err) {
      throw new Error(UtilityService.getWiseErrorMessgae(err));
    }
  }

  /**
   * Helper method to fetch or create a transfer recipient (beneficiary) code.
   */
  private async getTransferRecipientCode(payload: {
    accountNumber: string;
    bankCode?: string;
    accountName: string;
    currency: SupportedCurrencyEnum;
    recipientType?: RecipientType;
    accountType?: AccountType;
    address?: RecipientAddress;
  }) {
    try {
      const {
        accountNumber,
        accountName,
        currency,
        recipientType,
        accountType,
        address,
        bankCode,
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
            ...(currencyDetailsMap[currency] || {}),
          },
        },
      });

      return response.id;
    } catch (err) {
      throw new Error(UtilityService.getWiseErrorMessgae(err));
    }
  }

  private async createProfile(payload: CreateVirtualAccountDTO) {
    try {
      const {
        email,
        name,
        phoneNumber = UtilityService.generateRandomPhoneNumber("+1"),
      } = payload;

      const response = await this.request<any>({
        method: "post",
        url: "/v2/profiles/personal-profile",
        data: {
          firstName: name.split(" ").at(0),
          lastName: name.split(" ").at(-1),
          preferredName: name.split(" ")[0],
          firstNameInKana: null,
          lastNameInKana: null,
          address: {
            addressFirstLine: "50 Sunflower Ave",
            city: "Phoenix",
            countryIso3Code: "usa",
            postCode: "10025",
            stateCode: "AZ",
          },
          nationality: "usa",
          dateOfBirth: "1977-07-01",
          contactDetails: {
            email,
            phoneNumber,
          },
          occupations: [
            {
              code: "Software Engineer",
              format: "FREE_FORM",
            },
          ],
        },
      });

      return response.id;
    } catch (err) {
      throw new Error(UtilityService.getWiseErrorMessgae(err));
    }
  }

  async simulateSuccessfulTransaction(id: string) {
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

  transformWebhook(payload: any): IWebhookResponse<IWebhookTransfer> {
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
