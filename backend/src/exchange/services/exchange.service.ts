import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Connection, Model, PaginateModel } from "mongoose";
import {
  Offering as PFIOffering,
  Order,
  Rfq,
  TbdexHttpClient,
  Close,
} from "@tbdex/http-client";
import { Cache } from "cache-manager";
import * as moment from "moment";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { PresentationExchange } from "@web5/credentials";
import { DidDht } from "@web5/dids";
import { groupBy, keyBy, min } from "lodash";

import {
  EXCHANGE,
  OFFERING,
  PFI,
  portableDid,
} from "@/core/constants/schema.constants";
import { PfiDocument } from "../schemas/pfi.schema";
import { CreateExchangeDTO, OfferingDTO, UserKycInfoDTO } from "../types";
import { RequestService } from "@/core/services/request.service";
import { UserDocument } from "@/user/schemas/user.schema";
import { OfferingDocument, OfferingStatus } from "../schemas/offering.schema";
import { SupportedCurrencyEnum } from "@/wallet/schemas/wallet.schema";
import { WalletService } from "@/wallet/services/wallet.service";
import { AVAILABLE_BALANCE } from "@/wallet/dtos/wallet.dto";
import { TransactionPurpose } from "@/wallet/schemas/wallet-transaction.schema";
import { Interval } from "@nestjs/schedule";
import { ExchangeDocument, ExchangeStatus } from "../schemas/exchange.schema";
import { PaginateDTO } from "@/core/services/response.service";
import { RevenueService } from "@/revenue/services/revenue.service";
import { RevenueSource } from "@/revenue/schemas/revenue.schema";
import { EmailService } from "@/notification/email/email.service";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

@Injectable()
export class ExchangeService extends RequestService {
  private tbdexHttpClient: typeof TbdexHttpClient;
  private rfq: typeof Rfq;
  private order: typeof Order;
  private close: typeof Close;

  private paymentDetailsMap: Record<string, any> = {
    DEBIT_CARD: { cardNumber: "", expiryDate: "", cardHolderName: "", cvv: "" },
    BTC_ADDRESS: { btcAddress: "" },
    KES_BANK_TRANSFER: { accountNumber: "" },
    USD_BANK_TRANSFER: { accountNumber: "", routingNumber: "" },
    EUR_BANK_TRANSFER: { accountNumber: "", IBAN: "" },
    BTC_WALLET_ADDRESS: { address: "" },
    NGN_BANK_TRANSFER: {},
  };

  constructor(
    @InjectConnection()
    private readonly connection: Connection,
    @InjectModel(PFI)
    private pfiModel: Model<PfiDocument>,
    @InjectModel(EXCHANGE)
    private exchangeModel: PaginateModel<ExchangeDocument>,
    @InjectModel(OFFERING)
    private offeringModel: Model<OfferingDocument>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    private walletService: WalletService,
    private revenueService: RevenueService,
    private emailService: EmailService
  ) {
    super();
  }
  private async loadTbdexModules() {
    const module = await eval(`import("@tbdex/http-client")`);
    return {
      tbdexHttpClient: module.TbdexHttpClient,
      rfq: module.Rfq,
      order: module.Order,
      close: module.Close,
    };
  }
  async onModuleInit() {
    ({
      tbdexHttpClient: this.tbdexHttpClient,
      rfq: this.rfq,
      order: this.order,
      close: this.close,
    } = await this.loadTbdexModules());
  }

  async rateExchange(
    user: UserDocument,
    exchangeId: string,
    payload: { rating: number; comment: string }
  ) {
    await this.exchangeModel.updateOne(
      { user: user.id, _id: exchangeId, isDeleted: false },
      {
        $set: {
          rating: payload.rating,
          comment: payload.comment,
        },
      }
    );
  }
  async fetchPfis() {
    const cacheKey = "pfis";
    let pfis = await this.cacheManager.get<PfiDocument[]>(cacheKey);
    if (pfis) {
      return pfis;
    }
    pfis = await this.pfiModel.find({ isDeleted: false });
    await this.cacheManager.set(cacheKey, pfis, 3600000);
    return pfis;
  }

