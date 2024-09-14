import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Connection, Model, PaginateModel } from "mongoose";
import { Mutex, MutexInterface } from "async-mutex";

import {
  BENEFICIARY,
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
  CreateWalletTxnDTO,
  WithdrawFromWalletDTO,
  CreateBeneficiaryDTO,
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
import {
  BeneficiaryDocument,
  BeneficiaryType,
} from "../schemas/beneficiary.schema";
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
    @InjectModel(BENEFICIARY)
    private beneficiaryModel: Model<BeneficiaryDocument>,
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

  private getOrCreateMutex(walletId: string) {
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
      isDeleted: false,
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
      sender,
    } = payload;

    const wallet = await this.fetchWallet(user, currency);
    const mutex = this.getOrCreateMutex(wallet.id);
    const release = await mutex.acquire();
    await this.validateDuplicateReference(user, reference, wallet.id);

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
        sender,
      };

      const txn = await this.executeTransaction(
        wallet,
        transactionPayload,
        amount,
        balanceKeys
      );

      if ([TransactionPurpose.DEPOSIT].includes(purpose)) {
        const userObj = await this.userService.findUser({ _id: wallet.user });
        this.emailService.sendWalletFundingNotification(
          userObj,
          amount,
          currency
        );
      }

      if ([TransactionPurpose.TRANSFER_CREDIT].includes(purpose)) {
        const [userObj, senderObj] = await Promise.all([
          this.userService.findUser({ _id: wallet.user }),
          this.userService.findUser({ _id: sender }),
        ]);
        this.emailService.sendEmail(
          userObj,
          "Wallet Transfer Confirmation",
          "transfer-success-receiver.njk",
          {
            amount: UtilityService.formatMoney(amount, currency),
            sender: senderObj,
          }
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
      receiver,
    } = payload;

    const wallet = await this.fetchWallet(user, currency);
    const mutex = this.getOrCreateMutex(wallet.id);
    const release = await mutex.acquire();
    await this.validateDuplicateReference(user, reference, wallet.id);

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
        receiver,
      };

      const txn = await this.executeTransaction(
        wallet,
        transactionPayload,
        -amount,
        balanceKeys
      );
      if ([TransactionPurpose.TRANSFER_DEBIT].includes(purpose)) {
        const [userObj, receiverObj] = await Promise.all([
          this.userService.findUser({ _id: wallet.user }),
          this.userService.findUser({ _id: receiver }),
        ]);
        this.emailService.sendEmail(
          userObj,
          "Wallet Transfer Confirmation",
          "transfer-success-sender.njk",
          {
            amount: UtilityService.formatMoney(amount, currency),
            receiver: receiverObj,
          }
        );
      }
      return txn;
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
    const { amount, note, beneficiary: beneficiaryId } = payload;
    let { currency } = payload;

    const beneficiary = await this.beneficiaryModel
      .findOne({
        _id: beneficiaryId,
        user: user.id,
        isDeleted: false,
      })
      .populate("bank beneficiaryUser");

    if (!beneficiary) {
      throw new BadRequestException("invalid beneficiary");
    }

    if (beneficiary.type === BeneficiaryType.BankAccount) {
      const { accountNumber, accountName } = beneficiary;
      const bank = beneficiary.bank as BankDocument;
      const wallet = await this.walletModel
        .findOne({
          user: user.id,
          isDeleted: false,
          currency: bank.currency,
        })
        .populate("walletCurrency");
      const { transferFee } = wallet.walletCurrency;
      currency = wallet.walletCurrency.currency;
      const txn = await this.debitWallet({
        amount: amount + transferFee,
        currency,
        balanceKeys: [AVAILABLE_BALANCE],
        description: `Withdrew money to beneficiary`,
        reference: UtilityService.generateRandomHex(12),
        user: user.id,
        purpose: TransactionPurpose.WITHDRAWAL,
        fee: transferFee,
        note,
        meta: { accountName, accountNumber, bankName: bank.name },
      });

      await this.paymentService.transferToAccount({
        purpose: TransferPurpose.WALLET_WITHDRAWAL,
        reference: `wallet_txn_${txn.id}`,
        description: `withdrawal from user wallet`,
        amount,
        currency,
        bank: bank,
        accountNumber,
        accountName,
        meta: {},
      });

      this.revenueService.createRevenue({
        amount: transferFee,
        source: RevenueSource.WALLET_WITHDRAWAL,
        currency,
        reference: `rev_${txn.id}`,
        meta: { walletTransactionId: txn.id },
      });
    }

    if (beneficiary.type === BeneficiaryType.Platform) {
      const receiver = beneficiary.beneficiaryUser as UserDocument;
      const txn = await this.debitWallet({
        amount,
        currency,
        balanceKeys: [AVAILABLE_BALANCE],
        description: `Sent ${amount} ${currency} to @${receiver.tag}`,
        reference: UtilityService.generateRandomHex(12),
        user: user.id,
        purpose: TransactionPurpose.TRANSFER_DEBIT,
        note,
        receiver: receiver.id,
      });

      await this.creditWallet({
        amount,
        currency,
        balanceKeys: [AVAILABLE_BALANCE],
        description: `Received ${amount} ${currency} from @${user.tag}`,
        reference: `transfer_${txn.id}`,
        user: receiver.id,
        purpose: TransactionPurpose.TRANSFER_CREDIT,
        note,
        sender: user.id,
      });
    }

    this.emailService.sendWithdrawalNotification(user, amount, currency);
  }

  async createBeneficiary(user: UserDocument, payload: CreateBeneficiaryDTO) {
    const {
      bank: bankId,
      accountNumber,
      accountName,
      beneficiaryType,
      beneficiaryTag,
    } = payload;

    let updateQuery: any = { type: beneficiaryType };
    let searchQuery: any = { user: user.id, isDeleted: false };

    if (beneficiaryType === BeneficiaryType.BankAccount) {
      const bank = await this.paymentService.fetchBankById(bankId);
      if (!bank) {
        throw new BadRequestException("Invalid bank");
      }

      searchQuery.accountNumber = accountNumber;
      updateQuery = { ...updateQuery, bank: bank.id, accountName };
    } else {
      const beneficiaryUser = await this.userService.findUser({
        tag: beneficiaryTag,
        isDeleted: false,
      });

      if (!beneficiaryUser) {
        throw new BadRequestException("User not found");
      }

      if (beneficiaryUser.id === user.id) {
        throw new BadRequestException("You cant add yourself as beneficiary");
      }

      searchQuery.beneficiaryUser = beneficiaryUser.id;
    }

    await this.beneficiaryModel.findOneAndUpdate(searchQuery, updateQuery, {
      upsert: true,
      new: true,
    });
  }

  async fetchBeneficiaries(user: UserDocument) {
    return this.beneficiaryModel
      .find({ user: user.id, isDeleted: false })
      .populate([
        { path: "bank", select: "name currency logo" },
        { path: "beneficiaryUser", select: "name tag profileImage" },
      ])
      .select("accountNumber accountName type ");
  }

  async deleteBeneficiary(user: UserDocument, beneficiaryId: string) {
    await this.beneficiaryModel.updateOne(
      { _id: beneficiaryId, user: user.id },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );
  }
}
