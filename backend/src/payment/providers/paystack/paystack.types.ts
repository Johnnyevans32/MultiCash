export interface PaystackWebhookResponse<T> {
  event: PaystackWebhookEventEnum;
  data: T;
}

export enum PaystackWebhookEventEnum {
  TransferFailed = "transfer.failed",
  TransferSuccess = "transfer.success",

  ChargeSuccess = "charge.success",
}

export interface PaystackTransferData {
  amount: number;
  currency: string;
  domain: string;
  failures: any;
  id: number;
  reason: string;
  reference: string;
  source: string;
  source_details: any;
  status: string;
  titan_code: any;
  transfer_code: string;
  transferred_at: any;
  created_at: string;
  updated_at: string;
}

export type PaystackChargeData = {
  id: number;
  domain: string;
  status: string;
  reference: string;
  amount: number;
  message: any;
  gateway_response: string;
  paid_at: string;
  created_at: string;
  channel: string;
  currency: string;
  ip_address: string;
  metadata: any;
};