  async getOfferingsFromPFIs() {
    const cacheKey = "offerings";
    let offerings = await this.cacheManager.get<PFIOffering[]>(cacheKey);
    if (offerings) {
      return offerings;
    }

    const pfis = await this.fetchPfis();
    const offeringsPromises = pfis.map((pfi) =>
      this.tbdexHttpClient.getOfferings({ pfiDid: pfi.did }).catch((err) => {
        console.log("Error fetching offerings from PFI", pfi.name, err.message);
        return [];
      })
    );

    offerings = (await Promise.all(offeringsPromises)).flat();
    await this.cacheManager.set(cacheKey, offerings, 3600000);
    return offerings;
  }

  async getOfferingsById(id: string) {
    const pfiOfferings = await this.getOfferingsFromPFIs();
    return pfiOfferings.find((i) => i.metadata.id === id);
  }

  async getOfferings(payload: {
    payinCurrency: SupportedCurrencyEnum;
    payoutCurrency: SupportedCurrencyEnum;
  }) {
    const { payinCurrency, payoutCurrency } = payload;

    const pfiOfferings = await this.getOfferingsFromPFIs();

    if (pfiOfferings.length === 0) {
      return [];
    }

    const pfis = await this.fetchPfis();
    const pfisKeyedByDid = keyBy(pfis, "did");
    const offerings = this.formatOfferings(pfiOfferings, pfisKeyedByDid);

    const matchedOfferings: {
      offerings: OfferingDTO[];
      cumulativePayoutUnitsPerPayinUnit: number;
      cumulativeSettlementTimeInSecs?: number;
      cumulativeFee: number;
      payinCurrency: SupportedCurrencyEnum;
      payoutCurrency: SupportedCurrencyEnum;
    }[] = [];
    const queue: {
      chain: OfferingDTO[];
      lastCurrency: SupportedCurrencyEnum;
      cumulativePayoutUnitsPerPayinUnit: number;
      cumulativeFee: number;
      cumulativeSettlementTimeInSecs: number;
    }[] = [];
    const visited = new Set<SupportedCurrencyEnum>();

    // Initialize the queue with offerings that match the payinCurrency
    for (const offering of offerings) {
      if (offering.payinCurrency === payinCurrency) {
        queue.push({
          chain: [offering],
          lastCurrency: offering.payoutCurrency,
          cumulativePayoutUnitsPerPayinUnit: offering.payoutUnitsPerPayinUnit,
          cumulativeFee: offering.fee,
          cumulativeSettlementTimeInSecs:
            offering.estimatedSettlementTimeInSecs,
        });
        visited.add(offering.payoutCurrency);
      }
    }

    // Perform BFS to find conversion paths
    while (queue.length > 0) {
      const {
        chain,
        lastCurrency,
        cumulativeFee,
        cumulativePayoutUnitsPerPayinUnit,
        cumulativeSettlementTimeInSecs,
      } = queue.shift()!;

      // Check if we reached the desired payoutCurrency
      if (lastCurrency === payoutCurrency) {
        matchedOfferings.push({
          offerings: chain,
          cumulativePayoutUnitsPerPayinUnit,
          cumulativeFee,
          payinCurrency,
          payoutCurrency,
          cumulativeSettlementTimeInSecs,
        });
        continue;
      }

      // Look for next possible offerings in the chain
      for (const nextOffering of offerings) {
        const nextPayoutCurrency = nextOffering.payoutCurrency;
        const nextPayinCurrency = nextOffering.payinCurrency;
        if (
          nextPayinCurrency === lastCurrency &&
          !visited.has(nextPayoutCurrency)
        ) {
          queue.push({
            chain: [...chain, nextOffering],
            lastCurrency: nextPayoutCurrency,
            cumulativePayoutUnitsPerPayinUnit:
              cumulativePayoutUnitsPerPayinUnit *
              nextOffering.payoutUnitsPerPayinUnit,
            cumulativeFee: cumulativeFee + nextOffering.fee,
            cumulativeSettlementTimeInSecs:
              cumulativeSettlementTimeInSecs +
              nextOffering.estimatedSettlementTimeInSecs,
          });
          visited.add(nextPayoutCurrency);
        }
      }
    }

    return matchedOfferings;
  }

