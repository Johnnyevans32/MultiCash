import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Connection, Model, PaginateModel } from "mongoose";
import { Mutex, MutexInterface } from "async-mutex";

import {
  BENEFIARY,
  WALLET,
  WALLET_CURRENCY,
  WALLET_TRANSACTION,
} from "@/core/constants/schema.constants";
import {
  SupportedCurrencyEnum,
  WalletDocument,
} from "@/wallet/schemas/wallet.schema";
import {
  AVAILABLE_BALANCE,
  CreateBenefiarytDTO,
  CreateWalletTxnDTO,
  WithdrawFromWalletDTO,
} from "@/wallet/dtos/wallet.dto";
import {
  TransactionPurpose,
  TransactionType,
  WalletTransactionDocument,
} from "@/wallet/schemas/wallet-transaction.schema";
import { UserDocument } from "@/user/schemas/user.schema";
import { PaginateDTO } from "@/core/services/response.service";
import { WalletCurrencyDocument } from "../schemas/wallet-currency.schema";
import { UtilityService } from "@/core/services/util.service";
import { PaymentService } from "@/payment/services/payment.service";
import { TransferPurpose } from "@/payment/schemas/transfer-record.schema";
import { BenefiaryDocument } from "../schemas/benefiary.schema";
import { BankDocument } from "@/payment/schemas/bank.schema";
import { RevenueService } from "@/revenue/services/revenue.service";
import { RevenueSource } from "@/revenue/schemas/revenue.schema";
import { EmailService } from "@/notification/email/email.service";
import { UserService } from "@/user/services/user.service";

@Injectable()
export class WalletService {
  private locks: Map<string, MutexInterface>;

  constructor(
    @InjectModel(WALLET) private walletModel: Model<WalletDocument>,
    @InjectModel(BENEFIARY)
    private benefiaryModel: Model<BenefiaryDocument>,
    @InjectModel(WALLET_TRANSACTION)
    private walletTransactionModel: PaginateModel<WalletTransactionDocument>,
    @InjectModel(WALLET_CURRENCY)
    private walletCurrencyModel: Model<WalletCurrencyDocument>,
    @InjectConnection() private readonly connection: Connection,
    @Inject(forwardRef(() => PaymentService))
    private readonly paymentService: PaymentService,
    private readonly revenueService: RevenueService,
    private emailService: EmailService,
    private userService: UserService
  ) {
    this.locks = new Map();
  }

  async onModuleInit() {
    const currencyData = [
      {
        currency: SupportedCurrencyEnum.USD,
        name: "US Dollar",
        logo: "usd.png",
        exchangePercentageFee: 0.02,
        maxExchangeFee: 50, // max exchange fee as amount
        transferFee: 2, // transfer fee as amount
      },
      {
        currency: SupportedCurrencyEnum.GBP,
        name: "British Pound",
        logo: "gbp.png",
        exchangePercentageFee: 0.03,
        maxExchangeFee: 40,
        transferFee: 3,
      },
      {
        currency: SupportedCurrencyEnum.EUR,
        name: "Euro",
        logo: "eur.png",
        exchangePercentageFee: 0.025,
        maxExchangeFee: 45,
        transferFee: 2.5,
      },
      {
        currency: SupportedCurrencyEnum.NGN,
        name: "Nigerian Naira",
        logo: "ngn.png",
        exchangePercentageFee: 0.05,
        maxExchangeFee: 5000,
        transferFee: 100,
      },
      {
        currency: SupportedCurrencyEnum.GHS,
        name: "Ghanaian Cedi",
        logo: "ghs.png",
        exchangePercentageFee: 0.04,
        maxExchangeFee: 450,
        transferFee: 15,
      },
      {
        currency: SupportedCurrencyEnum.KES,
        name: "Kenyan Shilling",
        logo: "kes.png",
        exchangePercentageFee: 0.045,
        maxExchangeFee: 300,
        transferFee: 20,
      },
      {
        currency: SupportedCurrencyEnum.ZAR,
        name: "South African Rand",
        logo: "zar.png",
        exchangePercentageFee: 0.045,
        maxExchangeFee: 600,
        transferFee: 25,
      },
      {
        currency: SupportedCurrencyEnum.USDC,
        name: "USD Coin",
        logo: "usdc.png",
        exchangePercentageFee: 0.01,
        maxExchangeFee: 5,
        transferFee: 1,
      },
      {
        currency: SupportedCurrencyEnum.BTC,
        name: "Bitcoin",
        logo: "btc.png",
        exchangePercentageFee: 0.015,
        maxExchangeFee: 30,
        transferFee: 10,
      },
      {
        currency: SupportedCurrencyEnum.AUD,
        name: "Australian Dollar",
        logo: "aud.png",
        exchangePercentageFee: 0.03,
        maxExchangeFee: 35,
        transferFee: 3,
      },
      {
        currency: SupportedCurrencyEnum.MXN,
        name: "Mexican Peso",
        logo: "mxn.png",
        exchangePercentageFee: 0.035,
        maxExchangeFee: 25,
        transferFee: 17,
      },
    ];

    await Promise.all(
      currencyData.map(
        async ({
          currency,
          name,
          exchangePercentageFee,
          transferFee,
          maxExchangeFee,
          logo,
        }) => {
          await this.walletCurrencyModel.findOneAndUpdate(
            { currency },
            { name, exchangePercentageFee, maxExchangeFee, transferFee, logo },
            { upsert: true, new: true }
          );
        }
      )
    );
  }

