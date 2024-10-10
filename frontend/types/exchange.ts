export interface IOffering {
  id: string;
  pfiName: string;
  pfiDid: string;
  description: string;
  payoutUnitsPerPayinUnit: number;
  payinCurrency: string;
  payoutCurrency: string;
  fee: number;
  status: string;
  pfiFee: number;
  pfi: IPfi;
  pfiOfferingId: string;
}

export interface IMatchedOffering {
  offerings: IOffering[];
  cumulativePayoutUnitsPerPayinUnit: number;
  cumulativeFee: number;
  payinCurrency: string;
  payoutCurrency: string;
  cumulativeSettlementTimeInSecs: number;
}

export interface IExchange {
  payinAmount: number;
  payoutAmount: number;
  payinCurrency: string;
  payoutCurrency: string;
  platformFee: number;
  totalPayinAmount: number;
  payoutUnitsPerPayinUnit: number;
  totalFee: number;
  status: string;
  id: string;
  createdAt: string;
  offerings: IOffering[];
  rating: number;
  comment: string;
  completionDate: string;
}

export interface IPfi {
  name: string;
  id: string;
  did: string;
}