  private formatOfferings(
    offerings: PFIOffering[],
    pfisKeyedByDid?: Record<string, PfiDocument>
  ) {
    return offerings.map((o) => this.formatOffering(o, pfisKeyedByDid));
  }

  private formatOffering(
    offering: PFIOffering,
    pfisKeyedByDid?: Record<string, PfiDocument>
  ) {
    const {
      metadata: { id: pfiOfferingId, from: pfiDid },
      data: {
        description,
        payin: { currencyCode: payinCurrency },
        payout: { currencyCode: payoutCurrency, methods },
        payoutUnitsPerPayinUnit,
      },
    } = offering;

    return {
      pfiOfferingId,
      description,
      pfiId: pfisKeyedByDid?.[pfiDid]?.id,
      pfiName: pfisKeyedByDid?.[pfiDid]?.name,
      pfiDid,
      payoutUnitsPerPayinUnit: Number(payoutUnitsPerPayinUnit),
      payinCurrency: payinCurrency as SupportedCurrencyEnum,
      payoutCurrency: payoutCurrency as SupportedCurrencyEnum,
      fee: 0,
      estimatedSettlementTimeInSecs: methods[0]?.estimatedSettlementTime,
    };
  }

  private async calculateExchangeFee(
    currency: SupportedCurrencyEnum,
    amount: number
  ) {
    const walletCurrency = await this.walletService.getWalletCurrency(currency);
    return min([
      walletCurrency.exchangePercentageFee * amount,
      walletCurrency.maxExchangeFee,
    ]);
  }

  async createExchange(user: UserDocument, payload: CreateExchangeDTO) {
    const fields = plainToInstance(UserKycInfoDTO, {
      country: user.country,
      did: user.did,
      name: user.name,
    });
    const errors = await validate(fields);
    if (errors.length > 0) {
      throw new Error(`validation failed: ${errors}`);
    }
    const { offerings, payinAmount } = payload;

    const [pfis, pfisOfferings] = await Promise.all([
      this.fetchPfis(),
      this.getOfferingsFromPFIs(),
    ]);

    const pfisGroupedByDid = new Map(pfis.map((pfi) => [pfi.did, pfi.id]));
    const pfisOfferingsKeyedById = new Map(
      pfisOfferings.map((offering) => [offering.metadata.id, offering])
    );

    let exchange: ExchangeDocument;
    const session = await this.connection.startSession();

    await session.withTransaction(async () => {
      const offeringDetails = offerings.map((pfiOfferingId) => {
        const pfiOffering = pfisOfferingsKeyedById.get(pfiOfferingId);
        if (!pfiOffering) {
          throw new BadRequestException("offering not found");
        }
        return this.formatOffering(pfiOffering);
      });

      const { payinCurrency } = offeringDetails.at(0);
      const { payoutCurrency } = offeringDetails.at(-1);
      const platformFee = await this.calculateExchangeFee(
        payinCurrency,
        payinAmount
      );
      const providerFee = 0;
      const totalFee = platformFee + providerFee;
      const netPayinAmount = payinAmount - totalFee;
      const payoutUnitsPerPayinUnit = offeringDetails.reduce(
        (acc, o) => acc * o.payoutUnitsPerPayinUnit,
        1
      );
      const payoutAmount = netPayinAmount * payoutUnitsPerPayinUnit;
      [exchange] = await this.exchangeModel.create(
        [
          {
            user: user.id,
            payinAmount,
            payoutAmount,
            netPayinAmount,
            platformFee,
            providerFee,
            totalFee,
            payinCurrency,
            payoutCurrency,
            payoutUnitsPerPayinUnit,
          },
        ],
        { session }
      );

      let currentPayinAmount = netPayinAmount;
      const updatedOfferings = offeringDetails.map((offering) => {
        const {
          payoutUnitsPerPayinUnit,
          pfiDid,
          payinCurrency,
          payoutCurrency,
          description,
          pfiOfferingId,
        } = offering;

        const expectedPayoutAmount =
          currentPayinAmount * payoutUnitsPerPayinUnit;

        const updatedOffering: Partial<OfferingDocument> = {
          pfiOfferingId,
          user: user.id,
          exchange: exchange.id,
          pfi: pfisGroupedByDid.get(pfiDid),
          description,
          payoutUnitsPerPayinUnit,
          payinCurrency,
          payoutCurrency,
          expectedPayinAmount: currentPayinAmount,
          expectedPayoutAmount,
        };

        currentPayinAmount = expectedPayoutAmount;

        return updatedOffering;
      });

      await this.offeringModel.insertMany(updatedOfferings, { session });

      const description = `exchange to ${exchange.payoutCurrency}`;
      await this.walletService.debitWallet({
        amount: payinAmount,
        currency: exchange.payinCurrency,
        balanceKeys: [AVAILABLE_BALANCE],
        description,
        reference: `debit_${exchange.id}`,
        user: user.id,
        meta: { exchangeId: exchange.id },
        purpose: TransactionPurpose.CURRENCY_EXCHANGE,
      });
    });
    if (exchange) this.processExchange(exchange);
  }

