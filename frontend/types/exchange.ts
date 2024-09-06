export interface IOffering {
  pfiName: string;
  pfiDid: string;
  description: string;
  payoutUnitsPerPayinUnit: number;
  payinCurrency: string;
  payoutCurrency: string;
  fee: number;
  status: string;
}

export interface IMatchedOffering {
  offerings: IOffering[];
  cumulativePayoutUnitsPerPayinUnit: number;
  cumulativeFee: number;
}

export interface IExchange {
  payinAmount: number;
  payoutAmount: number;
  payinCurrency: string;
  payoutCurrency: string;
  payoutUnitsPerPayinUnit: number;
  totalFee: number;
  status: string;
  id: string;
  createdAt: string;
  offerings: IOffering[];
}

export interface IPfi {
  name: string;
  id: string;
  did: string;
}
