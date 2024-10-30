import type { IUser } from "./user";

interface WalletCurrency {
  withdrawalEnabled: boolean;
  fundingEnabled: boolean;
  currency: string;
  logo: string;
  name: string;
  id: string;
}

export interface IWallet {
  currency: string;
  availableBalance: number;
  walletCurrency: WalletCurrency;
  id: string;
}

interface WalletState {
  availableBalance: number;
  currency: string;
}

export interface IWalletTransaction {
  amount: number;
  description: string;
  type: string;
  purpose: string;
  walletStateAfter: WalletState;
  walletStateBefore: WalletState;
  id: string;
  createdAt: string;
  currency: string;
  note: string;
  status: string;
  transferReference: string;
}

export interface IBank {
  currency: string;
  name: string;
  id: string;
  logo: string;
}
export interface IBeneficiary {
  accountNumber: string;
  accountName: string;
  bank: IBank;
  id: string;
  beneficiaryUser: IUser;
  type: string;
  currency: string;
}