  async fetchExchanges(user: UserDocument, query: PaginateDTO) {
    const { page = 1, limit = 10, all = false } = query;
    const { docs: data, ...metadata } = await this.exchangeModel.paginate(
      {
        isDeleted: false,
        user: user.id,
      },
      {
        sort: { createdAt: -1 },
        page,
        limit,
        pagination: !all,
        select:
          "payinAmount payoutAmount payinCurrency payoutCurrency payoutUnitsPerPayinUnit totalFee status createdAt rating comment",
        populate: {
          path: "offerings",
          select:
            "status payinCurrency payoutCurrency description payoutUnitsPerPayinUnit pfiFee",
          populate: { path: "pfi", select: "name" },
        },
      }
    );
    return { data, metadata };
  }

  @Interval(60 * 100)
  async processPendingExchanges(ids = []) {
    const exchanges = await this.exchangeModel.find({
      ...(ids.length && { _id: { $in: ids } }),
      isDeleted: false,
      status: { $in: [ExchangeStatus.Processing, ExchangeStatus.Pending] },
    });

    await Promise.all(
      exchanges.map(async (exchange) => await this.processExchange(exchange))
    );
  }

  async processExchange(exchange: ExchangeDocument) {
    try {
      await exchange.populate("offeringToBeProcessed user");
      const offering = exchange.offeringToBeProcessed;
      const user = exchange.user as UserDocument;
      if (!offering) {
        exchange.status = ExchangeStatus.Completed;
        const description = `exchange from ${exchange.payinCurrency}`;
        await this.walletService.creditWallet({
          amount: exchange.payoutAmount,
          currency: exchange.payoutCurrency,
          balanceKeys: [AVAILABLE_BALANCE],
          description,
          reference: `credit_${exchange.id}`,
          user: user.id,
          meta: { exchangeId: exchange.id },
          purpose: TransactionPurpose.CURRENCY_EXCHANGE,
        });
        await exchange.save();
        this.revenueService.createRevenue({
          amount: exchange.platformFee,
          source: RevenueSource.CURRENCY_EXCHANGE,
          currency: exchange.payinCurrency,
          reference: `rev_${exchange.id}`,
          meta: { exchangeId: exchange.id },
        });
        this.emailService.sendCompletedExchangeNotification(
          user,
          exchange.payinAmount,
          exchange.payinCurrency,
          exchange.payoutAmount,
          exchange.payoutCurrency
        );
        return;
      }
      if (offering.status === OfferingStatus.Processing) {
        this.checkStatusOfOfferingsFromPFIs([offering.id]);
        return;
      }
      if (offering.status !== OfferingStatus.Pending) {
        return;
      }

      const [userKycVcJwt, did, pfiOffering] = await Promise.all([
        this.getUserKycVcJtwt(user),
        this.getDid(),
        this.getOfferingsById(offering.pfiOfferingId),
      ]);
      if (!pfiOffering) {
        return;
      }
      const selectedCredentials = PresentationExchange.selectCredentials({
        vcJwts: [userKycVcJwt],
        presentationDefinition: pfiOffering.data.requiredClaims,
      });

      const payinPaymentDetails =
        this.paymentDetailsMap[pfiOffering.data.payin.methods[0].kind];
      const payoutPaymentDetails =
        this.paymentDetailsMap[pfiOffering.data.payout.methods[0].kind];

      if (!payinPaymentDetails) {
        console.log(
          `missing payin payment details for kind: ${pfiOffering.data.payin.methods[0].kind}`
        );
        return;
      }

      if (!payoutPaymentDetails) {
        console.log(
          `missing payin payment details for kind: ${pfiOffering.data.payout.methods[0].kind}`,
          pfiOffering.data.payout.methods[0].requiredPaymentDetails
        );
        return;
      }
      const rfq = this.rfq.create({
        metadata: {
          to: pfiOffering.metadata.from,
          from: did.uri,
          protocol: pfiOffering.metadata.protocol,
        },
        data: {
          offeringId: pfiOffering.metadata.id,
          payin: {
            kind: pfiOffering.data.payin.methods[0].kind,
            amount: offering.expectedPayinAmount.toString(),
            paymentDetails: payinPaymentDetails,
          },
          payout: {
            kind: pfiOffering.data.payout.methods[0].kind,
            paymentDetails: payoutPaymentDetails,
          },
          claims: selectedCredentials,
        },
      });

      try {
        await rfq.verifyOfferingRequirements(pfiOffering);
        await rfq.sign(did);
        await this.tbdexHttpClient.createExchange(rfq);
        offering.pfiExchangeId = rfq.exchangeId;
        offering.status = OfferingStatus.Processing;
        offering.transactionStartDate = moment().toDate();
        exchange.status = ExchangeStatus.Processing;
        await exchange.save();
        await offering.save();
      } catch (e) {
        console.log("error verifyOfferingRequirements", e);
      }
    } catch (err) {
      console.log("Error processing exchange", exchange.id, err);
    }
  }