  async getWalletCurrency(currency: SupportedCurrencyEnum) {
    return this.walletCurrencyModel.findOne({ currency, isDeleted: false });
  }

  async getWalletCurrencies(currencies: SupportedCurrencyEnum[]) {
    return this.walletCurrencyModel.find({
      currency: { $in: currencies },
      isDeleted: false,
    });
  }

  async fetchWallets(user: UserDocument) {
    const existingWallets = await this.walletModel.find({
      user: user.id,
      isDeleted: false,
    });

    const existingCurrencies = new Set(
      existingWallets.map((wallet) => wallet.currency)
    );

    const walletsToCreate = Object.values(SupportedCurrencyEnum)
      .filter((currency) => !existingCurrencies.has(currency))
      .map((currency) => ({
        user: user.id,
        currency,
      }));

    if (walletsToCreate.length > 0) {
      await this.walletModel.insertMany(walletsToCreate);
    }

    return await this.walletModel
      .find({
        user: user.id,
        isDeleted: false,
      })
      .populate({
        path: "walletCurrency",
        select:
          "name logo withdrawalEnabled fundingEnabled transferFee exchangePercentageFee maxExchangeFee",
      })
      .select("availableBalance currency");
  }

  async fetchWalletTransactions(
    user: UserDocument,
    wallet: string,
    query: PaginateDTO
  ) {
    if (!wallet) {
      throw new BadRequestException("wallet id is required");
    }
    const { page = 1, limit = 10, search, all = false } = query;
    const { docs: data, ...metadata } =
      await this.walletTransactionModel.paginate(
        {
          isDeleted: false,
          user: user.id,
          wallet,
          ...(search && { description: { $regex: search, $options: "i" } }),
        },
        {
          sort: { createdAt: -1 },
          page,
          limit,
          pagination: !all,
          select:
            "amount description type purpose currency createdAt walletStateAfter.availableBalance walletStateAfter.currency walletStateBefore.availableBalance note",
        }
      );
    return { data, metadata };
  }

  private async getOrCreateMutex(walletId: string) {
    let mutex = this.locks.get(walletId);
    if (!mutex) {
      mutex = new Mutex();
      this.locks.set(walletId, mutex);
    }
    return mutex;
  }

  private async validateDuplicateReference(
    user: string,
    reference: string,
    wallet: string
  ): Promise<void> {
    const existingTxn = await this.walletTransactionModel.findOne({
      user,
      reference,
      wallet,
    });
    if (existingTxn) {
      throw new BadRequestException(
        `Transaction with reference ${reference} already exists for wallet`
      );
    }
  }

  private async fetchWallet(
    user: string,
    currency: SupportedCurrencyEnum
  ): Promise<WalletDocument> {
    const wallet = await this.walletModel.findOneAndUpdate(
      { user, isDeleted: false, currency },
      {},
      { upsert: true, new: true }
    );

    return wallet;
  }

  private async executeTransaction(
    wallet: WalletDocument,
    transactionPayload: any,
    amount: number,
    balanceKeys: string[]
  ): Promise<WalletTransactionDocument> {
    const clientSession = await this.connection.startSession();
    let transaction: WalletTransactionDocument;

    await clientSession.withTransaction(async (session) => {
      balanceKeys.forEach((k) => {
        wallet[k] += amount;
      });

      transactionPayload.walletStateAfter = wallet.toJSON();
      [transaction] = await this.walletTransactionModel.create(
        [transactionPayload],
        { session }
      );
      await wallet.save({ session });
    });

    return transaction;
  }

