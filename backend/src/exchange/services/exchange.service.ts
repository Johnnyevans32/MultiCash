import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Connection, Model, PaginateModel } from "mongoose";
import {
  Offering as PFIOffering,
  Order,
  Rfq,
  TbdexHttpClient,
  Close,
  PayinMethod,
  PayoutMethod,
} from "@tbdex/http-client";
import { Cache } from "cache-manager";
import * as moment from "moment";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { PresentationExchange } from "@web5/credentials";
import { BearerDid, DidDht } from "@web5/dids";
import { groupBy, keyBy, max, min } from "lodash";
import { Mutex, MutexInterface } from "async-mutex";

import { EXCHANGE, OFFERING, PFI } from "@/core/constants/schema.constants";
import { PfiDocument } from "../schemas/pfi.schema";
import { ExchangeRequestDTO, OfferingDTO, UserKycInfoDTO } from "../types";
import { RequestService } from "@/core/services/request.service";
import { UserDocument } from "@/user/schemas/user.schema";
import { OfferingDocument, OfferingStatus } from "../schemas/offering.schema";
import { SupportedCurrencyEnum } from "@/wallet/schemas/wallet.schema";
import { WalletService } from "@/wallet/services/wallet.service";
import { AVAILABLE_BALANCE } from "@/wallet/dtos/wallet.dto";
import { TransactionPurpose } from "@/wallet/schemas/wallet-transaction.schema";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ExchangeDocument, ExchangeStatus } from "../schemas/exchange.schema";
import { PaginateDTO } from "@/core/services/response.service";
import { RevenueService } from "@/revenue/services/revenue.service";
import { RevenueSource } from "@/revenue/schemas/revenue.schema";
import { EmailService } from "@/notification/email/email.service";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { UtilityService } from "@/core/services/util.service";
import configuration from "@/core/services/configuration";
import { FcmService } from "@/notification/fcm/fcm.service";

@Injectable()
export class ExchangeService extends RequestService {
  private locks: Map<string, MutexInterface>;