  @Interval(60 * 100) // every 1 min
  async checkStatusOfOfferingsFromPFIs(ids?: string[]) {
    const query: any = {
      status: {
        $in: [
          OfferingStatus.Processing,
          OfferingStatus.AwaitingOrder,
          OfferingStatus.OrderPlaced,
        ],
      },
      isDeleted: false,
      ...(ids && ids.length && { _id: { $in: ids } }),
    };

    const offerings = await this.offeringModel.find(query).populate("pfi");
    if (!offerings.length) {
      return;
    }
    const offeringsGroupByPfiDid = groupBy(offerings, "pfi.did");

    const did = await this.getDid();

    // Process each PFI group in parallel
    await Promise.all(
      Object.entries(offeringsGroupByPfiDid).map(
        async ([pfiDid, pfiOfferings]) => {
          try {
            const exchanges = await this.tbdexHttpClient.getExchanges({
              did,
              pfiDid,
              filter: {
                id: pfiOfferings.map((i) => i.pfiExchangeId),
              },
            });

            const offeringKeyedByExchangeId = keyBy(
              pfiOfferings,
              (o) => o.pfiExchangeId
            );

            const exchangesToBeProcessed = [];

            // Process each exchange and update offerings accordingly
            exchanges.forEach((messages) => {
              const lastMessage = messages.at(-1);
              const { kind } = lastMessage.metadata;
              const offering =
                offeringKeyedByExchangeId[lastMessage.metadata.exchangeId];
              if (!offering) return;

              switch (kind) {
                case "quote":
                  offering.pfiQuoteExpiresAt = moment(
                    (lastMessage.data as any).expiresAt
                  ).toDate();
                  offering.status = OfferingStatus.AwaitingOrder;
                  offering.pfiFee = Number(
                    (lastMessage.data as any).payin.fee || 0
                  );
                  this.createOrder([offering.id]);
                  break;

                case "order":
                  break;

                case "close":
                  const isSuccessful = (lastMessage.data as any).success;
                  offering.status = isSuccessful
                    ? OfferingStatus.Completed
                    : OfferingStatus.Cancelled;
                  if (isSuccessful) {
                    exchangesToBeProcessed.push(offering.exchange);
                    offering.transactionEndDate = moment(
                      lastMessage.metadata.createdAt
                    ).toDate();
                  } else {
                    offering.cancellationReason = (
                      lastMessage.data as any
                    ).reason;
                  }
                  break;

                case "orderstatus":
                  offering.pfiOrderStatus = (
                    lastMessage.data as any
                  ).orderStatus;
                  break;

                default:
                  break;
              }
            });
            // Bulk save offerings
            await this.offeringModel.bulkWrite(
              pfiOfferings.map((offering) => ({
                updateOne: {
                  filter: { _id: offering.id },
                  update: offering.toObject(),
                },
              }))
            );

            this.processPendingExchanges(exchangesToBeProcessed);
          } catch (err) {
            console.log(
              "Error checking message thread from pfi",
              pfiDid,
              pfiOfferings.length,
              err
            );
          }
        }
      )
    );
  }

