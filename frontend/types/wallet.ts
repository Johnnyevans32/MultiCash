interface WalletCurrency {
  withdrawalEnabled: boolean;
  fundingEnabled: boolean;
  transferFee: number;
  exchangePercentageFee: number;
  maxExchangeFee: number;
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
}

export interface IBank {
  currency: string;
  name: string;
  id: string;
  logo: string;
}
export interface IWalletAccount {
  accountNumber: string;
  accountName: string;
  bank: IBank;
  id: string;
}