  async creditWallet(
    payload: CreateWalletTxnDTO
  ): Promise<WalletTransactionDocument> {
    const {
      user,
      reference,
      amount,
      description,
      currency,
      balanceKeys,
      purpose,
      meta,
    } = payload;

    const wallet = await this.fetchWallet(user, currency);
    await this.validateDuplicateReference(user, reference, wallet.id);
    const mutex = await this.getOrCreateMutex(wallet.id);
    const release = await mutex.acquire();

    try {
      const transactionPayload = {
        user,
        reference,
        type: TransactionType.CREDIT,
        purpose,
        description,
        wallet: wallet.id,
        walletStateBefore: wallet.toJSON(),
        amount,
        meta,
        currency,
      };

      const txn = await this.executeTransaction(
        wallet,
        transactionPayload,
        amount,
        balanceKeys
      );

      if (purpose === TransactionPurpose.DEPOSIT) {
        const user = await this.userService.findUser({ _id: wallet.user });
        this.emailService.sendWalletFundingNotification(
          user,
          amount,
          wallet.availableBalance + amount,
          currency
        );
      }
      return txn;
    } finally {
      release();
    }
  }

  async debitWallet(
    payload: CreateWalletTxnDTO
  ): Promise<WalletTransactionDocument> {
    const {
      user,
      reference,
      amount,
      description,
      currency,
      balanceKeys,
      purpose,
      meta,
      fee,
      note,
    } = payload;

    const wallet = await this.fetchWallet(user, currency);
    await this.validateDuplicateReference(user, reference, wallet.id);
    const mutex = await this.getOrCreateMutex(wallet.id);
    const release = await mutex.acquire();

    try {
      balanceKeys.forEach((k) => {
        if (k === AVAILABLE_BALANCE && wallet[k] < amount) {
          throw new BadRequestException(
            "insufficient balance to perform the action"
          );
        }
      });

      const transactionPayload = {
        user,
        reference,
        type: TransactionType.DEBIT,
        purpose,
        description,
        wallet: wallet.id,
        walletStateBefore: wallet.toJSON(),
        amount,
        meta,
        currency,
        fee,
        note,
      };

      return await this.executeTransaction(
        wallet,
        transactionPayload,
        -amount,
        balanceKeys
      );
    } finally {
      release();
    }
  }

  async withdraw(user: UserDocument, payload: WithdrawFromWalletDTO) {
    const isMatch = await UtilityService.verifyPassword(
      payload.password,
      user.password
    );

    if (!isMatch) {
      throw new BadRequestException("invalid password");
    }
    const { amount, note, benefiary: benefiaryId } = payload;

    const benefiary = await this.benefiaryModel
      .findOne({
        _id: benefiaryId,
        user: user.id,
        isDeleted: false,
      })
      .populate("bank wallet");

    if (!benefiary) {
      throw new BadRequestException("invalid benefiary");
    }

    const { accountNumber, accountName } = benefiary;
    const bank = benefiary.bank as BankDocument;
    const wallet = await this.walletModel.findOne({
      user: user.id,
      isDeleted: false,
      currency: bank.currency,
    });
    await wallet.populate("walletCurrency");
    const { currency, transferFee } = wallet.walletCurrency;
    const reference = UtilityService.generateRandomHex(12);

    const txn = await this.debitWallet({
      amount: amount + transferFee,
      currency,
      balanceKeys: [AVAILABLE_BALANCE],
      description: `Withdrew money to ${accountNumber} of ${bank.name}`,
      reference,
      user: user.id,
      purpose: TransactionPurpose.WITHDRAWAL,
      fee: transferFee,
      note,
    });

    await this.revenueService.createRevenue({
      amount: transferFee,
      source: RevenueSource.WALLET_WITHDRAWAL,
      currency,
      reference: `rev_${txn.id}`,
      meta: { walletTransactionId: txn.id },
    });

    await this.paymentService.transferToAccount({
      purpose: TransferPurpose.WALLET_WITHDRAWAL,
      reference,
      description: `withdrawal from user wallet`,
      amount,
      currency,
      bank: bank,
      accountNumber,
      accountName,
      meta: {},
    });

    this.emailService.sendWithdrawalNotification(user, amount, currency);
  }

  async createBenefiary(user: UserDocument, payload: CreateBenefiarytDTO) {
    const { bank: bankId, accountNumber, accountName } = payload;
    const bank = await this.paymentService.fetchBankById(bankId);
    if (!bank) {
      throw new BadRequestException("invalid bank");
    }
    await this.benefiaryModel.findOneAndUpdate(
      { user: user.id, accountNumber, isDeleted: false },
      { bank: bank.id, accountName },
      { upsert: true, new: true }
    );
  }

  async fetchBenefiaries(user: UserDocument) {
    return this.benefiaryModel
      .find({ user: user.id, isDeleted: false })
      .populate({ path: "bank", select: "name currency logo" })
      .select("accountNumber accountName");
  }

  async deleteBenefiary(user: UserDocument, benefiaryId: string) {
    await this.benefiaryModel.updateOne(
      { _id: benefiaryId, user: user.id },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );
  }
}