  async createOrder(ids?: string[]) {
    const did = await this.getDid();
    const offerings = await this.offeringModel
      .find({
        ...(ids && ids.length && { _id: { $in: ids } }),
        status: OfferingStatus.AwaitingOrder,
        isDeleted: false,
      })
      .populate("pfi");
    await Promise.all(
      offerings.map(async (offering) => {
        try {
          const order = this.order.create({
            metadata: {
              from: did.uri,
              to: (offering.pfi as PfiDocument).did,
              exchangeId: offering.pfiExchangeId,
              protocol: "1.0",
            },
          });
          await order.sign(did);
          await this.tbdexHttpClient.submitOrder(order);
          offering.status = OfferingStatus.OrderPlaced;
          await offering.save();
        } catch (error) {
          console.error(
            `Failed to process order for offering ${offering.id}:`,
            error
          );
          // Optionally, handle the error further, e.g., log it, send a notification, etc.
        }
      })
    );
  }

  async closeOffering(ids?: string[], reason?: string) {
    const did = await this.getDid();
    const offerings = await this.offeringModel
      .find({
        ...(ids && ids.length && { _id: { $in: ids } }),
        status: {
          $in: [OfferingStatus.Processing, OfferingStatus.AwaitingOrder],
        },
        isDeleted: false,
      })
      .populate("pfi");
    await Promise.all(
      offerings.map(async (offering) => {
        try {
          const close = this.close.create({
            metadata: {
              from: did.uri,
              to: (offering.pfi as PfiDocument).did,
              exchangeId: offering.pfiExchangeId,
              protocol: "1.0",
            },
            data: {
              reason,
            },
          });
          await close.sign(did);
          await this.tbdexHttpClient.submitClose(close);
          offering.status = OfferingStatus.Cancelled;
          await offering.save();
          await this.exchangeModel.updateOne(
            { _id: offering.exchange },
            { $set: { status: ExchangeStatus.Cancelled } }
          );
        } catch (error) {
          console.error(`Failed to close offering ${offering.id}:`, error);
          // Optionally, handle the error further, e.g., log it, send a notification, etc.
        }
      })
    );
  }

  private async getDid() {
    return DidDht.import({ portableDid: portableDid });
  }

  private async getUserKycVcJtwt(user: UserDocument) {
    if (user.kycVcJwt) {
      return user.kycVcJwt;
    }
    const vcJwt = await this.request<string>({
      method: "get",
      url: `https://mock-idv.tbddev.org/kcc?name=${user.name}&country=${user.country}&did=${user.did}`,
    });
    user.kycVcJwt = vcJwt;
    await user.save();
    return vcJwt;
  }
}