  private tbdexHttpClient: typeof TbdexHttpClient;
  private rfq: typeof Rfq;
  private order: typeof Order;
  private close: typeof Close;

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
    private emailService: EmailService,
    private fcmService: FcmService
  ) {
    super();
    this.locks = new Map();
  }

  private getOrCreateMutex(service: string) {
    let mutex = this.locks.get(service);
    if (!mutex) {
      mutex = new Mutex();
      this.locks.set(service, mutex);
    }
    return mutex;
  }

  private async loadTbdexModules() {
    const module = await eval('import("@tbdex/http-client")');
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

    // Perform DFS to find conversion paths
    const dfs = (
      chain: OfferingDTO[],
      lastCurrency: SupportedCurrencyEnum,
      cumulativePayoutUnitsPerPayinUnit: number,
      cumulativeFee: number,
      cumulativeSettlementTimeInSecs: number,
      visitedInChain: Set<SupportedCurrencyEnum>
    ) => {
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
        return;
      }

      // Explore next possible offerings in the chain
      for (const nextOffering of offerings) {
        const nextPayoutCurrency = nextOffering.payoutCurrency;
        const nextPayinCurrency = nextOffering.payinCurrency;

        // Only proceed if we haven't visited the nextPayoutCurrency within this chain
        if (
          nextPayinCurrency === lastCurrency &&
          !visitedInChain.has(nextPayoutCurrency)
        ) {
          dfs(
            [...chain, nextOffering],
            nextPayoutCurrency,
            cumulativePayoutUnitsPerPayinUnit *
              nextOffering.payoutUnitsPerPayinUnit,
            cumulativeFee + nextOffering.fee,
            cumulativeSettlementTimeInSecs +
              nextOffering.estimatedSettlementTimeInSecs,
            new Set([...visitedInChain, nextPayoutCurrency]) // Track visited currencies in this chain
          );
        }
      }
    };

    // Initialize DFS with offerings that match the payinCurrency
    for (const offering of offerings) {
      if (offering.payinCurrency === payinCurrency) {
        dfs(
          [offering],
          offering.payoutCurrency,
          offering.payoutUnitsPerPayinUnit,
          offering.fee,
          offering.estimatedSettlementTimeInSecs,
          new Set([offering.payinCurrency, offering.payoutCurrency])
        );
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
    return max([
      walletCurrency.minExchangeFee,
      min([
        walletCurrency.exchangePercentageFee * amount,
        walletCurrency.maxExchangeFee,
      ]),
    ]);
  }

  async createExchange(user: UserDocument, payload: ExchangeRequestDTO) {
    const fields = plainToInstance(UserKycInfoDTO, {
      country: user.country,
      did: user.did,
      name: user.name,
    });
    const errors = await validate(fields);
    if (errors.length > 0) {
      const errorMessages = errors
        .map(
          (error) =>
            `${error.property}: ${Object.values(error.constraints).join(", ")}`
        )
        .join("; ");
      throw new Error(`Validation failed: ${errorMessages}`);
    }

    const {
      payinAmount,
      payoutAmount,
      totalPayinAmount,
      platformFee,
      providerFee,
      totalFee,
      payinCurrency,
      payoutCurrency,
      payoutUnitsPerPayinUnit,
      offerings: formattedOfferings,
    } = await this.fetchExchangeSummary(payload);

    let exchange: ExchangeDocument;
    const session = await this.connection.startSession();

    await session.withTransaction(async () => {
      [exchange] = await this.exchangeModel.create(
        [
          {
            user: user.id,
            payinAmount,
            payoutAmount,
            platformFee,
            providerFee,
            totalFee,
            payinCurrency,
            payoutCurrency,
            payoutUnitsPerPayinUnit,
            totalPayinAmount,
          },
        ],
        { session }
      );

      await this.offeringModel.insertMany(
        formattedOfferings.map(
          ({
            pfiOfferingId,
            pfi,
            description,
            payoutUnitsPerPayinUnit,
            payinCurrency,
            payoutCurrency,
            expectedPayinAmount,
            expectedPayoutAmount,
          }) => ({
            pfiOfferingId,
            user: user.id,
            exchange: exchange.id,
            pfi,
            description,
            payoutUnitsPerPayinUnit,
            payinCurrency,
            payoutCurrency,
            expectedPayinAmount,
            expectedPayoutAmount,
          })
        ),
        { session }
      );

      await this.walletService.debitWallet({
        amount: totalPayinAmount,
        currency: payinCurrency,
        balanceKeys: [AVAILABLE_BALANCE],
        description: `Exchange to ${payoutCurrency}`,
        reference: `debit_${exchange.id}`,
        user: user.id,
        meta: { exchangeId: exchange.id },
        purpose: TransactionPurpose.CURRENCY_EXCHANGE,
      });
    });

    if (exchange) this.processExchange(exchange);
  }

  async fetchExchangeSummary(payload: ExchangeRequestDTO) {
    const { offerings, payinAmount } = payload;

    const [pfis, pfisOfferings] = await Promise.all([
      this.fetchPfis(),
      this.getOfferingsFromPFIs(),
    ]);

    const pfisGroupedByDid = new Map(pfis.map((pfi) => [pfi.did, pfi.id]));
    const pfisOfferingsKeyedById = new Map(
      pfisOfferings.map((offering) => [offering.metadata.id, offering])
    );

    const offeringDetails = offerings.map((pfiOfferingId) => {
      const pfiOffering = pfisOfferingsKeyedById.get(pfiOfferingId);
      if (!pfiOffering) {
        throw new BadRequestException(
          `invalid offering passed: ${pfiOfferingId}`
        );
      }
      return this.formatOffering(pfiOffering);
    });

    this.validateOfferingChain(offeringDetails);

    const { payinCurrency } = offeringDetails.at(0);
    const { payoutCurrency } = offeringDetails.at(-1);
    const platformFee = await this.calculateExchangeFee(
      payinCurrency,
      payinAmount
    );
    const providerFee = 0;
    const totalFee = platformFee + providerFee;
    const totalPayinAmount = payinAmount + totalFee;
    const payoutUnitsPerPayinUnit = offeringDetails.reduce(
      (acc, o) => acc * o.payoutUnitsPerPayinUnit,
      1
    );
    const payoutAmount = payinAmount * payoutUnitsPerPayinUnit;

    let currentPayinAmount = payinAmount;
    const formattedOfferings = offeringDetails.map((offering) => {
      const {
        payoutUnitsPerPayinUnit,
        pfiDid,
        payinCurrency,
        payoutCurrency,
        description,
        pfiOfferingId,
      } = offering;

      const expectedPayoutAmount = currentPayinAmount * payoutUnitsPerPayinUnit;

      const formattedOffering = {
        pfiOfferingId,
        pfi: pfisGroupedByDid.get(pfiDid),
        description,
        payoutUnitsPerPayinUnit,
        payinCurrency,
        payoutCurrency,
        expectedPayinAmount: currentPayinAmount,
        expectedPayoutAmount,
      };

      currentPayinAmount = expectedPayoutAmount;

      return formattedOffering;
    });

    return {
      offerings: formattedOfferings,
      payinAmount,
      payoutAmount,
      totalPayinAmount,
      platformFee,
      providerFee,
      totalFee,
      payinCurrency,
      payoutCurrency,
      payoutUnitsPerPayinUnit,
    };
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
          "payinAmount payoutAmount payinCurrency payoutCurrency payoutUnitsPerPayinUnit totalFee status createdAt rating comment completionDate",
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

  @Cron(CronExpression.EVERY_10_MINUTES)
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
        exchange.completionDate = moment().toDate();
        await exchange.save();
        await this.walletService.creditWallet({
          amount: exchange.payoutAmount,
          currency: exchange.payoutCurrency,
          balanceKeys: [AVAILABLE_BALANCE],
          description: `Exchange from ${exchange.payinCurrency}`,
          reference: `credit_${exchange.id}`,
          user: user.id,
          meta: { exchangeId: exchange.id },
          purpose: TransactionPurpose.CURRENCY_EXCHANGE,
        });

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
        this.fcmService.sendPushNotification(user, {
          title: "Currency Exchange Completed",
          body: `You have successfully exchanged ${UtilityService.formatMoney(exchange.payinAmount, exchange.payinCurrency)} to ${UtilityService.formatMoney(exchange.payoutAmount, exchange.payoutCurrency)}.`,
        });
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

      const payinPaymentDetails = this.generateDummyPaymentDetails(
        pfiOffering.data.payin.methods[0]
      );

      const payoutPaymentDetails = this.generateDummyPaymentDetails(
        pfiOffering.data.payout.methods[0]
      );

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

      await rfq.verifyOfferingRequirements(pfiOffering);
      await rfq.sign(did);
      await this.tbdexHttpClient.createExchange(rfq);
      await this.offeringModel.findOneAndUpdate(
        {
          _id: offering.id,
          status: OfferingStatus.Pending,
        },
        {
          $set: {
            pfiExchangeId: rfq.exchangeId,
            status: OfferingStatus.Processing,
            transactionStartDate: moment().toDate(),
          },
        }
      );
      exchange.status = ExchangeStatus.Processing;
      await exchange.save();
      await offering.save();
      this.fcmService.sendPushNotification(user, {
        title: "Exchange Route Update",
        body: `Exchange route ${offering.payinCurrency} to ${offering.payoutCurrency} is now awaiting quote.`,
      });
    } catch (err) {
      console.log("Error processing exchange", exchange.id, err);
    }
  }

  @Cron("0 */2 * * * *")
  async checkStatusOfOfferingsFromPFIs(ids?: string[]) {
    const mutex = this.getOrCreateMutex("checkStatusOfOfferingsFromPFIs");
    const release = await mutex.acquire();
    console.log("starting checkStatusOfOfferingsFromPFIs");
    try {
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

      const offerings = await this.offeringModel
        .find(query)
        .populate("pfi user");
      if (!offerings.length) {
        return;
      }
      const offeringsGroupByPfiDid = groupBy(offerings, "pfi.did");

      const did = await this.getDid();

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
              const offeringsToBeRefunded = [];
              const offeringsToCreateOrder = [];

              exchanges.forEach((messages) => {
                console.log(JSON.stringify(messages));
                const lastMessage = messages.at(-1);
                const { kind } = lastMessage.metadata;
                const offering =
                  offeringKeyedByExchangeId[lastMessage.metadata.exchangeId];
                if (!offering) return;
                const user = offering.user as UserDocument;
                switch (kind) {
                  case "quote":
                    if ([OfferingStatus.Processing].includes(offering.status)) {
                      offering.pfiQuoteExpiresAt = moment(
                        (lastMessage.data as any).expiresAt
                      ).toDate();
                      offering.status = OfferingStatus.AwaitingOrder;
                      offering.pfiFee = Number(
                        (lastMessage.data as any).payin.fee || 0
                      );
                      offeringsToCreateOrder.push(offering.id);
                      this.fcmService.sendPushNotification(user, {
                        title: "Exchange Route Update",
                        body: `Exchange route ${offering.payinCurrency} to ${offering.payoutCurrency} is now awaiting order.`,
                      });
                    }
                    break;

                  case "order":
                    this.fcmService.sendPushNotification(user, {
                      title: "Exchange Route Update",
                      body: `Exchange route ${offering.payinCurrency} to ${offering.payoutCurrency} order has been placed.`,
                    });
                    break;

                  case "close":
                    if (
                      [OfferingStatus.OrderPlaced].includes(offering.status)
                    ) {
                      const isSuccessful = (lastMessage.data as any).success;
                      offering.status = isSuccessful
                        ? OfferingStatus.Completed
                        : OfferingStatus.Cancelled;
                      offering.transactionEndDate = moment(
                        lastMessage.metadata.createdAt
                      ).toDate();
                      if (isSuccessful) {
                        exchangesToBeProcessed.push(offering.exchange);

                        this.fcmService.sendPushNotification(user, {
                          title: "Exchange Route Update",
                          body: `Exchange route ${offering.payinCurrency} to ${offering.payoutCurrency} has been completed.`,
                        });
                      } else {
                        offering.cancellationReason = (
                          lastMessage.data as any
                        ).reason;
                        offeringsToBeRefunded.push(offering.id);
                        this.fcmService.sendPushNotification(user, {
                          title: "Exchange Route Update",
                          body: `Exchange route ${offering.payinCurrency} to ${offering.payoutCurrency} has been cancelled.`,
                        });
                      }
                    }
                    break;

                  case "orderstatus":
                    if (
                      [OfferingStatus.OrderPlaced].includes(offering.status)
                    ) {
                      const orderStatus = (lastMessage.data as any).orderStatus;
                      offering.pfiOrderStatus = orderStatus;
                      this.fcmService.sendPushNotification(user, {
                        title: "Exchange Route Update",
                        body: `Exchange route ${offering.payinCurrency} to ${offering.payoutCurrency} order status is ${orderStatus}.`,
                      });
                    }
                    break;

                  default:
                    break;
                }
              });
              await this.offeringModel.bulkWrite(
                pfiOfferings.map((offering) => ({
                  updateOne: {
                    filter: { _id: offering.id },
                    update: offering.toObject(),
                  },
                }))
              );

              await Promise.all([
                this.processPendingExchanges(exchangesToBeProcessed),
                this.refundCancelledOffering(offeringsToBeRefunded),
                this.createOrder(offeringsToCreateOrder),
              ]);
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
    } finally {
      release();
      console.log("done checkStatusOfOfferingsFromPFIs");
    }
  }

  async refundCancelledOffering(offeringIds: string[]) {
    const offerings = await this.offeringModel
      .find({
        _id: { $in: offeringIds },
        isDeleted: false,
        status: OfferingStatus.Cancelled,
        isRefunded: { $ne: true },
      })
      .populate("exchange");

    await Promise.all(
      offerings.map(async (offering) => {
        const exchange = offering.exchange as ExchangeDocument;
        await this.walletService.creditWallet({
          amount: offering.expectedPayinAmount,
          currency: offering.payinCurrency,
          balanceKeys: [AVAILABLE_BALANCE],
          description: `Refund of Canceled Exchange`,
          reference: `credit_${exchange.id}`,
          user: offering.user as string,
          meta: { exchangeId: exchange.id },
          purpose: TransactionPurpose.CURRENCY_EXCHANGE,
        });
        offering.isRefunded = true;

        exchange.status = ExchangeStatus.PartiallyCompleted;
        await offering.save();
        await exchange.save();
      })
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
            JSON.stringify(error)
          );
          // Optionally, handle the error further, e.g., log it, send a notification, etc.
        }
      })
    );
  }

  async closeOffering(user: UserDocument, offeringId: string, reason: string) {
    const did = await this.getDid();
    const offering = await this.offeringModel
      .findOne({
        _id: offeringId,
        user: user.id,
        status: {
          $in: [OfferingStatus.Processing, OfferingStatus.AwaitingOrder],
        },
        isDeleted: false,
      })
      .populate("pfi exchange");
    if (!offering) throw new BadRequestException("offering is invalid");

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
    const exchange = offering.exchange as ExchangeDocument;
    await this.exchangeModel.updateOne(
      { _id: exchange.id },
      { $set: { status: ExchangeStatus.Cancelled } }
    );
    await this.walletService.creditWallet({
      amount: offering.expectedPayinAmount,
      currency: offering.payinCurrency,
      balanceKeys: [AVAILABLE_BALANCE],
      description: `Canceled Exchange of ${exchange.payinCurrency} to ${exchange.payoutCurrency}`,
      reference: `credit_${exchange.id}`,
      user: offering.user as string,
      meta: { exchangeId: exchange.id },
      purpose: TransactionPurpose.CURRENCY_EXCHANGE,
    });

    this.fcmService.sendPushNotification(user, {
      title: "Exchange Route Update",
      body: `Exchange route ${offering.payinCurrency} to ${offering.payoutCurrency} has been cancelled.`,
    });
  }

  private async getDid() {
    const cacheKey = "portableDid";
    let did = await this.cacheManager.get<BearerDid>(cacheKey);
    if (did) {
      return did;
    }

    const decodedDidJson = JSON.parse(
      Buffer.from(configuration().app.portableDidInBase64, "base64").toString(
        "utf-8"
      )
    );
    did = await DidDht.import({ portableDid: decodedDidJson });

    await this.cacheManager.set(cacheKey, did, 24 * 60 * 60 * 1000);
    return did;
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

  private generateDummyPaymentDetails(
    method: PayinMethod | PayoutMethod
  ): Record<string, any> {
    const defaultTypeToValueMap: Record<string, any> = {
      string: "",
      number: 0,
      boolean: false,
    };

    const { requiredPaymentDetails } = method;
    if (!requiredPaymentDetails || !requiredPaymentDetails["properties"]) {
      return {};
    }

    const paymentDetails: Record<string, any> = {};
    for (const [key, property] of Object.entries(
      requiredPaymentDetails["properties"]
    )) {
      paymentDetails[key] =
        defaultTypeToValueMap[(property as any).type] ?? null;
    }

    return paymentDetails;
  }

  /**
   * Validates that the `payinCurrency` of each offering correctly connects to the `payoutCurrency` of the previous one.
   * If there's a mismatch, it throws a `BadRequestException`.
   *
   * @param offerings List of offerings to validate.
   * @throws BadRequestException If there is a currency mismatch in the chain.
   */
  private validateOfferingChain(
    offerings: Array<{
      payinCurrency: SupportedCurrencyEnum;
      payoutCurrency: SupportedCurrencyEnum;
    }>
  ): void {
    if (offerings.length < 2) return; // No chain to validate

    offerings.reduce((prev, current, index) => {
      if (prev.payoutCurrency !== current.payinCurrency) {
        throw new BadRequestException(
          `Invalid currency flow at step ${index + 1}: Expected ${prev.payoutCurrency} but received ${current.payinCurrency}.`
        );
      }
      return current;
    });
  }
}
