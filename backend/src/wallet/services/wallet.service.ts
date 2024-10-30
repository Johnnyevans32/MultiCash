import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Connection, Model, PaginateModel } from "mongoose";
import { Mutex, MutexInterface } from "async-mutex";
import * as QRCode from "qrcode";
import * as moment from "moment";
import { v5 as uuidv5 } from "uuid";
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
  TransactionStatus,
  TransactionType,
  WalletTransactionDocument,
} from "@/wallet/schemas/wallet-transaction.schema";
import { UserDocument } from "@/user/schemas/user.schema";
import { PaginateDTO } from "@/core/services/response.service";
import { WalletCurrencyDocument } from "../schemas/wallet-currency.schema";
import { UtilityService } from "@/core/services/util.service";
import { PaymentService } from "@/payment/services/payment.service";
import {
  TransferPurpose,
  TransferRecordDocument,
  TransferStatus,
} from "@/payment/schemas/transfer-record.schema";
import {
  BeneficiaryDocument,
  BeneficiaryType,
} from "../schemas/beneficiary.schema";
import { BankDocument } from "@/payment/schemas/bank.schema";
import { RevenueService } from "@/revenue/services/revenue.service";
import { RevenueSource } from "@/revenue/schemas/revenue.schema";
import { EmailService } from "@/notification/email/email.service";
import { UserService } from "@/user/services/user.service";
import { FcmService } from "@/notification/fcm/fcm.service";
import {
  IWebhookCharge,
  IWebhookResponse,
  IWebhookTransfer,
  WebhookEventEnum,
} from "@/payment/types/payment.type";
import configuration from "@/core/services/configuration";

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
    private userService: UserService,
    private fcmService: FcmService,
    private utilityService: UtilityService
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
      .sort({ updatedAt: -1 })
      .populate({
        path: "walletCurrency",
        select: "name logo withdrawalEnabled fundingEnabled",
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
          ...(search && {
            $or: [
              { description: { $regex: search, $options: "i" } },
              { note: { $regex: search, $options: "i" } },
              { purpose: { $regex: search, $options: "i" } },
            ],
          }),
        },
        {
          sort: { createdAt: -1 },
          page,
          limit,
          pagination: !all,
          select:
            "amount description type purpose currency createdAt walletStateAfter.availableBalance walletStateAfter.currency walletStateBefore.availableBalance note status transferReference",
        }
      );
    return { data, metadata };
  }

  async getTransactionReceipt(user: UserDocument, transactionId: string) {
    const walletTransaction = await this.walletTransactionModel.findOne({
      user: user.id,
      _id: transactionId,
      isDeleted: false,
    });

    if (!walletTransaction) {
      throw new BadRequestException("Transaction invalid");
    }

    const {
      id,
      amount,
      currency,
      fee,
      createdAt,
      type,
      purpose,
      transferReference,
      meta,
      completedAt,
    } = walletTransaction;

    return await this.utilityService.generatePDF(
      {
        id,
        amount: UtilityService.formatMoney(amount, currency),
        fees: [
          {
            name: configuration().app.name,
            value: UtilityService.formatMoney(fee, currency),
          },
        ],
        totalFee: UtilityService.formatMoney(fee, currency),
        transactionAmount: UtilityService.formatMoney(amount - fee, currency),
        transferReference,
        date: moment(createdAt).format("MMMM D, YYYY h:mm:ss A z"),
        ...(completedAt && {
          paidOutAt: moment(completedAt).format("MMMM D, YYYY h:mm:ss A z"),
        }),
        user,
        ...([
          TransactionPurpose.WITHDRAWAL,
          TransactionPurpose.TRANSFER_DEBIT,
        ].includes(purpose)
          ? {
              recipient: {
                name: meta.accountName || meta.receiverName,
                bankName: meta.bankName,
                accountNumber: meta.accountNumber || meta.receiverTag,
                bankCode: meta.bankCode,
              },
            }
          : {}),

        ...([TransactionPurpose.TRANSFER_CREDIT].includes(purpose)
          ? {
              sender: {
                name: meta.senderName,
                accountNumber: meta.senderTag,
              },
            }
          : {}),
      },
      "transaction-receipt.njk"
    );
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
    const { user, reference, amount, currency, balanceKeys, purpose } = payload;

    const wallet = await this.fetchWallet(user, currency);
    const mutex = this.getOrCreateMutex(wallet.id);
    const release = await mutex.acquire();
    await this.validateDuplicateReference(user, reference, wallet.id);

    try {
      const transactionPayload = {
        type: TransactionType.CREDIT,
        wallet: wallet.id,
        walletStateBefore: wallet.toJSON(),
        ...payload,
      };

      const txn = await this.executeTransaction(
        wallet,
        transactionPayload,
        amount,
        balanceKeys
      );

      return txn;
    } finally {
      release();
    }
  }

  async debitWallet(
    payload: CreateWalletTxnDTO
  ): Promise<WalletTransactionDocument> {
    const { user, reference, amount, currency, balanceKeys } = payload;

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
        type: TransactionType.DEBIT,
        wallet: wallet.id,
        walletStateBefore: wallet.toJSON(),
        ...payload,
      };

      const txn = await this.executeTransaction(
        wallet,
        transactionPayload,
        -amount,
        balanceKeys
      );

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
      const {
        accountNumber,
        accountName,
        recipientType,
        bankCode,
        accountType,
        address,
      } = beneficiary;
      const bank = beneficiary.bank as BankDocument;
      let wallet = await this.walletModel
        .findOne({
          user: user.id,
          isDeleted: false,
          currency: beneficiary.currency || bank?.currency,
        })
        .populate("walletCurrency");
      const { transferFee } = wallet.walletCurrency;
      let { currency } = wallet;

      const reference = UtilityService.generateRandomHex(12);
      const txn = await this.debitWallet({
        amount: amount + transferFee,
        currency,
        balanceKeys: [AVAILABLE_BALANCE],
        description: `You sent ${accountName}`,
        reference,
        user: user.id,
        purpose: TransactionPurpose.WITHDRAWAL,
        fee: transferFee,
        note,
        meta: { accountName, accountNumber, bankName: bank?.name, bankCode },
        status: TransactionStatus.Pending,
      });

      const transferReference = uuidv5(txn.id, uuidv5.DNS);
      await this.paymentService.transferToAccount({
        purpose: TransferPurpose.WALLET_WITHDRAWAL,
        reference: transferReference,
        description: `withdrawal from user wallet`,
        amount,
        currency,
        bank: bank,
        accountNumber,
        accountName,
        meta: { walletTransactionId: txn.id },
        bankCode,
        recipientType,
        accountType,
        address,
      });

      txn.transferReference = transferReference;
      txn.status = TransactionStatus.Processing;
      await txn.save();
    }

    if (beneficiary.type === BeneficiaryType.Platform) {
      const receiver = beneficiary.beneficiaryUser as UserDocument;
      const txn = await this.debitWallet({
        amount,
        currency,
        balanceKeys: [AVAILABLE_BALANCE],
        description: `You sent @${receiver.tag}`,
        reference: UtilityService.generateRandomHex(12),
        user: user.id,
        purpose: TransactionPurpose.TRANSFER_DEBIT,
        note,
        receiver: receiver.id,
        meta: { receiverName: receiver.name, receiverTag: receiver.tag },
      });

      const transferReference = `transfer_${txn.id}`;
      await this.creditWallet({
        amount,
        currency,
        balanceKeys: [AVAILABLE_BALANCE],
        description: `@${user.tag} sent you`,
        reference: transferReference,
        user: receiver.id,
        purpose: TransactionPurpose.TRANSFER_CREDIT,
        note,
        sender: user.id,
        meta: {
          walletTransactionId: txn.id,
          senderName: user.name,
          senderTag: user.tag,
        },
      });
      txn.transferReference = transferReference;
      await txn.save();

      this.emailService.sendEmail(
        user,
        "Wallet Transfer Confirmation",
        "transfer-success-sender.njk",
        {
          amount: UtilityService.formatMoney(amount, currency),
          receiver: receiver,
        }
      );
      this.fcmService.sendPushNotification(user, {
        title: "Wallet Transfer",
        body: `You have sent ${UtilityService.formatMoney(amount, currency)} to ${receiver.tag}.`,
      });

      this.emailService.sendEmail(
        receiver,
        "Wallet Transfer Confirmation",
        "transfer-success-receiver.njk",
        {
          amount: UtilityService.formatMoney(amount, currency),
          sender: user,
        }
      );
      this.fcmService.sendPushNotification(receiver, {
        title: "Wallet Transfer",
        body: `You have received ${UtilityService.formatMoney(amount, currency)} from ${user.tag}.`,
      });
    }
  }

  async createBeneficiary(user: UserDocument, payload: CreateBeneficiaryDTO) {
    const {
      bank: bankId,
      accountNumber,
      accountName,
      beneficiaryType,
      beneficiaryTag,
      bankCode,
      currency,
    } = payload;

    let updateQuery: any = { type: beneficiaryType };
    let searchQuery: any = { user: user.id, isDeleted: false };

    if (beneficiaryType === BeneficiaryType.BankAccount) {
      const bank = await this.paymentService.fetchBankById(bankId);

      searchQuery.accountNumber = accountNumber;
      updateQuery = {
        ...updateQuery,
        bank: bank?.id,
        accountName,
        bankCode,
        currency,
      };
    } else {
      const beneficiaryUser = await this.userService.findUser({
        tag: beneficiaryTag,
        isDeleted: false,
      });

      if (!beneficiaryUser) {
        throw new BadRequestException(
          `invalid user tag passed: ${beneficiaryTag}`
        );
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
      .select("accountNumber accountName type currency");
  }

  async deleteBeneficiary(user: UserDocument, beneficiaryId: string) {
    await this.beneficiaryModel.updateOne(
      { _id: beneficiaryId, user: user.id },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );
  }

  async refundWalletTransaction(walletTxnId: string, description?: string) {
    const walletTransactionDebitToBeRefunded =
      await this.walletTransactionModel.findById(walletTxnId);

    if (!walletTransactionDebitToBeRefunded) {
      return;
    }

    const { currency, amount, user } = walletTransactionDebitToBeRefunded;
    await this.creditWallet({
      amount,
      currency,
      balanceKeys: [AVAILABLE_BALANCE],
      description: description || "Refund",
      reference: `refund_${walletTransactionDebitToBeRefunded.id}`,
      user: user as string,
      purpose: TransactionPurpose.REFUND,
      meta: { walletTransactionId: walletTransactionDebitToBeRefunded.id },
    });
  }

  async handleTransferHook(payload: TransferRecordDocument) {
    const { walletTransactionId } = payload.meta;

    if (!walletTransactionId) return;

    const walletTransaction = await this.walletTransactionModel
      .findById(walletTransactionId)
      .populate("user");
    if (!walletTransaction) return;

    const user = walletTransaction.user as UserDocument;
    const { amount, currency } = walletTransaction;

    switch (payload.status) {
      case TransferStatus.Successful:
        walletTransaction.status = TransactionStatus.Successful;
        this.revenueService.createRevenue({
          amount: walletTransaction.fee,
          source: RevenueSource.WALLET_WITHDRAWAL,
          currency: walletTransaction.currency,
          reference: `rev_${walletTransaction.id}`,
          meta: { walletTransactionId: walletTransaction.id },
        });
        this.emailService.sendWithdrawalNotification(user, amount, currency);
        this.fcmService.sendPushNotification(user, {
          title: "Wallet Withdrawal",
          body: `Your withdrawal of ${UtilityService.formatMoney(amount, currency)} from your wallet was successful.`,
        });
        break;

      case TransferStatus.Failed:
        walletTransaction.status = TransactionStatus.Failed;
        await this.refundWalletTransaction(
          walletTransaction.id,
          "Refund from failed withdrawal"
        );
        this.fcmService.sendPushNotification(user, {
          title: "Wallet Withdrawal",
          body: `Your withdrawal of ${UtilityService.formatMoney(amount, currency)} has failed, and the amount has been refunded.`,
        });
        break;

      default:
        return;
    }

    walletTransaction.completedAt = new Date();
    await walletTransaction.save();
  }

  async handleChargeHook(payload: IWebhookResponse<IWebhookCharge>) {
    const {
      data: { amount, channel, currency, meta, reference },
      event,
    } = payload;

    if (!meta.user) return;
    if (event !== WebhookEventEnum.ChargeSuccess) return;
    const description = `You funded your wallet using ${channel.replace(/_/g, " ")}`;
    await this.creditWallet({
      amount,
      balanceKeys: [AVAILABLE_BALANCE],
      currency,
      description,
      purpose: TransactionPurpose.DEPOSIT,
      reference,
      user: meta.user,
      meta,
    });

    const user = await this.userService.findUser({ _id: meta.user });
    this.emailService.sendWalletFundingNotification(user, amount, currency);
    this.fcmService.sendPushNotification(user, {
      title: "Wallet Funding",
      body: `You have successfully funded your wallet with ${UtilityService.formatMoney(amount, currency)}.`,
    });
  }
}
