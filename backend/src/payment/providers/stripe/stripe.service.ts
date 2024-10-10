import { Injectable } from "@nestjs/common";
import Stripe from "stripe";

import configuration from "@/core/services/configuration";
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
  IWebhookCharge,
} from "@/payment/types/payment.type";
import { SupportedCurrencyEnum } from "@/wallet/schemas/wallet.schema";

@Injectable()
export class StripeService implements IPaymentProvider {
  private stripe: Stripe;

  private readonly stripeEventMap = {
    "payment_intent.succeeded": WebhookEventEnum.ChargeSuccess,
    "payout.paid": WebhookEventEnum.TransferSuccess,
    "payout.failed": WebhookEventEnum.TransferFailed,
  };

  private readonly stripeStatusMap = {
    paid: TransferStatus.Successful,
    pending: TransferStatus.Processing,
    failed: TransferStatus.Failed,
    in_transit: TransferStatus.Processing,
    canceled: TransferStatus.Failed,
    succeeded: TransferStatus.Successful,
  };

  constructor() {
    const { secretKey, baseurl } = configuration().stripe;
    this.stripe = new Stripe(secretKey, {});
  }

  name(): PaymentProvider {
    return PaymentProvider.Stripe;
  }

  async verifyAccountNumber(payload: VerifyAccountNumbertDTO) {
    throw new Error("Stripe does not support account verification.");
  }

  async checkTransferStatus(payload: CheckTransferStatusDTO) {
    const { reference } = payload;

    try {
      const transfer = await this.stripe.payouts.retrieve(reference);
      return {
        providerResponse: transfer,
        status: this.stripeStatusMap[transfer.status],
      };
    } catch (error) {
      return {
        providerResponse: error,
        status: TransferStatus.Failed,
      };
    }
  }

  async transferToAccount(payload: TransferToAccountDTO) {
    const { amount, currency, stripeAccountId, description, meta, reference } =
      payload;
    try {
      const transfer = await this.stripe.payouts.create(
        {
          amount: Math.floor(amount * 100),
          currency,
          destination: stripeAccountId,
          description,
          metadata: { ...meta, reference },
        },
        { idempotencyKey: reference }
      );

      return {
        providerResponse: transfer,
        status: this.stripeStatusMap[transfer.status],
      };
    } catch (error) {
      return {
        providerResponse: error,
        status: TransferStatus.Failed,
      };
    }
  }

  async createCheckoutSession(payload: CreatePaymentIntentDTO) {
    const { amount, currency, meta, email, description } = payload;
    const session = await this.stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: description || "Wallet Fund",
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      payment_method_types: ["card", "cashapp", "link", "us_bank_account"],
      success_url: `${configuration().app.uiUrl}?stripe_session_id={CHECKOUT_SESSION_ID}&currency=${currency}`,
      cancel_url: `${configuration().app.uiUrl}?stripe_payment_canceled=true&currency=${currency}`,
      payment_intent_data: {
        metadata: meta,
      },
      customer_email: email,
    });

    return {
      sessionId: session.id,
    };
  }

  validateWebhook(headers: any, payload: any, rawBody: any): boolean {
    const { webhookSecret } = configuration().stripe;
    const stripeSignature = headers["stripe-signature"];
    try {
      this.stripe.webhooks.constructEvent(
        rawBody,
        stripeSignature,
        webhookSecret
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  public transformWebhook(payload: Stripe.Event): IWebhookResponse<any> {
    switch (payload.type) {
      case "payment_intent.succeeded":
        return this.transformChargeData(payload);
      case "payout.paid":
      case "payout.failed":
        return this.transformTransferData(payload);

      default:
        break;
    }
  }

  private transformTransferData(
    payload: Stripe.Event
  ): IWebhookResponse<IWebhookTransfer> {
    const object = payload.data.object as Stripe.Payout;
    return {
      event: this.stripeEventMap[payload.type],
      data: {
        status: this.stripeStatusMap[object.status],
        amount: object.amount / 100,
        meta: object.metadata,
        reference: object.metadata.reference,
      },
      provider: PaymentProvider.Stripe,
      originalPayload: payload,
    };
  }

  private transformChargeData(
    payload: Stripe.Event
  ): IWebhookResponse<IWebhookCharge> {
    const object = payload.data.object as Stripe.PaymentIntent;

    return {
      event: this.stripeEventMap[payload.type],
      data: {
        status: this.stripeStatusMap[object.status],
        amount: object.amount / 100,
        meta: object.metadata,
        reference: object.id,
        currency: object.currency.toUpperCase() as SupportedCurrencyEnum,
        channel: object.payment_method_types[0],
      },
      provider: PaymentProvider.Stripe,
      originalPayload: payload,
    };
  }
}
